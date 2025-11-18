/**
 * Tipos para la integración con Odoo 17 API
 * Basado en ODOO_API_DOCUMENTATION.md
 */

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

export interface OdooAuthResponse {
  jsonrpc: string;
  id: number;
  result: number; // UID
  error?: {
    message: string;
    data: {
      debug: string;
    };
  };
}

export interface OdooCreateExpenseResponse {
  jsonrpc: string;
  id: number;
  result: number; // ID del gasto creado
  error?: {
    message: string;
    data: {
      debug: string;
    };
  };
}

export interface OdooExpenseData {
  name: string; // Descripción del gasto
  date: string; // YYYY-MM-DD
  employee_id: number; // ID del empleado en Odoo
  product_id: number; // ID de la categoría del gasto
  quantity: number; // Cantidad (generalmente 1)
  total_amount: number; // Total en moneda de la empresa
  total_amount_currency: number; // Total en moneda original
  payment_mode: "own_account" | "company_account"; // Quién pagó
  currency_id: number; // ID de la moneda
  company_id: number; // ID de la empresa
  description?: string; // Notas internas adicionales
}

export type OdooExpenseState =
  | "draft" // Borrador, aún no reportado
  | "reported" // Reportado, pendiente de enviar
  | "submitted" // Enviado para aprobación
  | "approved" // Aprobado
  | "done" // Completado
  | "refused"; // Rechazado

export interface OdooEmployee {
  id: number;
  name: string;
  work_email?: string;
  company_id: [number, string]; // [ID, Nombre]
}

export interface OdooProduct {
  id: number;
  name: string;
  default_code?: string;
  can_be_expensed: boolean;
}

export interface OdooCurrency {
  id: number;
  name: string; // Código: ARS, CLP, USD, etc.
  symbol: string;
  position: "before" | "after";
}

export interface OdooCompany {
  id: number;
  name: string;
  currency_id: [number, string]; // [ID, Código]
}

/**
 * Mapeo de monedas usadas por la empresa
 */
export const CURRENCY_MAP: Record<string, number> = {
  ARS: 19, // Peso Argentino
  BRL: 6, // Real Brasileño
  CLP: 45, // Peso Chileno
  PEN: 154, // Sol Peruano
  PYG: 155, // Guaraní Paraguayo
  USD: 2, // Dólar
};

/**
 * Empresas del grupo Tahan
 */
export const COMPANIES = {
  EXITRANS: { id: 1, name: "EXITRANS S.A.", currency: "ARS" },
  TURKEN: { id: 3, name: "EXPORTADORA E IMPORTADORA TURKEN S A", currency: "CLP" },
  THP: { id: 4, name: "THP LOGISTICA S.A", currency: "PYG" },
  THB: { id: 2, name: "THB INTERNACIONAL LTDA", currency: "BRL" },
} as const;

/**
 * Empresa predeterminada para los workflows
 */
export const DEFAULT_COMPANY = COMPANIES.TURKEN;
