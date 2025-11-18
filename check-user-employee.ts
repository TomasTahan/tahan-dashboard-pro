import { odooClient } from "./lib/odoo/client";
import { config } from "dotenv";

config();

async function checkUserEmployee() {
  try {
    // Buscar el usuario actual (UID 91)
    const user = await odooClient.execute("res.users", "read", [[91]], {
      fields: ["id", "name", "login", "employee_ids"],
    });

    console.log("👤 Usuario actual en Odoo:");
    console.log(JSON.stringify(user[0], null, 2));

    if (user[0].employee_ids && user[0].employee_ids.length > 0) {
      // Obtener info del empleado
      const employee = await odooClient.execute(
        "hr.employee",
        "read",
        [user[0].employee_ids],
        {
          fields: ["id", "name", "company_id"],
        }
      );
      
      console.log("\n🏢 Empleado(s) asociado(s):");
      console.log(JSON.stringify(employee, null, 2));
    } else {
      console.log("\n⚠️  Este usuario NO tiene empleados asociados");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkUserEmployee();
