import { createClient } from "@supabase/supabase-js";
import { transcribeAudio } from "@/lib/openai/transcribe";
import { Database } from "@/lib/supabase/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function createBoletaRecord(
  tripId: string,
  fotoUrl: string,
  driverId: string
) {
  const { data, error } = await supabase
    .from("boletas")
    .insert({
      trip_id: tripId,
      url: fotoUrl,
      estado: "procesando",
      user_id: driverId,
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating boleta: ${error.message}`);
  return data;
}

export async function transcribeAudioActivity(audioUrl: string) {
  console.log("🎤 Transcribiendo audio...");
  const transcription = await transcribeAudio(audioUrl);
  return transcription;
}

export async function analyzeReceiptWithAI(payload: {
  image_url: string;
  conductor_description?: string;
}) {
  console.log("🤖 Analizando con IA Externa...");
  // Nota: Verifica que esta URL sea accesible desde donde corre el Worker
  const aiServiceUrl =
    "https://tahan-test.0cguqx.easypanel.host/analyze-receipt";

  const response = await fetch(aiServiceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`AI Service Error: ${response.statusText}`);
  return await response.json();
}

export async function updateBoletaWithAnalysis(
  boletaId: number,
  data: any,
  metadata: any
) {
  const { error } = await supabase
    .from("boletas")
    .update({
      ...data,
      estado: "espera",
      metadata: metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("boleta_id", boletaId);

  if (error) throw new Error(error.message);
}

export async function getTripInfo(tripId: string) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, driver_id")
    .eq("id", tripId)
    .single();
  if (error) throw new Error("Trip not found");
  return data;
}
