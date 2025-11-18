import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkLastBoleta() {
  // Obtener la última boleta creada
  const { data, error } = await supabase
    .from("boletas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error al consultar:", error);
    return;
  }

  console.log("\n📋 ÚLTIMA BOLETA CREADA:");
  console.log("========================\n");
  console.log("ID:", data.boleta_id);
  console.log("Trip ID:", data.trip_id);
  console.log("Estado:", data.estado);
  console.log("Referencia:", data.referencia);
  console.log("Razón Social:", data.razon_social);
  console.log("Fecha:", data.date);
  console.log("Total:", data.total);
  console.log("Moneda:", data.moneda);
  console.log("Descripción:", data.descripcion);
  console.log("Identificador Fiscal:", data.identificador_fiscal);
  console.log("\n📦 METADATA:");
  console.log(JSON.stringify(data.metadata, null, 2));
  console.log("\n⏰ Fechas:");
  console.log("Creado:", data.created_at);
  console.log("Actualizado:", data.updated_at);
}

checkLastBoleta();
