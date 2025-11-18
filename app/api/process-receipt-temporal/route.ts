import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient } from "@/lib/temporal-client";
import { processReceiptWorkflow } from "@/temporal/workflows/process-receipt.workflow";
import type { ProcessReceiptInput } from "@/temporal/workflows/process-receipt.workflow";

/**
 * Endpoint para procesar boletas usando Temporal
 *
 * Este endpoint inicia un workflow de Temporal y devuelve inmediatamente
 * el workflow_id para que el cliente pueda consultar el estado después.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ProcessReceiptInput = await req.json();
    const { trip_id, fotoUrl, conductor_description, audioUrl } = body;

    // Validaciones básicas
    if (!trip_id || !fotoUrl) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "trip_id and fotoUrl are required",
        },
        { status: 400 }
      );
    }

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

    // Iniciar workflow de Temporal
    const client = await getTemporalClient();

    const workflowId = `process-receipt-${trip_id}-${Date.now()}`;

    const handle = await client.workflow.start(processReceiptWorkflow, {
      taskQueue: "tahan-main-queue",
      workflowId,
      args: [body],
    });

    console.log(`✅ Workflow iniciado: ${workflowId}`);

    // Devolver información del workflow
    return NextResponse.json(
      {
        success: true,
        message: "Receipt processing started",
        workflow: {
          workflow_id: handle.workflowId,
          run_id: handle.firstExecutionRunId,
          status: "running",
        },
        // URL para consultar el estado
        status_url: `/api/workflow-status/${handle.workflowId}`,
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    console.error("Error starting workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to start workflow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
