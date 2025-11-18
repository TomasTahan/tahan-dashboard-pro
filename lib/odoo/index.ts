/**
 * Odoo 17 Integration Library
 *
 * Este módulo proporciona todas las utilidades necesarias para
 * interactuar con Odoo 17 desde Next.js
 */

// Exportar el cliente
export { OdooClient, odooClient } from "./client";

// Exportar tipos
export type {
  OdooConfig,
  OdooAuthResponse,
  OdooCreateExpenseResponse,
  OdooExpenseData,
  OdooExpenseState,
  OdooEmployee,
  OdooProduct,
  OdooCurrency,
  OdooCompany,
} from "./types";

// Exportar constantes
export { CURRENCY_MAP, COMPANIES, DEFAULT_COMPANY } from "./types";

// Exportar funciones de matching de categorías
export {
  findBestCategory,
  findPossibleCategories,
  getCategoryByOdooId,
  getAllCategories,
} from "./category-matcher";

export type { CategoryMatch } from "./category-matcher";
