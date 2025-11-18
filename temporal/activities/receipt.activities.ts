import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { transcribeAudio, isValidAudioUrl } from "@/lib/openai/transcribe";
import type { ProcessReceiptInput } from "../workflows/process-receipt.workflow.js";

// Cliente de Supabase con secret key para bypasear RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

interface AIAnalysisResponse {
  referencia: string;
  razon_social: string;
  date: string;
  total: number;
  moneda: string;
  descripcion: string;
  identificador_fiscal: string;
  keywords?: string[];
}

/**
 * Activity: Crear registro inicial de boleta
 */
export async function createBoletaRecord(input: ProcessReceiptInput) {
  // Validar que el trip existe
  const { data: trip, error: tripError } = await supabaseAdmin
    .from("trips")
    .select("id, driver_id")
    .eq("id", input.trip_id)
    .single();

  if (tripError || !trip) {
    throw new Error(`Trip with id ${input.trip_id} does not exist`);
  }

  // Crear la boleta inicial
  const { data: boleta, error: boletaError } = await supabaseAdmin
    .from("boletas")
    .insert({
      trip_id: input.trip_id,
      url: input.fotoUrl,
      estado: "procesando",
      user_id: trip.driver_id,
    })
    .select()
    .single();

  if (boletaError || !boleta) {
    throw new Error(`Failed to create boleta: ${boletaError?.message}`);
  }

  return boleta;
}

/**
 * Activity: Transcribir audio si está disponible
 */
export async function transcribeAudioIfProvided(input: {
  audioUrl?: string;
  conductor_description?: string;
  boleta_id: number;
}): Promise<{ text?: string; metadata?: Record<string, any> }> {
  // Si no hay audio, devolver descripción de texto directo
  if (!input.audioUrl) {
    return {
      text: input.conductor_description,
      metadata: undefined,
    };
  }

  // Validar URL de audio
  if (!isValidAudioUrl(input.audioUrl)) {
    throw new Error("Invalid audio URL");
  }

  try {
    console.log("Transcribiendo audio...");
    const transcription = await transcribeAudio(input.audioUrl);
    const transcribedText = transcription.text;

    console.log(`Audio transcrito: "${transcribedText}"`);

    // Guardar transcripción en metadata
    const metadata = {
      audio_url: input.audioUrl,
      transcription: transcribedText,
      transcription_language: transcription.language,
      transcription_duration: transcription.duration,
    };

    await supabaseAdmin
      .from("boletas")
      .update({ metadata })
      .eq("boleta_id", input.boleta_id);

    return {
      text: transcribedText,
      metadata,
    };
  } catch (error) {
    console.error("Error transcribiendo audio:", error);

    // Guardar error en metadata
    await supabaseAdmin
      .from("boletas")
      .update({
        estado: "espera",
        metadata: {
          error: "Audio transcription failed",
          error_details: error instanceof Error ? error.message : "Unknown error",
          audio_url: input.audioUrl,
        },
      })
      .eq("boleta_id", input.boleta_id);

    throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Activity: Analizar recibo con IA
 */
export async function analyzeReceiptWithAI(input: {
  fotoUrl: string;
  conductor_description?: string;
  boleta_id: number;
}): Promise<AIAnalysisResponse> {
  try {
    const aiServiceUrl = "https://tahan-test.0cguqx.easypanel.host/analyze-receipt";

    const aiPayload: { image_url: string; conductor_description?: string } = {
      image_url: input.fotoUrl,
    };

    if (input.conductor_description?.trim()) {
      aiPayload.conductor_description = input.conductor_description.trim();
      console.log(`Incluyendo descripción del conductor: "${input.conductor_description}"`);
    }

    const aiResult = await fetch(aiServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResult.ok) {
      throw new Error(`AI service returned ${aiResult.status}: ${aiResult.statusText}`);
    }

    const aiResponse = await aiResult.json() as AIAnalysisResponse;
    return aiResponse;
  } catch (error) {
    console.error("Error en análisis de IA:", error);

    // Marcar boleta con error
    await supabaseAdmin
      .from("boletas")
      .update({
        estado: "espera",
        metadata: {
          error: "AI analysis failed",
          error_details: error instanceof Error ? error.message : "Unknown error",
        },
      })
      .eq("boleta_id", input.boleta_id);

    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Activity: Actualizar boleta con resultados
 */
export async function updateBoletaWithResults(input: {
  boleta_id: number;
  aiAnalysis: AIAnalysisResponse;
  transcription: { text?: string; metadata?: Record<string, any> };
}) {
  const metadata: Record<string, any> = {
    ...input.transcription.metadata,
  };

  // Guardar keywords de IA
  if (input.aiAnalysis.keywords && input.aiAnalysis.keywords.length > 0) {
    metadata.ai_keywords = input.aiAnalysis.keywords;
    console.log(`Keywords generadas por IA: ${input.aiAnalysis.keywords.join(", ")}`);
  }

  // Guardar descripción del conductor
  if (input.transcription.text) {
    metadata.conductor_description = input.transcription.text;
  }

  const { data: updatedBoleta, error: updateError } = await supabaseAdmin
    .from("boletas")
    .update({
      referencia: input.aiAnalysis.referencia,
      razon_social: input.aiAnalysis.razon_social,
      date: input.aiAnalysis.date,
      total: input.aiAnalysis.total,
      moneda: input.aiAnalysis.moneda,
      descripcion: input.aiAnalysis.descripcion,
      identificador_fiscal: input.aiAnalysis.identificador_fiscal,
      estado: "espera",
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      updated_at: new Date().toISOString(),
    })
    .eq("boleta_id", input.boleta_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update boleta: ${updateError.message}`);
  }

  return {
    success: true,
    boleta_id: updatedBoleta.boleta_id,
    estado: updatedBoleta.estado,
    extracted_data: {
      referencia: updatedBoleta.referencia || undefined,
      razon_social: updatedBoleta.razon_social || undefined,
      date: updatedBoleta.date || undefined,
      total: updatedBoleta.total || undefined,
      moneda: updatedBoleta.moneda || undefined,
      descripcion: updatedBoleta.descripcion || undefined,
      identificador_fiscal: updatedBoleta.identificador_fiscal || undefined,
      keywords: input.aiAnalysis.keywords || [],
    },
    metadata: updatedBoleta.metadata as Record<string, any> | undefined,
  };
}
