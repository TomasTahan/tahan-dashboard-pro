/**
 * Cliente para interactuar con Odoo 17 JSON-RPC API
 * Basado en ODOO_API_DOCUMENTATION.md
 */

import {
  OdooConfig,
  OdooAuthResponse,
  OdooCreateExpenseResponse,
  OdooExpenseData,
} from "./types";

export class OdooClient {
  private config: OdooConfig;
  private uid: number | null = null;
  private uidExpiresAt: number = 0;
  private readonly UID_CACHE_DURATION = 3600000; // 1 hora en milisegundos

  constructor(config?: OdooConfig) {
    this.config = config || {
      url: process.env.ODOO_URL || "https://odoo17.odoosistema.com",
      database: process.env.ODOO_DATABASE || "Tahan_Nov_2025",
      username: process.env.ODOO_USERNAME || "juancruztahan@empresastahan.com",
      password: process.env.ODOO_PASSWORD || "123456789",
    };
  }

  /**
   * Realiza una llamada JSON-RPC a Odoo
   */
  private async call<T>(
    service: string,
    method: string,
    args: any[]
  ): Promise<T> {
    const response = await fetch(`${this.config.url}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service,
          method,
          args,
        },
        id: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Odoo API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      console.error("Odoo API Error:", data.error);
      throw new Error(
        `Odoo Error: ${data.error.message}\n${data.error.data?.debug || ""}`
      );
    }

    return data.result;
  }

  /**
   * Autentica y obtiene el UID del usuario
   * Cachea el UID por 1 hora para evitar autenticaciones repetidas
   */
  async authenticate(): Promise<number> {
    // Verificar si el UID está en caché y no ha expirado
    if (this.uid && Date.now() < this.uidExpiresAt) {
      return this.uid;
    }

    const result = await this.call<number>(
      "common",
      "authenticate",
      [this.config.database, this.config.username, this.config.password, {}]
    );

    if (!result) {
      throw new Error("Authentication failed - UID is null");
    }

    this.uid = result;
    this.uidExpiresAt = Date.now() + this.UID_CACHE_DURATION;

    console.log(`Authenticated with Odoo - UID: ${this.uid}`);
    return this.uid;
  }

  /**
   * Ejecuta un método en un modelo de Odoo
   */
  async execute(
    model: string,
    method: string,
    args: any[],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    const uid = await this.authenticate();

    return this.call("object", "execute_kw", [
      this.config.database,
      uid,
      this.config.password,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  /**
   * Crea un gasto en Odoo
   */
  async createExpense(
    expenseData: OdooExpenseData,
    context?: Record<string, any>
  ): Promise<number> {
    const defaultContext = {
      allowed_company_ids: [expenseData.company_id],
      force_company: expenseData.company_id,
    };

    const expenseId = await this.execute(
      "hr.expense",
      "create",
      [expenseData],
      {
        context: { ...defaultContext, ...context },
      }
    );

    console.log(`Gasto creado en Odoo con ID: ${expenseId}`);
    return expenseId;
  }

  /**
   * Lee un gasto de Odoo
   */
  async readExpense(
    expenseId: number,
    fields?: string[]
  ): Promise<Record<string, any>> {
    const defaultFields = [
      "id",
      "name",
      "date",
      "employee_id",
      "product_id",
      "total_amount",
      "state",
      "currency_id",
      "company_id",
    ];

    const result = await this.execute("hr.expense", "read", [[expenseId]], {
      fields: fields || defaultFields,
    });

    return result[0];
  }

  /**
   * Busca empleados en Odoo
   */
  async searchEmployees(
    domain: any[] = [],
    fields?: string[]
  ): Promise<any[]> {
    const defaultFields = ["id", "name", "work_email", "company_id"];

    return this.execute("hr.employee", "search_read", [domain], {
      fields: fields || defaultFields,
      limit: 100,
    });
  }

  /**
   * Busca productos/categorías de gastos en Odoo
   */
  async searchExpenseCategories(
    domain: any[] = [],
    fields?: string[],
    limit?: number
  ): Promise<any[]> {
    const defaultFields = ["id", "name", "default_code", "list_price"];

    // Filtrar solo productos que pueden ser gastos
    const fullDomain = [...domain, ["can_be_expensed", "=", true]];

    const kwargs: any = {
      fields: fields || defaultFields,
    };

    if (limit !== undefined) {
      kwargs.limit = limit;
    }

    return this.execute("product.product", "search_read", [fullDomain], kwargs);
  }

  /**
   * Busca monedas activas en Odoo
   */
  async searchCurrencies(fields?: string[]): Promise<any[]> {
    const defaultFields = ["id", "name", "symbol", "position"];

    return this.execute(
      "res.currency",
      "search_read",
      [[["active", "=", true]]],
      {
        fields: fields || defaultFields,
      }
    );
  }

  /**
   * Busca empresas en Odoo
   */
  async searchCompanies(fields?: string[]): Promise<any[]> {
    const defaultFields = ["id", "name", "currency_id"];

    return this.execute("res.company", "search_read", [[]], {
      fields: fields || defaultFields,
    });
  }
}

// Exportar una instancia singleton
export const odooClient = new OdooClient();
