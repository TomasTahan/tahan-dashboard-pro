import { NextRequest, NextResponse } from "next/server";
import { getTemporalClient } from "@/lib/temporal-client";

/**
 * Endpoint para consultar el estado de un workflow
 *
 * GET /api/workflow-status/[workflowId]
 *
 * Devuelve:
 * - status: "running" | "completed" | "failed" | "terminated"
 * - result: Resultado del workflow (si completó)
 * - error: Error (si falló)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const { workflowId } = params;

    if (!workflowId) {
      return NextResponse.json(
        {
          error: "Missing workflowId",
          message: "workflowId is required",
        },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();

    // Obtener handle del workflow
    const handle = client.workflow.getHandle(workflowId);

    // Describir el workflow para obtener su estado
    const description = await handle.describe();

    // Determinar el estado
    let status: "running" | "completed" | "failed" | "terminated" | "cancelled";
    let result: any = null;
    let error: any = null;

    if (description.status.name === "RUNNING") {
      status = "running";
    } else if (description.status.name === "COMPLETED") {
      status = "completed";
      // Obtener resultado
      try {
        result = await handle.result();
      } catch (err) {
        console.error("Error getting workflow result:", err);
      }
    } else if (description.status.name === "FAILED") {
      status = "failed";
      // Intentar obtener el error
      try {
        await handle.result();
      } catch (err) {
        error = {
          message: err instanceof Error ? err.message : "Unknown error",
          type: err instanceof Error ? err.name : "Error",
        };
      }
    } else if (description.status.name === "TERMINATED") {
      status = "terminated";
    } else if (description.status.name === "CANCELLED") {
      status = "cancelled";
    } else {
      status = "running"; // Fallback
    }

    return NextResponse.json({
      workflow_id: workflowId,
      status,
      workflow_type: description.type,
      start_time: description.startTime,
      close_time: description.closeTime,
      execution_time_ms: description.closeTime
        ? new Date(description.closeTime).getTime() -
          new Date(description.startTime).getTime()
        : null,
      result: status === "completed" ? result : null,
      error: status === "failed" ? error : null,
    });
  } catch (error) {
    console.error("Error getting workflow status:", error);

    // Si el workflow no existe
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "Workflow not found",
          message: `Workflow with id ${params.workflowId} does not exist`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get workflow status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
