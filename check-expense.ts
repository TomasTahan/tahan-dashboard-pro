import { odooClient } from "./lib/odoo/client";
import { config } from "dotenv";

config();

async function checkExpense() {
  try {
    console.log("🔍 Consultando gasto en Odoo (ID: 4271)...\n");

    // Leer el gasto completo con todos los campos
    const expense = await odooClient.execute(
      "hr.expense",
      "read",
      [[4271]],
      {
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
          "description",
          "sheet_id",
        ],
      }
    );

    console.log("📋 GASTO EN ODOO:");
    console.log("=================\n");
    console.log(JSON.stringify(expense[0], null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkExpense();
