import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Receipt, DollarSign } from "lucide-react";
import { createTrip } from "./actions";
import { getDrivers } from "./data";
import { Suspense } from "react";
import { DriverCombobox } from "./driver-combobox";

async function DriversList() {
  const drivers = await getDrivers();
  return <DriverCombobox drivers={drivers} />;
}

export function CreateTripModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Nuevo Viaje</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={createTrip}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Nuevo Viaje</DialogTitle>
            <DialogDescription>
              Registra un nuevo viaje con el monto adelantado al conductor
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Trip Number */}
            <div className="grid gap-2">
              <Label htmlFor="trip_number" className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                Número de Viaje
              </Label>
              <Input
                id="trip_number"
                name="trip_number"
                type="text"
                placeholder="Ej: V-2025-001"
                required
              />
            </div>

            {/* Driver Combobox */}
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">
                  Cargando choferes...
                </div>
              }
            >
              <DriversList />
            </Suspense>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="monto_adelantado"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  Monto Adelantado
                </Label>
                <Input
                  id="monto_adelantado"
                  name="monto_adelantado"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="moneda_adelantado">Moneda</Label>
                <select
                  id="moneda_adelantado"
                  name="moneda_adelantado"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="CLP">CLP - Chile</option>
                  <option value="ARS">ARS - Argentina</option>
                  <option value="BRL">BRL - Brasil</option>
                  <option value="PEN">PEN - Perú</option>
                  <option value="PYG">PYG - Paraguay</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton loadingText="Creando viaje...">
              Crear Viaje
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
