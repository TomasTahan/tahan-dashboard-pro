import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient } from "@/lib/temporal-client";
import { createExpenseWorkflow } from "@/temporal/workflows/create-expense.workflow";
import type { CreateExpenseInput } from "@/temporal/workflows/create-expense.workflow";

/**
 * Endpoint para crear gastos en Odoo usando Temporal
 *
 * Este endpoint inicia un workflow de Temporal y devuelve inmediatamente
 * el workflow_id para que el cliente pueda consultar el estado después.
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateExpenseInput = await req.json();
    const { boleta_id, product_id } = body;

    // Validaciones básicas
    if (!boleta_id) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "boleta_id is required",
        },
        { status: 400 }
      );
    }

    // Iniciar workflow de Temporal
    const client = await getTemporalClient();

    const workflowId = `create-expense-${boleta_id}-${Date.now()}`;

    const handle = await client.workflow.start(createExpenseWorkflow, {
      taskQueue: "tahan-main-queue",
      workflowId,
      args: [body],
    });

    console.log(`✅ Workflow iniciado: ${workflowId}`);

    // Devolver información del workflow
    return NextResponse.json(
      {
        success: true,
        message: "Expense creation started",
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
