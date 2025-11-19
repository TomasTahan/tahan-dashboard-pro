import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient } from "@/temporal/client";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { boleta_id, product_id } = body;

    if (!boleta_id) {
      return NextResponse.json(
        { error: "boleta_id is required" },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    const handle = await client.workflow.start("createExpenseWorkflow", {
      taskQueue: "tahan-gastos-queue",
      args: [{ boletaId: boleta_id, productId: product_id }],
      workflowId: `expense-${boleta_id}-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Creación de gasto iniciada en Odoo",
      workflowId: handle.workflowId,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Error iniciando workflow", details: e.message },
      { status: 500 }
    );
  }
}
