import { Worker, NativeConnection } from "@temporalio/worker";
import * as receiptActivities from "./activities/receipt-activities";
import * as expenseActivities from "./activities/expense-activities";
import express from "express";
import { Client, Connection } from "@temporalio/client";

const app = express();
app.use(express.json());

let temporalClient: Client;

async function startWorker() {
  console.log(
    "🔌 Conectando a Temporal Server en:",
    process.env.TEMPORAL_ADDRESS || "temporal-server:7233"
  );

  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || "temporal-server:7233",
  });

  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "tahan-gastos-queue",
    workflowsPath: require.resolve("./workflows"),
    activities: {
      ...receiptActivities,
      ...expenseActivities,
    },
  });

  console.log(
    "👷 Worker iniciado y esperando tareas en 'tahan-gastos-queue'..."
  );

  // No usar await aquí para que no bloquee
  worker.run().catch((err) => {
    console.error("❌ Error fatal en el worker:", err);
    process.exit(1);
  });

  return connection;
}

async function startHttpServer(connection: NativeConnection) {
  // Crear cliente para iniciar workflows
  temporalClient = new Client({ connection });

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

  const PORT = process.env.HTTP_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 HTTP Server escuchando en puerto ${PORT}`);
    console.log(`   POST /api/process-receipt`);
    console.log(`   POST /api/create-expense`);
    console.log(`   GET  /health`);
  });
}

async function run() {
  const connection = await startWorker();
  await startHttpServer(connection);
}

run().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
