import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient } from "@/temporal/client";

export const maxDuration = 10; // Ahora es super rápido, no necesitamos 60s

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validación mínima requerida
    if (!body.trip_id || !body.fotoUrl) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    const handle = await client.workflow.start("processReceiptWorkflow", {
      taskQueue: "tahan-gastos-queue",
      args: [body],
      workflowId: `receipt-${body.trip_id}-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Análisis iniciado en segundo plano",
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
