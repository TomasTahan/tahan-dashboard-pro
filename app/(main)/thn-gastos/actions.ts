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
