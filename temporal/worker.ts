import { Worker, NativeConnection } from "@temporalio/worker";
import * as receiptActivities from "./activities/receipt-activities";
import * as expenseActivities from "./activities/expense-activities";

async function run() {
  console.log(
    "🔌 Conectando a Temporal Server en:",
    process.env.TEMPORAL_ADDRESS || "localhost:7233"
  );

  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
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
  await worker.run();
}

run().catch((err) => {
  console.error("❌ Error fatal en el worker:", err);
  process.exit(1);
});
