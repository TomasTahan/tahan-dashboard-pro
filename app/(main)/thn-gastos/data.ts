// Este archivo maneja la obtención de datos desde el servidor
// En el futuro, esto se conectará a tu base de datos Supabase

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
 * En producción, esto consultará a Supabase para obtener la siguiente boleta
 * que necesita ser revisada por el trabajador
 */
export async function getPendingReceipt(
  receiptId?: string
): Promise<Receipt | null> {
  // TODO: Implementar consulta a Supabase
  // const supabase = createClient();
  // const { data, error } = await supabase
  //   .from('boletas')
  //   .select('*')
  //   .eq('estado', 'pendiente')
  //   .order('created_at', { ascending: true })
  //   .limit(1)
  //   .single();
  //
  // if (error || !data) return null;
  // return data as Receipt;

  // Por ahora, simulamos con datos de ejemplo
  if (receiptId) {
    return SAMPLE_RECEIPTS.find((r) => r.id === receiptId) || null;
  }

  return SAMPLE_RECEIPTS[0] || null;
}

/**
 * Obtiene todas las boletas pendientes
 */
export async function getAllPendingReceipts(): Promise<Receipt[]> {
  // TODO: Implementar consulta a Supabase
  // const supabase = createClient();
  // const { data } = await supabase
  //   .from('boletas')
  //   .select('*')
  //   .eq('estado', 'pendiente')
  //   .order('created_at', { ascending: true });
  //
  // return data as Receipt[] || [];

  return SAMPLE_RECEIPTS;
}

/**
 * Obtiene el conteo de boletas pendientes
 */
export async function getPendingReceiptsCount(): Promise<number> {
  const receipts = await getAllPendingReceipts();
  return receipts.length;
}
