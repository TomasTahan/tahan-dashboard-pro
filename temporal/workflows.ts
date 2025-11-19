import { proxyActivities } from "@temporalio/workflow";
import type * as receiptActivities from "./activities/receipt-activities";
import type * as expenseActivities from "./activities/expense-activities";

const activitiesReceipt = proxyActivities<typeof receiptActivities>({
  startToCloseTimeout: "3 minutes",
  retry: { maximumAttempts: 5 },
});

const activitiesExpense = proxyActivities<typeof expenseActivities>({
  startToCloseTimeout: "1 minute",
  retry: {
    initialInterval: "5 seconds",
    maximumAttempts: 10, // Odoo es inestable, insistimos
  },
});

// --- WORKFLOW 1: PROCESAMIENTO ---
export async function processReceiptWorkflow(params: {
  tripId: string;
  fotoUrl: string;
  conductorDescription?: string;
  audioUrl?: string;
}) {
  const trip = await activitiesReceipt.getTripInfo(params.tripId);

  // Crear registro inicial
  const boleta = await activitiesReceipt.createBoletaRecord(
    params.tripId,
    params.fotoUrl,
    trip.driver_id
  );

  let finalDescription = params.conductorDescription;
  let metadata: any = {};

  // Transcripción
  if (params.audioUrl) {
    const transcription = await activitiesReceipt.transcribeAudioActivity(
      params.audioUrl
    );
    finalDescription = transcription.text;
    metadata = { ...metadata, audio_transcription: transcription };
  }

  // Análisis IA
  const aiPayload = {
    image_url: params.fotoUrl,
    conductor_description: finalDescription,
  };
  const analysis = await activitiesReceipt.analyzeReceiptWithAI(aiPayload);

  if (analysis.keywords) metadata.ai_keywords = analysis.keywords;

  // Guardar
  await activitiesReceipt.updateBoletaWithAnalysis(
    boleta.boleta_id,
    {
      referencia: analysis.referencia,
      total: analysis.total,
      moneda: analysis.moneda,
      descripcion: analysis.descripcion,
      identificador_fiscal: analysis.identificador_fiscal,
      razon_social: analysis.razon_social,
      date: analysis.date,
    },
    metadata
  );

  return { success: true, boletaId: boleta.boleta_id };
}

// --- WORKFLOW 2: CREACIÓN GASTO ODOO ---
export async function createExpenseWorkflow(params: {
  boletaId: number;
  productId?: number;
}) {
  // 1. Obtener Datos Crudos
  const boletaData = await activitiesExpense.getBoletaDetails(params.boletaId);
  const driverInfo = await activitiesExpense.getDriverOdooInfo(
    boletaData.trips.driver_id
  );

  // 2. Determinar Categoría (Si no viene forzada)
  let categoryId = params.productId;
  if (!categoryId) {
    const match = await activitiesExpense.determineCategoryActivity(
      boletaData.descripcion,
      boletaData.metadata?.ai_keywords
    );
    categoryId = match?.odoo_id;
  }

  if (!categoryId) throw new Error("No se pudo determinar categoría para Odoo");

  // 3. Preparar Payload (Activity pura para evitar lógica date en workflow)
  const expensePayload = await activitiesExpense.prepareExpensePayload(
    boletaData,
    driverInfo.odoo_id,
    categoryId
  );

  // 4. Crear en Odoo
  const odooId = await activitiesExpense.createOdooExpense(expensePayload);

  // 5. Confirmar
  await activitiesExpense.confirmBoletaInDb(params.boletaId, odooId);

  return { success: true, odooId };
}
