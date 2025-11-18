import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { odooClient } from "@/lib/odoo/client";
import { OdooExpenseData, CURRENCY_MAP, DEFAULT_COMPANY } from "@/lib/odoo/types";
import { findBestCategory } from "@/lib/odoo/category-matcher";

// Cliente de Supabase con secret key para bypasear RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

interface BoletaData {
  boleta_id: number;
  trip_id: string;
  driver_id: string;
  referencia: string | null;
  razon_social: string | null;
  date: string | null;
  total: number;
  moneda: string;
  descripcion: string | null;
  identificador_fiscal: string | null;
  estado: string;
  ai_keywords?: string[];
}

/**
 * Activity: Validar y obtener datos de la boleta
 */
export async function validateAndGetBoleta(boleta_id: number): Promise<BoletaData> {
  const { data: boleta, error: boletaError } = await supabaseAdmin
    .from("boletas")
    .select(
      `
      boleta_id,
      trip_id,
      user_id,
      referencia,
      razon_social,
      date,
      total,
      moneda,
      descripcion,
      identificador_fiscal,
      estado,
      metadata,
      trips!inner(
        id,
        driver_id
      )
    `
    )
    .eq("boleta_id", boleta_id)
    .single();

  if (boletaError || !boleta) {
    throw new Error(`Boleta with id ${boleta_id} does not exist`);
  }

  // Validar estado
  if (boleta.estado !== "espera" && boleta.estado !== "confirmado") {
    throw new Error(
      `Boleta must be in 'espera' or 'confirmado' state. Current state: ${boleta.estado}`
    );
  }

  console.log(`✅ Boleta validada: ${boleta_id} (${boleta.estado})`);

  // Extraer keywords de IA del metadata
  const aiKeywords =
    boleta.metadata &&
    typeof boleta.metadata === "object" &&
    "ai_keywords" in boleta.metadata
      ? (boleta.metadata.ai_keywords as string[])
      : undefined;

  return {
    boleta_id: boleta.boleta_id,
    trip_id: boleta.trip_id,
    driver_id: boleta.trips.driver_id,
    referencia: boleta.referencia,
    razon_social: boleta.razon_social,
    date: boleta.date,
    total: boleta.total || 0,
    moneda: boleta.moneda || "CLP",
    descripcion: boleta.descripcion,
    identificador_fiscal: boleta.identificador_fiscal,
    estado: boleta.estado,
    ai_keywords: aiKeywords,
  };
}

/**
 * Activity: Obtener odoo_id del conductor
 */
export async function getDriverOdooId(driver_id: string): Promise<{
  odoo_id: number;
  nombre_completo: string;
}> {
  if (!driver_id) {
    throw new Error("Driver not assigned to trip");
  }

  const { data: driverInfo, error: driverError } = await supabaseAdmin
    .from("drivers_info")
    .select("odoo_id, nombre_completo")
    .eq("user_id", driver_id)
    .single();

  if (driverError || !driverInfo || !driverInfo.odoo_id) {
    throw new Error(
      `Driver with user_id ${driver_id} does not have an odoo_id. Please sync the driver with Odoo first.`
    );
  }

  console.log(`✅ Conductor: ${driverInfo.nombre_completo} (Odoo ID: ${driverInfo.odoo_id})`);

  return {
    odoo_id: driverInfo.odoo_id,
    nombre_completo: driverInfo.nombre_completo,
  };
}

/**
 * Activity: Determinar categoría del gasto
 */
export async function determineExpenseCategory(input: {
  product_id?: number;
  descripcion: string | null;
  referencia: string | null;
  ai_keywords?: string[];
}): Promise<{ id: number; name?: string; confidence?: number }> {
  // Si ya se especificó la categoría, usarla
  if (input.product_id) {
    console.log(`✅ Usando categoría especificada: ${input.product_id}`);
    return { id: input.product_id };
  }

  // Buscar categoría automáticamente
  const description = input.descripcion || input.referencia || "";

  console.log(`🔍 Buscando categoría para: "${description}"`);
  if (input.ai_keywords && input.ai_keywords.length > 0) {
    console.log(`   Keywords: ${input.ai_keywords.join(", ")}`);
  }

  const categoryMatch = await findBestCategory(description, input.ai_keywords);

  if (!categoryMatch) {
    throw new Error(
      `No se pudo determinar la categoría automáticamente para: "${description}". ` +
        `Por favor, especifica el product_id manualmente.`
    );
  }

  console.log(`✅ Categoría encontrada: ${categoryMatch.name} (ID: ${categoryMatch.odoo_id})`);
  console.log(`   Confianza: ${categoryMatch.confidence}`);

  return {
    id: categoryMatch.odoo_id,
    name: categoryMatch.name,
    confidence: categoryMatch.confidence,
  };
}

/**
 * Activity: Crear gasto en Odoo
 */
export async function createExpenseInOdoo(input: {
  boleta: BoletaData;
  employee_odoo_id: number;
  category_id: number;
}): Promise<number> {
  const { boleta, employee_odoo_id, category_id } = input;

  // Mapear moneda
  const currencyCode = (boleta.moneda || "CLP").toUpperCase();
  const currencyId = CURRENCY_MAP[currencyCode];

  if (!currencyId) {
    throw new Error(
      `Moneda ${currencyCode} no está soportada. Monedas disponibles: ${Object.keys(
        CURRENCY_MAP
      ).join(", ")}`
    );
  }

  console.log(`💱 Moneda: ${currencyCode} -> ID ${currencyId}`);

  // Formatear fecha
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
      console.log(`📅 Fecha: "${boleta.date}" -> "${formattedDate}"`);
    } catch (error) {
      console.warn(`⚠️ Error parseando fecha, usando fecha actual`);
    }
  }

  // Preparar datos del gasto
  const expenseData: OdooExpenseData = {
    name: boleta.descripcion || boleta.referencia || "Gasto sin descripción",
    date: formattedDate,
    employee_id: employee_odoo_id,
    product_id: category_id,
    quantity: 1,
    total_amount: boleta.total,
    total_amount_currency: boleta.total,
    payment_mode: "own_account",
    currency_id: currencyId,
    company_id: DEFAULT_COMPANY.id,
    description: `Boleta: ${boleta.referencia || "N/A"}\nRazón Social: ${
      boleta.razon_social || "N/A"
    }\nIdentificador Fiscal: ${boleta.identificador_fiscal || "N/A"}`,
  };

  console.log(`📝 Creando gasto en Odoo...`, expenseData);

  try {
    const odooExpenseId = await odooClient.createExpense(expenseData);
    console.log(`✅ Gasto creado en Odoo: ID ${odooExpenseId}`);
    return odooExpenseId;
  } catch (error) {
    console.error(`❌ Error creando gasto en Odoo:`, error);
    throw new Error(
      `Failed to create expense in Odoo: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Activity: Actualizar estado de la boleta
 */
export async function updateBoletaStatus(input: {
  boleta_id: number;
  odoo_expense_id: number;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("boletas")
    .update({
      estado: "confirmado",
      odoo_expense_id: input.odoo_expense_id,
      updated_at: new Date().toISOString(),
    })
    .eq("boleta_id", input.boleta_id);

  if (error) {
    throw new Error(`Failed to update boleta status: ${error.message}`);
  }

  console.log(`✅ Boleta ${input.boleta_id} actualizada: odoo_expense_id=${input.odoo_expense_id}`);
}
