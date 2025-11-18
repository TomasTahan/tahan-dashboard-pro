import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "../activities/expense.activities";

// Configurar timeouts para las actividades
const {
  validateAndGetBoleta,
  getDriverOdooId,
  determineExpenseCategory,
  createExpenseInOdoo,
  updateBoletaStatus
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "3 minutes",
  retry: {
    maximumAttempts: 3,
  },
});

export interface CreateExpenseInput {
  boleta_id: number;
  product_id?: number; // Opcional: categoría específica
}

export interface CreateExpenseOutput {
  success: boolean;
  message: string;
  data: {
    boleta_id: number;
    odoo_expense_id: number;
    employee_id: number;
    employee_name: string;
    category_id: number;
    total: number;
    currency: string;
    company: string;
  };
}

/**
 * Workflow para crear gastos en Odoo desde boletas
 *
 * Pasos:
 * 1. Validar boleta y obtener datos
 * 2. Obtener odoo_id del conductor
 * 3. Determinar categoría del gasto
 * 4. Crear gasto en Odoo
 * 5. Actualizar estado de la boleta
 */
export async function createExpenseWorkflow(
  input: CreateExpenseInput
): Promise<CreateExpenseOutput> {
  // 1. Validar y obtener boleta
  const boleta = await validateAndGetBoleta(input.boleta_id);

  // 2. Obtener información del conductor
  const driverInfo = await getDriverOdooId(boleta.driver_id);

  // 3. Determinar categoría del gasto
  const categoryId = await determineExpenseCategory({
    product_id: input.product_id,
    descripcion: boleta.descripcion,
    referencia: boleta.referencia,
    ai_keywords: boleta.ai_keywords,
  });

  // 4. Crear gasto en Odoo
  const odooExpenseId = await createExpenseInOdoo({
    boleta,
    employee_odoo_id: driverInfo.odoo_id,
    category_id: categoryId.id,
  });

  // 5. Actualizar estado de la boleta
  await updateBoletaStatus({
    boleta_id: input.boleta_id,
    odoo_expense_id: odooExpenseId,
  });

  return {
    success: true,
    message: "Expense created successfully in Odoo",
    data: {
      boleta_id: input.boleta_id,
      odoo_expense_id: odooExpenseId,
      employee_id: driverInfo.odoo_id,
      employee_name: driverInfo.nombre_completo,
      category_id: categoryId.id,
      total: boleta.total,
      currency: boleta.moneda,
      company: "Tahan",
    },
  };
}
