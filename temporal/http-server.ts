import express from "express";
import { Client, Connection } from "@temporalio/client";

const app = express();
app.use(express.json());

let temporalClient: Client;

// Inicializar cliente de Temporal
async function initTemporal() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || "temporal-server:7233",
    tls: false,
  });

  temporalClient = new Client({ connection });
  console.log("✅ Conectado a Temporal Server");
}

// Endpoint: Procesar boleta
app.post("/api/process-receipt", async (req, res) => {
  try {
    const { trip_id, fotoUrl, conductorDescription, audioUrl } = req.body;

    if (!trip_id || !fotoUrl) {
      return res.status(400).json({ error: "trip_id y fotoUrl son requeridos" });
    }

    const handle = await temporalClient.workflow.start("processReceiptWorkflow", {
      taskQueue: "tahan-gastos-queue",
      args: [{
        tripId: trip_id,
        fotoUrl,
        conductorDescription,
        audioUrl,
      }],
      workflowId: `receipt-${trip_id}-${Date.now()}`,
    });

    res.json({
      success: true,
      message: "Análisis iniciado en segundo plano",
      workflowId: handle.workflowId,
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Error iniciando workflow",
      details: error.message,
    });
  }
});

// Endpoint: Crear gasto en Odoo
app.post("/api/create-expense", async (req, res) => {
  try {
    const { boleta_id, product_id } = req.body;

    if (!boleta_id) {
      return res.status(400).json({ error: "boleta_id es requerido" });
    }

    const handle = await temporalClient.workflow.start("createExpenseWorkflow", {
      taskQueue: "tahan-gastos-queue",
      args: [{ boletaId: boleta_id, productId: product_id }],
      workflowId: `expense-${boleta_id}-${Date.now()}`,
    });

    res.json({
      success: true,
      message: "Creación de gasto iniciada en Odoo",
      workflowId: handle.workflowId,
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Error iniciando workflow",
      details: error.message,
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "temporal-worker-http" });
});

// Iniciar servidor
const PORT = process.env.HTTP_PORT || 3001;

async function start() {
  await initTemporal();

  app.listen(PORT, () => {
    console.log(`🚀 HTTP Server escuchando en puerto ${PORT}`);
    console.log(`   POST /api/process-receipt`);
    console.log(`   POST /api/create-expense`);
  });
}

start().catch(console.error);
