import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPendingReceipt, getReceiptNavigationInfo } from "./data";
import { confirmExpense } from "./actions";
import { ReceiptNavigation } from "./receipt-navigation";

type ReceiptFormProps = {
  receiptId?: string;
};

export async function ReceiptForm({ receiptId }: ReceiptFormProps) {
  const receipt = await getPendingReceipt(receiptId);

  if (!receipt) {
    return (
      <section className="flex flex-col items-center justify-center rounded-xl border bg-muted/10 p-8 shadow-xs">
        <p className="text-muted-foreground">No se encontró la boleta</p>
      </section>
    );
  }

  // Obtener información de navegación
  const navigationInfo = await getReceiptNavigationInfo(receipt.id);

  return (
    <section className="flex flex-col rounded-xl border bg-muted/10 p-4 shadow-xs">
      {/* Navegación entre boletas */}
      <div className="mb-4">
        <ReceiptNavigation
          previousId={navigationInfo.previousId}
          nextId={navigationInfo.nextId}
          currentIndex={navigationInfo.currentIndex}
          totalCount={navigationInfo.totalCount}
        />
      </div>

      <form
        action={confirmExpense}
        className="flex flex-1 flex-col gap-4"
        noValidate
      >
        {/* Campo oculto con el ID de la boleta */}
        <input type="hidden" name="boleta_id" value={receipt.id} />

        <div className="grid gap-4">
          <div className="space-y-2">
            <label
              htmlFor="referencia"
              className="text-sm font-medium text-foreground"
            >
              Referencia
            </label>
            <Input
              id="referencia"
              name="referencia"
              defaultValue={receipt.referencia}
              placeholder="Número de referencia"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="razon_social"
              className="text-sm font-medium text-foreground"
            >
              Razón social
            </label>
            <Input
              id="razon_social"
              name="razon_social"
              defaultValue={receipt.razon_social}
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="date"
                className="text-sm font-medium text-foreground"
              >
                Fecha<span className="text-destructive">*</span>
              </label>
              <Input
                id="date"
                name="date"
                defaultValue={receipt.date}
                placeholder="dd/mm/aaaa hh:mm:ss"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="total"
                className="text-sm font-medium text-foreground"
              >
                Total<span className="text-destructive">*</span>
              </label>
              <Input
                id="total"
                name="total"
                type="number"
                step="0.01"
                defaultValue={receipt.total}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="moneda"
                className="text-sm font-medium text-foreground"
              >
                Moneda
              </label>
              <Input
                id="moneda"
                name="moneda"
                defaultValue={receipt.moneda}
                placeholder="PYG"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="identificador_fiscal"
                className="text-sm font-medium text-foreground"
              >
                Identificador fiscal
              </label>
              <Input
                id="identificador_fiscal"
                name="identificador_fiscal"
                defaultValue={receipt.identificador_fiscal}
                placeholder="RUC o similar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="descripcion"
              className="text-sm font-medium text-foreground"
            >
              Descripción
            </label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={receipt.descripcion}
              placeholder="Contexto del gasto"
              rows={4}
            />
          </div>
        </div>

        <div className="rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <p>
            Los campos marcados con{" "}
            <span className="text-destructive">*</span> son obligatorios para
            registrar el gasto.
          </p>
        </div>

        <Button
          type="submit"
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600"
        >
          Confirmar
        </Button>
      </form>
    </section>
  );
}
