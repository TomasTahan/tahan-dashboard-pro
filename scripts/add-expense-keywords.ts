/**
 * Script para agregar keywords específicos a categorías de gastos
 * Basado en reglas de imputación de comprobantes
 */

import fs from "fs";
import path from "path";

interface CategoryData {
  odoo_id: number;
  name: string;
  code: string | null;
  keywords: string[];
}

// Mapeo de categorías con sus IDs de Odoo y keywords específicos
const categoryMappings: Record<number, string[]> = {
  // PEAJES (ID: 46707)
  46707: [
    "peaje",
    "peajes",
    "tag",
    "autopista",
    "ruta",
    "toll",
    "peage",
    // Chile
    "plaza pichidangui",
    "sociedad consecionaria ruta del elqui",
    "autopista de los andes",
    // Argentina
    "autopistas buenos aires",
    "grupo concesionario del oeste",
    "corredores viales",
    "ente de control de rutas provinciales",
    "autopista del sol",
  ],

  // MIGRACIONES (ID: 46558)
  46558: [
    "migracion",
    "migraciones",
    "immigration",
    "direccion nacional de migraciones",
    "aduana",
    "customs",
  ],

  // TUNEL (ID: 47479)
  47479: [
    "tunel",
    "tunnel",
    // Chile
    "plaza peaje cristo redentor",
    // Argentina
    "direccion nacional de vialidad",
    "control fitosanitario san carlos",
  ],

  // ISCAMEN (ID: 46206)
  46206: [
    "iscamen",
    "instituto de sanidad",
    "instituto de sanidad y calidad agropecuaria mendoza",
    "control fitosanitario",
    "fitosanitario",
    "sanidad agropecuaria",
  ],

  // BALSA (ID: 45331 - BALSA CHILOE)
  45331: [
    "balsa",
    "ferry",
    "chiloe",
    "transbordador",
  ],

  // PARQUEADERO/ESTACIONAMIENTO (ID: 45805)
  45805: [
    "parqueadero",
    "estacionamiento",
    "parking",
    "cochera",
    // Chile
    "almacen extra portuario el sauce",
  ],

  // ESTACIONAMIENTO CONDUCTORES (ID: 45806)
  45806: [
    "estacionamiento conductores",
    "parking conductores",
    "parqueadero conductores",
  ],

  // REVISION TECNICA (ID: 46964)
  46964: [
    "revision tecnica",
    "verificacion tecnica",
    "vtv",
    "itv",
    "inspeccion",
    // Chile
    "applus revisiones tecnicas",
    // Argentina
    "instecmen",
  ],

  // SANITIZADO (ID: 47044)
  47044: [
    "sanitizado",
    "sanitizacion",
    "desinfeccion",
    "sanitize",
    "lavado",
    "limpieza",
    "cleaning",
    "wash",
  ],

  // ATA (ID: 45307)
  45307: [
    "ata",
    "cta management",
    "paula prieto",
    "aci uspallata",
  ],

  // INGRESO A MERCADO (ID: 46194)
  46194: [
    "ingreso a mercado",
    "mercado",
    "market",
    // Argentina
    "mercado cooperativo de guaymallen",
    "cooper",
    "corporacion del mercado central",
    "consorcio de propietarios del mercado",
    "cooperativa mercoop",
    "mercoop",
  ],

  // TRASBORDO CONTENEDOR (ID: 47381)
  47381: [
    "trasbordo",
    "trasbordo contenedor",
    "transbordo",
    "container transfer",
    // Argentina
    "manorhouse",
    "medlog argentina",
    "franeuken",
  ],

  // TRASBORDO (ID: 47380)
  47380: [
    "trasbordo",
    "transbordo",
    "transfer",
  ],

  // TARA FISCAL (ID: 47259)
  47259: [
    "tara fiscal",
    "tara",
    "peso",
    "weighing",
    // Argentina
    "multimodal sacia",
    "puerto seco",
  ],

  // SENASA (ID: 46157)
  46157: [
    "senasa",
    "servicio nacional de sanidad",
    "cta management",
    "habilitacion",
    "certificacion sanitaria",
  ],
};

async function addKeywords() {
  try {
    console.log("🔄 Agregando keywords específicos a categorías...\n");

    // Leer el archivo de categorías
    const categoriesPath = path.join(process.cwd(), "lib", "odoo", "categories.json");
    const categoriesData: CategoryData[] = JSON.parse(
      fs.readFileSync(categoriesPath, "utf-8")
    );

    console.log(`📚 Categorías cargadas: ${categoriesData.length}\n`);

    // Actualizar categorías con keywords específicos
    let updated = 0;
    for (const category of categoriesData) {
      const specificKeywords = categoryMappings[category.odoo_id];

      if (specificKeywords) {
        // Combinar keywords existentes con los nuevos (sin duplicados)
        const currentKeywords = new Set(category.keywords.map((kw) => kw.toLowerCase()));
        const newKeywords = specificKeywords.filter(
          (kw) => !currentKeywords.has(kw.toLowerCase())
        );

        if (newKeywords.length > 0) {
          category.keywords = [
            ...category.keywords,
            ...newKeywords.map((kw) => kw.toLowerCase()),
          ];

          console.log(`✅ ${category.name} (ID: ${category.odoo_id})`);
          console.log(`   Nuevos keywords: ${newKeywords.join(", ")}\n`);
          updated++;
        }
      }
    }

    // Guardar el archivo actualizado
    fs.writeFileSync(categoriesPath, JSON.stringify(categoriesData, null, 2), "utf-8");

    console.log(`\n✅ Archivo actualizado: ${categoriesPath}`);
    console.log(`📊 Categorías actualizadas: ${updated}`);
  } catch (error) {
    console.error("❌ Error agregando keywords:", error);
    process.exit(1);
  }
}

addKeywords();
