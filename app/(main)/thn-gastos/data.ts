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

/**
 * Tipo para los choferes
 */
export type Driver = {
  user_id: string;
  nombre_completo: string;
  email: string;
  odoo_id: number | null;
};

/**
 * Tipo simplificado para el combobox
 */
export type DriverBasic = {
  user_id: string;
  nombre_completo: string;
};

/**
 * Obtiene todos los choferes desde la vista materializada drivers_info
 * Esta vista está optimizada para choferes (nivel_rank = 10) e incluye odoo_id
 */
export async function getDrivers(): Promise<Driver[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("drivers_info")
      .select("user_id, nombre_completo, email, odoo_id")
      .order("nombre_completo", { ascending: true });

    if (error) {
      console.error("Error fetching drivers:", error);
      return [];
    }

    return data
      ? data.map((d) => ({
          user_id: d.user_id!,
          nombre_completo: d.nombre_completo!,
          email: d.email!,
          odoo_id: d.odoo_id,
        }))
      : [];
  } catch (error) {
    console.error("Unexpected error in getDrivers:", error);
    return [];
  }
}

/**
 * Tipos para trips y boletas
 */
export type TripStatus = "planned" | "in_progress" | "completed" | "confirmed" | "pending_approval" | "on_hold" | "cancelled";

export type BoletaEstado = "creado" | "procesando" | "espera" | "confirmado" | "cancelado";

export type Boleta = {
  boleta_id: string;
  url: string | null;
  referencia: string | null;
  razon_social: string | null;
  date: string | null;
  total: number;
  moneda: string;
  descripcion: string | null;
  identificador_fiscal: string | null;
  estado: BoletaEstado;
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CurrencyGroup = {
  moneda: string;
  total_boletas: number;
  boletas_confirmadas: number;
  boletas_pendientes: number;
  boletas_canceladas: number;
  monto_gastado: number;
  boletas: Boleta[];
};

export type TripDetail = {
  id: string;
  trip_number: string;
  driver: string;
  driver_id: string | null;
  monto_adelantado: number;
  moneda_adelantado: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  created_at: string;
  currency_groups: CurrencyGroup[];
};

/**
 * Obtiene un viaje por ID con sus boletas agrupadas por moneda
 */
export async function getTripDetail(tripId: string): Promise<TripDetail | null> {
  const supabase = await createClient();

  try {
    // 1. Obtener información del trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      console.error("Error fetching trip:", tripError);
      return null;
    }

    // 2. Obtener todas las boletas del trip
    const { data: boletas, error: boletasError } = await supabase
      .from("boletas")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (boletasError) {
      console.error("Error fetching boletas:", boletasError);
      return null;
    }

    // 3. Agrupar boletas por moneda
    const currencyGroups = groupBoletasByCurrency(boletas || []);

    return {
      id: trip.id,
      trip_number: trip.trip_number,
      driver: trip.driver || "Sin conductor",
      driver_id: trip.driver_id,
      monto_adelantado: trip.monto_adelantado || 0,
      moneda_adelantado: trip.moneda_adelantado || "CLP",
      destination: trip.destination || "Sin destino",
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: trip.status,
      created_at: trip.created_at,
      currency_groups: currencyGroups,
    };
  } catch (error) {
    console.error("Unexpected error in getTripDetail:", error);
    return null;
  }
}

/**
 * Tipos para lista de trips
 */
export type TripListStatus = "planned" | "in_progress" | "completed" | "confirmed" | "pending_approval" | "on_hold" | "cancelled";

export interface TripListItem {
  id: string;
  trip_number: string;
  driver: string;
  driver_id: string | null;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: TripListStatus;
  monto_adelantado: number;
  moneda_adelantado: string;
  created_at: string;
  // Datos calculados desde boletas
  total_expenses: number;
  receipts_count: number;
}

/**
 * Obtiene todos los trips con sus estadísticas de boletas
 */
export async function getAllTrips(): Promise<TripListItem[]> {
  const supabase = await createClient();

  try {
    // 1. Obtener todos los trips
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (tripsError || !trips) {
      console.error("Error fetching trips:", tripsError);
      return [];
    }

    // 2. Para cada trip, obtener estadísticas de boletas
    const tripsWithStats = await Promise.all(
      trips.map(async (trip) => {
        // Obtener boletas confirmadas para calcular gastos totales
        const { data: boletas, error: boletasError } = await supabase
          .from("boletas")
          .select("total, estado")
          .eq("trip_id", trip.id);

        if (boletasError) {
          console.error(`Error fetching boletas for trip ${trip.id}:`, boletasError);
        }

        const confirmedBoletas = (boletas || []).filter((b) => b.estado === "confirmado");
        const totalExpenses = confirmedBoletas.reduce((sum, b) => sum + (b.total || 0), 0);

        return {
          id: trip.id,
          trip_number: trip.trip_number,
          driver: trip.driver || "Sin conductor",
          driver_id: trip.driver_id,
          destination: trip.destination || "Sin destino",
          start_date: trip.start_date,
          end_date: trip.end_date,
          status: trip.status as TripListStatus,
          monto_adelantado: trip.monto_adelantado || 0,
          moneda_adelantado: trip.moneda_adelantado || "CLP",
          created_at: trip.created_at,
          total_expenses: totalExpenses,
          receipts_count: boletas?.length || 0,
        };
      })
    );

    return tripsWithStats;
  } catch (error) {
    console.error("Unexpected error in getAllTrips:", error);
    return [];
  }
}

/**
 * Agrupa boletas por moneda y calcula estadísticas
 */
function groupBoletasByCurrency(boletas: any[]): CurrencyGroup[] {
  const grouped = boletas.reduce<Record<string, Boleta[]>>((acc, boleta) => {
    const moneda = boleta.moneda || "UNKNOWN";
    if (!acc[moneda]) {
      acc[moneda] = [];
    }
    acc[moneda].push({
      boleta_id: boleta.boleta_id.toString(),
      url: boleta.url,
      referencia: boleta.referencia,
      razon_social: boleta.razon_social,
      date: boleta.date,
      total: boleta.total || 0,
      moneda: boleta.moneda || "UNKNOWN",
      descripcion: boleta.descripcion,
      identificador_fiscal: boleta.identificador_fiscal,
      estado: boleta.estado,
      validated_at: boleta.validated_at,
      validated_by: boleta.validated_by,
      created_at: boleta.created_at,
      updated_at: boleta.updated_at,
    });
    return acc;
  }, {});

  return Object.entries(grouped).map(([moneda, boletasList]): CurrencyGroup => {
    const confirmadas = boletasList.filter((b) => b.estado === "confirmado");
    const pendientes = boletasList.filter((b) => b.estado === "espera");
    const canceladas = boletasList.filter((b) => b.estado === "cancelado");

    return {
      moneda,
      total_boletas: boletasList.length,
      boletas_confirmadas: confirmadas.length,
      boletas_pendientes: pendientes.length,
      boletas_canceladas: canceladas.length,
      monto_gastado: confirmadas.reduce((sum, b) => sum + b.total, 0),
      boletas: boletasList,
    };
  });
}
