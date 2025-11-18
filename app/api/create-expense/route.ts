import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";
import { odooClient } from "@/lib/odoo/client";
import {
  OdooExpenseData,
  CURRENCY_MAP,
  DEFAULT_COMPANY,
} from "@/lib/odoo/types";
import { findBestCategory } from "@/lib/odoo/category-matcher";

// Cliente de Supabase con secret key para bypasear RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Timeout para la request
export const maxDuration = 60;

interface CreateExpensePayload {
  boleta_id: number;
  product_id?: number; // Opcional: Si ya se sabe la categoría
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validar el payload
    const body: CreateExpensePayload = await req.json();
    const { boleta_id, product_id } = body;

    if (!boleta_id) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "boleta_id is required",
        },
        { status: 400 }
      );
    }

    // 2. Obtener la boleta de Supabase
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
      return NextResponse.json(
        {
          error: "Boleta not found",
          message: `Boleta with id ${boleta_id} does not exist`,
        },
        { status: 404 }
      );
    }

    // 3. Validar que la boleta esté en estado "espera" (pendiente de confirmación)
    // o "confirmado" (ya confirmado pero no procesado en Odoo)
    if (boleta.estado !== "espera" && boleta.estado !== "confirmado") {
      return NextResponse.json(
        {
          error: "Invalid boleta state",
          message: `Boleta must be in 'espera' or 'confirmado' state. Current state: ${boleta.estado}`,
        },
        { status: 400 }
      );
    }

    console.log(`\n🔍 [STEP 4] Validando boleta_id: ${boleta_id}`);
    console.log(`   Estado actual: ${boleta.estado}`);
    console.log(`   Referencia: ${boleta.referencia}`);
    console.log(`   Total: ${boleta.total} ${boleta.moneda}`);

    // 5. Obtener el odoo_id del conductor desde drivers_info
    const driverId = boleta.trips.driver_id;
    console.log(
      `\n👤 [STEP 5] Obteniendo información del conductor (driver_id: ${driverId})`
    );

    if (!driverId) {
      console.error(`❌ Error: El viaje no tiene un conductor asignado`);
      return NextResponse.json(
        {
          error: "Driver not assigned",
          message: `Trip ${boleta.trip_id} does not have a driver assigned.`,
        },
        { status: 400 }
      );
    }

    const { data: driverInfo, error: driverError } = await supabaseAdmin
      .from("drivers_info")
      .select("odoo_id, nombre_completo")
      .eq("user_id", driverId)
      .single();

    if (driverError || !driverInfo || !driverInfo.odoo_id) {
      console.error(
        `❌ Error: Conductor no encontrado en drivers_info o sin odoo_id`
      );
      return NextResponse.json(
        {
          error: "Driver not found in Odoo",
          message: `Driver with user_id ${driverId} does not have an odoo_id. Please sync the driver with Odoo first.`,
        },
        { status: 404 }
      );
    }

    console.log(
      `   ✅ Conductor encontrado: ${driverInfo.nombre_completo} (Odoo ID: ${driverInfo.odoo_id})`
    );

    // 6. Determinar la categoría del gasto (product_id)
    console.log(`\n🏷️  [STEP 6] Determinando categoría del gasto...`);
    let categoryId = product_id;

    if (!categoryId) {
      console.log(
        `   No se especificó product_id, buscando automáticamente...`
      );
      // Intentar encontrar la categoría automáticamente basándose en la descripción y keywords de IA
      const description = boleta.descripcion || boleta.referencia || "";

      // Extraer keywords de IA del metadata si están disponibles
      const aiKeywords =
        boleta.metadata &&
        typeof boleta.metadata === "object" &&
        "ai_keywords" in boleta.metadata
          ? (boleta.metadata.ai_keywords as string[])
          : undefined;

      console.log(`   Descripción: "${description}"`);
      if (aiKeywords && aiKeywords.length > 0) {
        console.log(`   Keywords de IA: ${aiKeywords.join(", ")}`);
      }

      const categoryMatch = await findBestCategory(description, aiKeywords);

      if (!categoryMatch) {
        console.error(`   ❌ No se encontró categoría automáticamente`);
        return NextResponse.json(
          {
            error: "Category not found",
            message: `No se pudo determinar la categoría automáticamente para la descripción: "${description}". Por favor, especifica el product_id manualmente.`,
            suggestions:
              "Considera sincronizar las categorías de Odoo o agregar keywords a las existentes.",
            ai_keywords: aiKeywords,
          },
          { status: 400 }
        );
      }

      categoryId = categoryMatch.odoo_id;
      console.log(
        `   ✅ Categoría encontrada: ${categoryMatch.name} (ID: ${categoryId})`
      );
      console.log(`   Confianza: ${categoryMatch.confidence}`);
    } else {
      console.log(`   ✅ Usando product_id especificado: ${categoryId}`);
    }

    // 7. Mapear la moneda
    console.log(`\n💱 [STEP 7] Mapeando moneda...`);
    const currencyCode = (boleta.moneda || "CLP").toUpperCase();
    const currencyId = CURRENCY_MAP[currencyCode];

    if (!currencyId) {
      console.error(`   ❌ Moneda no soportada: ${currencyCode}`);
      return NextResponse.json(
        {
          error: "Currency not supported",
          message: `Moneda ${currencyCode} no está soportada. Monedas disponibles: ${Object.keys(
            CURRENCY_MAP
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(`   ✅ Moneda mapeada: ${currencyCode} -> ID ${currencyId}`);

    // 8. Preparar los datos del gasto para Odoo
    console.log(`\n📝 [STEP 8] Preparando datos del gasto para Odoo...`);

    // Convertir fecha al formato que espera Odoo (YYYY-MM-DD)
    let formattedDate = new Date().toISOString().split("T")[0];
    if (boleta.date) {
      try {
        // Intentar parsear diferentes formatos de fecha
        const dateStr = boleta.date.trim();

        // Formato DD/MM/YYYY HH:MM:SS o DD/MM/YYYY
        const ddmmyyyyMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (ddmmyyyyMatch) {
          const [_, day, month, year] = ddmmyyyyMatch;
          formattedDate = `${year}-${month}-${day}`;
        } else {
          // Intentar con Date.parse
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            formattedDate = parsed.toISOString().split("T")[0];
          }
        }
        console.log(
          `   Fecha original: "${boleta.date}" -> Fecha convertida: "${formattedDate}"`
        );
      } catch (error) {
        console.error(`   ⚠️  Error parseando fecha, usando fecha actual`);
      }
    }

    // Preparar datos igual que en n8n
    const expenseData: OdooExpenseData = {
      name: boleta.descripcion || boleta.referencia || "Gasto sin descripción",
      date: formattedDate,
      employee_id: driverInfo.odoo_id,
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

    console.log(`   Datos preparados:`, JSON.stringify(expenseData, null, 2));

    // 9. Crear el gasto en Odoo
    console.log(`\n🚀 [STEP 9] Creando gasto en Odoo...`);
    let odooExpenseId: number;

    try {
      odooExpenseId = await odooClient.createExpense(expenseData);
      console.log(
        `   ✅ ¡Gasto creado exitosamente en Odoo! ID: ${odooExpenseId}`
      );
    } catch (odooError) {
      console.error(`   ❌ Error al crear gasto en Odoo:`, odooError);
      console.error(`   Datos que se intentaron enviar:`, expenseData);

      return NextResponse.json(
        {
          error: "Failed to create expense in Odoo",
          message:
            odooError instanceof Error ? odooError.message : "Unknown error",
          expense_data: expenseData,
        },
        { status: 500 }
      );
    }

    // 10. Actualizar el estado de la boleta a "confirmado" y guardar odoo_expense_id
    console.log(
      `\n✏️  [STEP 10] Actualizando estado de boleta a "confirmado" y guardando odoo_expense_id...`
    );
    await supabaseAdmin
      .from("boletas")
      .update({
        estado: "confirmado",
        odoo_expense_id: odooExpenseId,
        updated_at: new Date().toISOString(),
      })
      .eq("boleta_id", boleta_id);

    console.log(`   ✅ Estado actualizado y odoo_expense_id guardado: ${odooExpenseId}`);

    // 11. Retornar respuesta exitosa
    console.log(`\n✅ [SUCCESS] ¡Proceso completado exitosamente!`);
    console.log(`   Boleta ID: ${boleta_id}`);
    console.log(`   Odoo Expense ID: ${odooExpenseId}`);
    console.log(`   Empleado: ${driverInfo.nombre_completo}`);
    console.log(`   Categoría ID: ${categoryId}`);
    console.log(`   Total: ${boleta.total} ${currencyCode}`);
    console.log(`   Empresa: ${DEFAULT_COMPANY.name}\n`);

    return NextResponse.json(
      {
        success: true,
        message: "Expense created successfully in Odoo",
        data: {
          boleta_id: boleta_id,
          odoo_expense_id: odooExpenseId,
          employee_id: driverInfo.odoo_id,
          employee_name: driverInfo.nombre_completo,
          category_id: categoryId,
          total: boleta.total,
          currency: currencyCode,
          company: DEFAULT_COMPANY.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating expense:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
