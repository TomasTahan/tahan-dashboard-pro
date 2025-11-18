/**
 * Test directo a Odoo usando la misma estructura de n8n
 */
import { odooClient } from "./lib/odoo/client";
import { config } from "dotenv";

config();

async function testOdooCreate() {
  try {
    console.log("🧪 Creando gasto de prueba en Odoo (estructura n8n)...\n");

    // Datos exactos como en n8n
    const expenseData = {
      name: 'PETROPAR "VILLA MADRID" GAMAX S.R.L.',
      date: "2025-06-21",
      employee_id: 604, // Amadeo Sebastián Roncaglione
      product_id: 46707, // PEAJES (para test)
      quantity: 1,
      total_amount: 600000,
      total_amount_currency: 600000,
      payment_mode: "own_account",
      currency_id: 155, // PYG
      company_id: 3, // TURKEN
    };

    console.log("📝 Datos a enviar:");
    console.log(JSON.stringify(expenseData, null, 2));
    console.log();

    const expenseId = await odooClient.createExpense(expenseData as any);

    console.log(`\n✅ Gasto creado con ID: ${expenseId}`);

    // Leer el gasto creado para verificar
    console.log("\n🔍 Leyendo gasto creado...\n");
    const expense = await odooClient.execute("hr.expense", "read", [[expenseId]], {
      fields: [
        "id",
        "name",
        "date",
        "employee_id",
        "product_id",
        "quantity",
        "total_amount",
        "total_amount_currency",
        "payment_mode",
        "currency_id",
        "company_id",
        "state",
      ],
    });

    console.log("📋 Gasto leído desde Odoo:");
    console.log(JSON.stringify(expense[0], null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testOdooCreate();
