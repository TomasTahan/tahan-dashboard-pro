import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities/receipt.activities";
import * as expenseActivities from "./activities/expense.activities";

/**
 * Worker de Temporal para procesar workflows
 *
 * Este worker debe ejecutarse en un servidor separado (VPS).
 * Configurar variables de entorno antes de ejecutar:
 * - TEMPORAL_ADDRESS: URL del servidor Temporal
 * - TEMPORAL_NAMESPACE: Namespace a usar (default: "default")
 * - Todas las variables de Next.js (SUPABASE_*, ODOO_*, OPENAI_API_KEY)
 */
async function run() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS || "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE || "default";

  console.log(`= Conectando a Temporal: ${temporalAddress}`);
  console.log(`=æ Namespace: ${namespace}`);

  // Conectar a Temporal Server
  const connection = await NativeConnection.connect({
    address: temporalAddress,
  });

  // Crear worker
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: "tahan-main-queue",
    workflowsPath: require.resolve("./workflows"),
    activities: {
      ...activities,
      ...expenseActivities,
    },
  });

  console.log(" Worker iniciado y escuchando workflows...");
  console.log(`=Ë Task Queue: tahan-main-queue`);
  console.log(`=Á Workflows: process-receipt, create-expense\n`);

  // Ejecutar worker
  await worker.run();
}

run().catch((err) => {
  console.error("L Error fatal en worker:", err);
  process.exit(1);
});
