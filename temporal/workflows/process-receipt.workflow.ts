import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/receipt.activities";

// Configurar timeouts para las actividades
const {
  createBoletaRecord,
  transcribeAudioIfProvided,
  analyzeReceiptWithAI,
  updateBoletaWithResults
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
  retry: {
    maximumAttempts: 3,
  },
});

export interface ProcessReceiptInput {
  trip_id: string;
  fotoUrl: string;
  conductor_description?: string;
  audioUrl?: string;
}

export interface ProcessReceiptOutput {
  success: boolean;
  boleta_id: number;
  estado: string;
  extracted_data: {
    referencia?: string;
    razon_social?: string;
    date?: string;
    total?: number;
    moneda?: string;
    descripcion?: string;
    identificador_fiscal?: string;
    keywords?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Workflow para procesar recibos/boletas
 *
 * Pasos:
 * 1. Crear registro inicial en Supabase
 * 2. Transcribir audio si está disponible
 * 3. Analizar recibo con IA
 * 4. Actualizar registro con datos extraídos
 */
export async function processReceiptWorkflow(
  input: ProcessReceiptInput
): Promise<ProcessReceiptOutput> {
  // 1. Crear boleta inicial en estado "creado"
  const boleta = await createBoletaRecord(input);

  // 2. Transcribir audio si está disponible
  const transcription = await transcribeAudioIfProvided({
    audioUrl: input.audioUrl,
    conductor_description: input.conductor_description,
    boleta_id: boleta.boleta_id,
  });

  // 3. Analizar recibo con IA
  const aiAnalysis = await analyzeReceiptWithAI({
    fotoUrl: input.fotoUrl,
    conductor_description: transcription.text,
    boleta_id: boleta.boleta_id,
  });

  // 4. Actualizar boleta con resultados
  const result = await updateBoletaWithResults({
    boleta_id: boleta.boleta_id,
    aiAnalysis,
    transcription,
  });

  return result;
}
