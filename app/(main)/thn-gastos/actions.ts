"use server";

import { redirect } from "next/navigation";

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

  // TODO: Aquí debes integrar con tu base de datos
  // Por ejemplo, guardar en Supabase:
  // const supabase = createClient();
  // const { error } = await supabase.from('gastos').insert([data]);
  // if (error) throw error;

  console.log("Gasto confirmado:", data);

  // Revalidar la página para actualizar los datos
  // revalidatePath("/thn-gastos");

  // Opcional: redirigir a la siguiente boleta o a una página de confirmación
  // redirect("/thn-gastos");
}

export async function rejectExpense(receiptId: string, reason: string) {
  // TODO: Implementar lógica de rechazo
  console.log("Gasto rechazado:", receiptId, reason);

  // Aquí guardarías el rechazo en la base de datos
  // const supabase = createClient();
  // await supabase.from('gastos_rechazados').insert([{ receipt_id: receiptId, reason }]);
}
