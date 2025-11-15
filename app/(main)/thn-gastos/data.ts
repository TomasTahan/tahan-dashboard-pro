// Este archivo maneja la obtención de datos desde el servidor
import { createClient } from "@/lib/supabase/server";

export type Receipt = {
  id: string;
  referencia: string;
  razon_social: string;
  date: string;
  total: number;
  moneda: string;
  descripcion: string;
  identificador_fiscal: string;
  url: string;
};

// Datos de ejemplo - reemplazar con consulta real a Supabase
const SAMPLE_RECEIPTS: Receipt[] = [
  {
    id: "1",
    referencia: "001-014-0004807",
    razon_social: "GAMAX S.R.L.",
    date: "21/06/2025 00:49:00",
    total: 600000.0,
    moneda: "PYG",
    descripcion: "FACTURA CONTADO",
    identificador_fiscal: "80046174-6",
    url: "https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/boletas/boleta1.jpeg",
  },
  {
    id: "2",
    referencia: "0021 - 135497",
    razon_social: "Municipalidad de Clorinda",
    date: "13/06/2025",
    total: 5600.0,
    moneda: "ARS",
    descripcion:
      "DERECHOS Y/O TASAS POR SERVICIOS DE INSPECCION BROMATOLOGICA DE PRODUCTOS DE ORIGEN ANIMAL Y VEGETAL, DESINFECCIÓN Y DESRATIZACIÓN",
    identificador_fiscal: "30-99921501-3",
    url: "https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/boletas/boleta2.jpeg",
  },
  {
    id: "3",
    referencia: "00047382",
    razon_social: "ENTE DE CONTROL DE RUTAS PROVINCIALES",
    date: "24/06/2025 17:34:50",
    total: 4000.0,
    moneda: "ARS",
    descripcion: "A CONSUMIDOR FINAL",
    identificador_fiscal: "30707017690",
    url: "https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/boletas/boleta3.jpeg",
  },
];

/**
 * Obtiene una boleta pendiente de aprobación
 * Consulta a Supabase para obtener la siguiente boleta que necesita ser revisada
 */
export async function getPendingReceipt(
  receiptId?: string
): Promise<Receipt | null> {
  const supabase = await createClient();

  try {
    if (receiptId) {
      // Si se proporciona un ID específico, buscar esa boleta
      const { data, error } = await supabase
        .from("boletas")
        .select("*")
        .eq("boleta_id", receiptId)
        .eq("estado", "espera")
        .single();

      if (error) {
        console.error("Error fetching receipt by ID:", error);
        return null;
      }

      return data ? mapBoletaToReceipt(data) : null;
    } else {
      // Si no se proporciona ID, obtener la siguiente boleta pendiente
      const { data, error } = await supabase
        .from("boletas")
        .select("*")
        .eq("estado", "espera")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching pending receipt:", error);
        return null;
      }

      return data ? mapBoletaToReceipt(data) : null;
    }
  } catch (error) {
    console.error("Unexpected error in getPendingReceipt:", error);
    return null;
  }
}

/**
 * Mapea los campos de la tabla boletas a nuestro tipo Receipt
 */
function mapBoletaToReceipt(boleta: any): Receipt {
  return {
    id: boleta.boleta_id.toString(),
    referencia: boleta.referencia || "",
    razon_social: boleta.razon_social || "",
    date: boleta.date || "",
    total: boleta.total || 0,
    moneda: boleta.moneda || "",
    descripcion: boleta.descripcion || "",
    identificador_fiscal: boleta.identificador_fiscal || "",
    url: boleta.url || "",
  };
}

/**
 * Obtiene todas las boletas pendientes
 */
export async function getAllPendingReceipts(): Promise<Receipt[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("boletas")
      .select("*")
      .eq("estado", "espera")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching all pending receipts:", error);
      return [];
    }

    return data ? data.map(mapBoletaToReceipt) : [];
  } catch (error) {
    console.error("Unexpected error in getAllPendingReceipts:", error);
    return [];
  }
}

/**
 * Obtiene el conteo de boletas pendientes
 */
export async function getPendingReceiptsCount(): Promise<number> {
  const supabase = await createClient();

  try {
    const { count, error } = await supabase
      .from("boletas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "espera");

    if (error) {
      console.error("Error counting pending receipts:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Unexpected error in getPendingReceiptsCount:", error);
    return 0;
  }
}

/**
 * Información de navegación para una boleta
 */
export type ReceiptNavigationInfo = {
  previousId: string | null;
  nextId: string | null;
  currentIndex: number;
  totalCount: number;
};

/**
 * Obtiene la información de navegación para una boleta específica
 */
export async function getReceiptNavigationInfo(
  receiptId: string
): Promise<ReceiptNavigationInfo> {
  const supabase = await createClient();

  try {
    // Obtener todas las boletas pendientes ordenadas
    const { data: allReceipts, error } = await supabase
      .from("boletas")
      .select("boleta_id")
      .eq("estado", "espera")
      .order("created_at", { ascending: true });

    if (error || !allReceipts) {
      console.error("Error fetching navigation info:", error);
      return {
        previousId: null,
        nextId: null,
        currentIndex: 1,
        totalCount: 1,
      };
    }

    // Encontrar el índice de la boleta actual
    const currentIndex = allReceipts.findIndex(
      (r) => r.boleta_id.toString() === receiptId
    );

    if (currentIndex === -1) {
      return {
        previousId: null,
        nextId: null,
        currentIndex: 1,
        totalCount: allReceipts.length,
      };
    }

    const previousId =
      currentIndex > 0
        ? allReceipts[currentIndex - 1].boleta_id.toString()
        : null;
    const nextId =
      currentIndex < allReceipts.length - 1
        ? allReceipts[currentIndex + 1].boleta_id.toString()
        : null;

    return {
      previousId,
      nextId,
      currentIndex: currentIndex + 1, // 1-indexed para mostrar al usuario
      totalCount: allReceipts.length,
    };
  } catch (error) {
    console.error("Unexpected error in getReceiptNavigationInfo:", error);
    return {
      previousId: null,
      nextId: null,
      currentIndex: 1,
      totalCount: 1,
    };
  }
}
