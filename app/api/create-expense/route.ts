import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";

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

    // Llamar al worker via HTTP
    const response = await fetch(`${WORKER_URL}/api/create-expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boleta_id, product_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error del worker");
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Error iniciando workflow", details: e.message },
      { status: 500 }
    );
  }
}
