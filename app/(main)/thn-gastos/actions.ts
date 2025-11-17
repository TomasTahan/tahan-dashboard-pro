"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getReceiptNavigationInfo, getPendingReceipt } from "./data";

export type ExpenseFormData = {
  referencia: string;
  razon_social: string;
  date: string;
  total: number;
  moneda: string;
  identificador_fiscal: string;
  descripcion: string;
};

export type CreateTripFormData = {
  trip_number: string;
  driver_id: string;
  monto_adelantado: number;
  moneda_adelantado: string;
};

export async function confirmExpense(formData: FormData) {
  const supabase = await createClient();

  // Obtener el ID de la boleta (lo necesitamos para actualizar el estado)
  const boletaId = formData.get("boleta_id") as string;

  // Extraer los datos del formulario
  const data: ExpenseFormData = {
    referencia: formData.get("referencia") as string,
    razon_social: formData.get("razon_social") as string,
    date: formData.get("date") as string,
    total: parseFloat(formData.get("total") as string),
    moneda: formData.get("moneda") as string,
    identificador_fiscal: formData.get("identificador_fiscal") as string,
    descripcion: formData.get("descripcion") as string,
  };

  // Validación básica de campos obligatorios
  if (!data.date || !data.total) {
    throw new Error("Los campos fecha y total son obligatorios");
  }

  try {
    // 0. Obtener la información de navegación ANTES de cambiar el estado
    const navInfo = await getReceiptNavigationInfo(boletaId);

    // 1. Actualizar la boleta en Supabase con los datos confirmados
    const { error: updateError } = await supabase
      .from("boletas")
      .update({
        referencia: data.referencia,
        razon_social: data.razon_social,
        date: data.date,
        total: data.total,
        moneda: data.moneda,
        identificador_fiscal: data.identificador_fiscal,
        descripcion: data.descripcion,
        estado: "confirmado",
      })
      .eq("boleta_id", boletaId);

    if (updateError) {
      console.error("Error updating boleta:", updateError);
      throw new Error("Error al actualizar la boleta en la base de datos");
    }

    // 2. Enviar al webhook de N8N
    const response = await fetch(process.env.N8N_HITL_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, boleta_id: boletaId }),
    });

    if (!response.ok) {
      console.error("Webhook error:", response.statusText);
      // No lanzamos error aquí porque ya actualizamos la base de datos
    }

    console.log("Gasto confirmado:", data);

    // Revalidar la página para actualizar los datos
    revalidatePath("/thn-gastos");

    // Redirigir a la siguiente boleta si existe, sino a la primera pendiente
    if (navInfo.nextId) {
      redirect(`/thn-gastos?id=${navInfo.nextId}`);
    } else {
      // Si no hay siguiente, intentar cargar la primera boleta pendiente
      const nextReceipt = await getPendingReceipt();
      if (nextReceipt) {
        redirect(`/thn-gastos?id=${nextReceipt.id}`);
      } else {
        // No hay más boletas pendientes
        redirect("/thn-gastos");
      }
    }
  } catch (error) {
    console.error("Error in confirmExpense:", error);
    throw error;
  }
}

export async function rejectExpense(receiptId: string, reason: string) {
  const supabase = await createClient();

  try {
    // 0. Obtener la información de navegación ANTES de cambiar el estado
    const navInfo = await getReceiptNavigationInfo(receiptId);

    // 1. Actualizar el estado de la boleta a "cancelado"
    const { error } = await supabase
      .from("boletas")
      .update({
        estado: "cancelado",
        descripcion: reason, // Guardar la razón del rechazo en la descripción
      })
      .eq("boleta_id", receiptId);

    if (error) {
      console.error("Error rejecting expense:", error);
      throw new Error("Error al rechazar el gasto");
    }

    console.log("Gasto rechazado:", receiptId, reason);

    // Revalidar la página para actualizar los datos
    revalidatePath("/thn-gastos");

    // Redirigir a la siguiente boleta si existe, sino a la primera pendiente
    if (navInfo.nextId) {
      redirect(`/thn-gastos?id=${navInfo.nextId}`);
    } else {
      // Si no hay siguiente, intentar cargar la primera boleta pendiente
      const nextReceipt = await getPendingReceipt();
      if (nextReceipt) {
        redirect(`/thn-gastos?id=${nextReceipt.id}`);
      } else {
        // No hay más boletas pendientes
        redirect("/thn-gastos");
      }
    }
  } catch (error) {
    console.error("Error in rejectExpense:", error);
    throw error;
  }
}

export async function createTrip(formData: FormData) {
  const supabase = await createClient();

  // Extraer datos del formulario
  const tripNumber = formData.get("trip_number") as string;
  const driverId = formData.get("driver_id") as string;
  const montoAdelantado = parseFloat(formData.get("monto_adelantado") as string);
  const monedaAdelantado = formData.get("moneda_adelantado") as string;

  // Validación básica
  if (!tripNumber?.trim()) {
    throw new Error("El número de viaje es obligatorio");
  }

  if (!driverId?.trim()) {
    throw new Error("Debes seleccionar un chofer");
  }

  if (!montoAdelantado || isNaN(montoAdelantado)) {
    throw new Error("El monto adelantado es obligatorio");
  }

  if (montoAdelantado <= 0) {
    throw new Error("El monto adelantado debe ser mayor a 0");
  }

  if (!monedaAdelantado?.trim()) {
    throw new Error("Debes seleccionar una moneda");
  }

  try {
    // Obtener información del driver desde drivers_info (vista optimizada)
    const { data: driverData, error: driverError } = await supabase
      .from("drivers_info")
      .select("nombre_completo")
      .eq("user_id", driverId)
      .single();

    if (driverError) {
      console.error("Error fetching driver:", driverError);
      throw new Error(
        `No se pudo encontrar el chofer seleccionado. Error: ${driverError.message}`
      );
    }

    if (!driverData) {
      throw new Error("El chofer seleccionado no existe en el sistema");
    }

    // Usar el nombre completo de la vista
    const driverName = driverData.nombre_completo;

    // Crear el viaje
    const { data: newTrip, error: createError } = await supabase
      .from("trips")
      .insert({
        trip_number: tripNumber,
        driver_id: driverId,
        driver: driverName,
        monto_adelantado: montoAdelantado,
        moneda_adelantado: monedaAdelantado,
        date: new Date().toISOString(),
        destination: "", // Vacío por ahora, se puede agregar después
        status: "planned",
      })
      .select()
      .single();

    if (createError || !newTrip) {
      console.error("Error creating trip:", createError);
      throw new Error("Error al crear el viaje");
    }

    console.log("Viaje creado:", newTrip);

    // Revalidar la página
    revalidatePath("/thn-gastos");

    // Redirigir al detalle del viaje
    redirect(`/thn-gastos/${newTrip.id}`);
  } catch (error) {
    console.error("Error in createTrip:", error);
    throw error;
  }
}
