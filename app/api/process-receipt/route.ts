import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { transcribeAudio, isValidAudioUrl } from "@/lib/openai/transcribe";

// Cliente de Supabase con secret key para bypasear RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Timeout para la request (aumentado para transcripción)
export const maxDuration = 120;

interface ProcessReceiptPayload {
  trip_id: string;
  fotoUrl: string;
  conductor_description?: string; // Descripción escrita por el conductor
  audioUrl?: string; // URL del audio grabado por el conductor (alternativa a conductor_description)
}

interface AIAnalysisResponse {
  referencia: string;
  razon_social: string;
  date: string;
  total: number;
  moneda: string;
  descripcion: string;
  identificador_fiscal: string;
  keywords?: string[]; // NUEVO: Keywords sugeridas por la IA
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validar el payload
    const body: ProcessReceiptPayload = await req.json();
    const { trip_id, fotoUrl, conductor_description, audioUrl } = body;

    if (!trip_id || !fotoUrl) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "trip_id and fotoUrl are required",
        },
        { status: 400 }
      );
    }

    // Validar que no vengan ambos (texto y audio)
    if (conductor_description && audioUrl) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          message:
            "No puedes enviar conductor_description y audioUrl al mismo tiempo. Elige uno.",
        },
        { status: 400 }
      );
    }

    // Validar URL de audio si viene
    if (audioUrl && !isValidAudioUrl(audioUrl)) {
      return NextResponse.json(
        {
          error: "Invalid audio URL",
          message: "La URL del audio debe ser HTTPS y válida",
        },
        { status: 400 }
      );
    }

    // Validar que el trip existe
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id, driver_id")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json(
        {
          error: "Trip not found",
          message: `Trip with id ${trip_id} does not exist`,
        },
        { status: 404 }
      );
    }

    // 2. Crear la boleta inicial en estado "creado"
    const { data: boleta, error: boletaError } = await supabaseAdmin
      .from("boletas")
      .insert({
        trip_id: trip_id,
        url: fotoUrl,
        estado: "creado",
        user_id: trip.driver_id, // Asignar al conductor del viaje
      })
      .select()
      .single();

    if (boletaError || !boleta) {
      return NextResponse.json(
        {
          error: "Failed to create boleta",
          message: boletaError?.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    // 3. Cambiar estado a "procesando" antes de llamar a la IA
    await supabaseAdmin
      .from("boletas")
      .update({ estado: "procesando" })
      .eq("boleta_id", boleta.boleta_id);

    // 4. Si hay audio, transcribirlo primero
    let transcribedText: string | undefined = conductor_description;

    if (audioUrl) {
      try {
        console.log("Transcribiendo audio...");
        const transcription = await transcribeAudio(audioUrl);
        transcribedText = transcription.text;
        console.log(`Audio transcrito: "${transcribedText}"`);

        // Guardar la transcripción en metadata para referencia
        await supabaseAdmin
          .from("boletas")
          .update({
            metadata: {
              audio_url: audioUrl,
              transcription: transcribedText,
              transcription_language: transcription.language,
              transcription_duration: transcription.duration,
            },
          })
          .eq("boleta_id", boleta.boleta_id);
      } catch (transcriptionError) {
        console.error("Error transcribiendo audio:", transcriptionError);

        // Marcar la boleta con error de transcripción
        await supabaseAdmin
          .from("boletas")
          .update({
            estado: "espera",
            metadata: {
              error: "Audio transcription failed",
              error_details:
                transcriptionError instanceof Error
                  ? transcriptionError.message
                  : "Unknown error",
              audio_url: audioUrl,
            },
          })
          .eq("boleta_id", boleta.boleta_id);

        return NextResponse.json(
          {
            error: "Audio transcription failed",
            message:
              transcriptionError instanceof Error
                ? transcriptionError.message
                : "Unknown error",
            boleta_id: boleta.boleta_id,
            status: "partial_success",
          },
          { status: 500 }
        );
      }
    }

    // 5. Llamar al servicio de IA para analizar la boleta
    let aiResponse: AIAnalysisResponse;

    try {
      const aiServiceUrl = "https://tahan-test.0cguqx.easypanel.host/analyze-receipt";

      // Preparar el payload para la IA
      const aiPayload: { image_url: string; conductor_description?: string } = {
        image_url: fotoUrl,
      };

      // Incluir descripción del conductor (ya sea texto directo o transcripción de audio)
      if (transcribedText && transcribedText.trim()) {
        aiPayload.conductor_description = transcribedText.trim();
        const source = audioUrl ? "audio transcrito" : "texto directo";
        console.log(`Incluyendo descripción del conductor (${source}): "${transcribedText}"`);
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

      aiResponse = await aiResult.json();
    } catch (aiError) {
      // Si falla el análisis de IA, marcar la boleta como error en metadata
      await supabaseAdmin
        .from("boletas")
        .update({
          estado: "espera", // Dejamos en espera para revisión manual
          metadata: {
            error: "AI analysis failed",
            error_details: aiError instanceof Error ? aiError.message : "Unknown error",
          },
        })
        .eq("boleta_id", boleta.boleta_id);

      return NextResponse.json(
        {
          error: "AI analysis failed",
          message: aiError instanceof Error ? aiError.message : "Unknown error",
          boleta_id: boleta.boleta_id,
          status: "partial_success",
        },
        { status: 500 }
      );
    }

    // 6. Actualizar la boleta con los datos extraídos y cambiar a "espera"
    // Guardar keywords en metadata si están disponibles
    const metadata: Record<string, any> = {};

    if (aiResponse.keywords && aiResponse.keywords.length > 0) {
      metadata.ai_keywords = aiResponse.keywords;
      console.log(`Keywords generadas por IA: ${aiResponse.keywords.join(", ")}`);
    }

    // Guardar la descripción (texto directo o transcripción)
    if (transcribedText) {
      metadata.conductor_description = transcribedText;
    }

    // Si había audio, guardar info adicional
    if (audioUrl) {
      metadata.audio_url = audioUrl;
      metadata.audio_transcribed = true;
    }

    const { data: updatedBoleta, error: updateError } = await supabaseAdmin
      .from("boletas")
      .update({
        referencia: aiResponse.referencia,
        razon_social: aiResponse.razon_social,
        date: aiResponse.date,
        total: aiResponse.total,
        moneda: aiResponse.moneda,
        descripcion: aiResponse.descripcion,
        identificador_fiscal: aiResponse.identificador_fiscal,
        estado: "espera",
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        updated_at: new Date().toISOString(),
      })
      .eq("boleta_id", boleta.boleta_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to update boleta",
          message: updateError.message,
          boleta_id: boleta.boleta_id,
        },
        { status: 500 }
      );
    }

    // 6. Retornar respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        message: "Receipt processed successfully",
        data: {
          boleta_id: updatedBoleta.boleta_id,
          trip_id: updatedBoleta.trip_id,
          estado: updatedBoleta.estado,
          extracted_data: {
            referencia: updatedBoleta.referencia,
            razon_social: updatedBoleta.razon_social,
            date: updatedBoleta.date,
            total: updatedBoleta.total,
            moneda: updatedBoleta.moneda,
            descripcion: updatedBoleta.descripcion,
            identificador_fiscal: updatedBoleta.identificador_fiscal,
            keywords: aiResponse.keywords || [],
          },
          metadata: updatedBoleta.metadata,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
