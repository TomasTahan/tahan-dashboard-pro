/**
 * Script para sincronizar categorías de gastos desde Odoo
 * y guardarlas en un archivo JSON local con keywords
 */

import { odooClient } from "../lib/odoo/client";
import fs from "fs";
import path from "path";

interface OdooCategory {
  id: number;
  name: string;
  default_code: string | null;
  list_price: number;
}

interface CategoryWithKeywords {
  odoo_id: number;
  name: string;
  code: string | null;
  keywords: string[];
}

/**
 * Genera keywords automáticamente basándose en el nombre de la categoría
 */
function generateKeywords(name: string, code: string | null): string[] {
  const keywords: string[] = [];
  const normalized = name.toLowerCase().trim();

  // Agregar el nombre completo normalizado
  keywords.push(normalized);

  // Agregar palabras individuales del nombre (si tiene más de una palabra)
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  keywords.push(...words);

  // Agregar código si existe
  if (code) {
    keywords.push(code.toLowerCase());
  }

  // Agregar keywords específicos basados en categorías comunes
  const keywordMap: Record<string, string[]> = {
    "peaje": ["peaje", "tag", "autopista", "ruta", "toll", "peage"],
    "combustible": ["combustible", "nafta", "diesel", "gasolina", "gas", "fuel", "gnc", "gasoil", "estacion de servicio", "ypf", "shell", "axion", "petropar"],
    "herramienta": ["herramienta", "tool", "taller", "repuesto"],
    "comida": ["comida", "restaurante", "almuerzo", "cena", "desayuno", "food", "vianda"],
    "alojamiento": ["hotel", "hospedaje", "alojamiento", "motel", "posada"],
    "transporte": ["transporte", "taxi", "uber", "remis", "colectivo", "bus"],
    "estacionamiento": ["estacionamiento", "parking", "cochera"],
    "limpieza": ["limpieza", "lavado", "lavadero", "cleaning"],
    "mantenimiento": ["mantenimiento", "service", "reparacion", "arreglo"],
    "seguro": ["seguro", "insurance", "cobertura"],
    "impuesto": ["impuesto", "tasa", "tax", "tributo"],
    "telefono": ["telefono", "celular", "movil", "phone", "comunicacion"],
    "internet": ["internet", "wifi", "conectividad"],
    "oficina": ["oficina", "papeleria", "office", "resma"],
  };

  // Buscar matches con categorías comunes
  for (const [key, values] of Object.entries(keywordMap)) {
    if (normalized.includes(key)) {
      keywords.push(...values);
    }
  }

  // Eliminar duplicados
  return [...new Set(keywords)];
}

async function syncCategories() {
  try {
    console.log("🔄 Sincronizando categorías de gastos desde Odoo...\n");

    // Obtener todas las categorías de Odoo (sin límite)
    const odooCategories: OdooCategory[] = await odooClient.searchExpenseCategories(
      [],
      ["id", "name", "default_code", "list_price"],
      undefined // Sin límite, obtener todas
    );

    console.log(`✅ Se encontraron ${odooCategories.length} categorías en Odoo\n`);

    // Convertir a formato con keywords
    const categoriesWithKeywords: CategoryWithKeywords[] = odooCategories.map((cat) => {
      const keywords = generateKeywords(cat.name, cat.default_code);

      console.log(`📦 ${cat.name} (ID: ${cat.id})`);
      console.log(`   Keywords: ${keywords.slice(0, 5).join(", ")}${keywords.length > 5 ? "..." : ""}\n`);

      return {
        odoo_id: cat.id,
        name: cat.name,
        code: cat.default_code,
        keywords,
      };
    });

    // Guardar en archivo JSON
    const outputPath = path.join(process.cwd(), "lib", "odoo", "categories.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(categoriesWithKeywords, null, 2),
      "utf-8"
    );

    console.log(`\n✅ Categorías guardadas en: ${outputPath}`);
    console.log(`📊 Total de categorías: ${categoriesWithKeywords.length}`);

    // Mostrar estadísticas
    const totalKeywords = categoriesWithKeywords.reduce(
      (sum, cat) => sum + cat.keywords.length,
      0
    );
    const avgKeywords = (totalKeywords / categoriesWithKeywords.length).toFixed(1);

    console.log(`📈 Total de keywords: ${totalKeywords}`);
    console.log(`📊 Promedio de keywords por categoría: ${avgKeywords}`);

  } catch (error) {
    console.error("❌ Error sincronizando categorías:", error);
    process.exit(1);
  }
}

syncCategories();
