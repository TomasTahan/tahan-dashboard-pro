import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { odooClient } from "@/lib/odoo/client";
import { findBestCategory } from "@/lib/odoo/category-matcher";
import {
  CURRENCY_MAP,
  DEFAULT_COMPANY,
  OdooExpenseData,
} from "@/lib/odoo/types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// 1. Obtener detalles completos de la boleta
export async function getBoletaDetails(boletaId: number) {
  const { data: boleta, error } = await supabase
    .from("boletas")
    .select(
      `
        boleta_id, trip_id, user_id, referencia, razon_social, date,
        total, moneda, descripcion, identificador_fiscal, estado, metadata,
        trips!inner(id, driver_id)
      `
    )
    .eq("boleta_id", boletaId)
    .single();

  if (error || !boleta) throw new Error(`Boleta ${boletaId} not found`);

  // Validación de estado
  if (boleta.estado !== "espera" && boleta.estado !== "confirmado") {
    throw new Error(`Invalid state: ${boleta.estado}`);
  }

  return boleta;
}

// 2. Obtener info del conductor para Odoo
export async function getDriverOdooInfo(userId: string) {
  const { data, error } = await supabase
    .from("drivers_info")
    .select("odoo_id, nombre_completo")
    .eq("user_id", userId)
    .single();

  if (error || !data?.odoo_id) {
    throw new Error(`Driver ${userId} not found in Odoo mapping`);
  }
  return data;
}

// 3. Determinar categoría
export async function determineCategoryActivity(
  description: string,
  aiKeywords?: string[]
) {
  return await findBestCategory(description, aiKeywords);
}

// 4. Preparar Payload (Maneja lógica de Fechas y Monedas de forma segura)
export async function prepareExpensePayload(
  boleta: any,
  driverOdooId: number,
  categoryId: number
): Promise<OdooExpenseData> {
  // Mapeo de Moneda
  const currencyCode = (boleta.moneda || "CLP").toUpperCase();
  const currencyId = CURRENCY_MAP[currencyCode];
  if (!currencyId) throw new Error(`Currency ${currencyCode} not supported`);

  // Formateo de Fecha
  let formattedDate = new Date().toISOString().split("T")[0];
  if (boleta.date) {
    try {
      const dateStr = boleta.date.trim();
      const ddmmyyyyMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (ddmmyyyyMatch) {
        const [_, day, month, year] = ddmmyyyyMatch;
        formattedDate = `${year}-${month}-${day}`;
      } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          formattedDate = parsed.toISOString().split("T")[0];
        }
      }
    } catch (e) {
      console.warn("Date parse error, using today");
    }
  }

  return {
    name: boleta.descripcion || boleta.referencia || "Gasto sin descripción",
    date: formattedDate,
    employee_id: driverOdooId,
    product_id: categoryId,
    quantity: 1,
    total_amount: boleta.total || 0,
    total_amount_currency: boleta.total || 0,
    payment_mode: "own_account",
    currency_id: currencyId,
    company_id: DEFAULT_COMPANY.id,
    description: `Boleta: ${boleta.referencia || "N/A"}\nRazón Social: ${
      boleta.razon_social || "N/A"
    }\nIdentificador Fiscal: ${boleta.identificador_fiscal || "N/A"}`,
  };
}

// 5. Enviar a Odoo
export async function createOdooExpense(expenseData: OdooExpenseData) {
  console.log("🚀 Enviando a Odoo...");
  return await odooClient.createExpense(expenseData);
}

// 6. Confirmar en DB
export async function confirmBoletaInDb(boletaId: number, odooId: number) {
  const { error } = await supabase
    .from("boletas")
    .update({
      estado: "confirmado",
      odoo_expense_id: odooId,
      updated_at: new Date().toISOString(),
    })
    .eq("boleta_id", boletaId);

  if (error) throw new Error(`Failed to confirm boleta: ${error.message}`);
}
