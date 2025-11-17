import { Image as ImageIcon, CheckCircle2, Clock, XCircle, Calendar } from "lucide-react";
import type { Boleta } from "./currency-section";

type BoletaStatus = "creado" | "procesando" | "espera" | "confirmado" | "cancelado";

// Status badge component
function StatusBadge({ status }: { status: BoletaStatus }) {
  const styles = {
    creado: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    procesando: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    espera: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    confirmado: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    cancelado: "bg-red-500/10 text-red-700 border-red-500/20",
  };

  const icons = {
    creado: <Clock className="w-3 h-3" />,
    procesando: <Clock className="w-3 h-3" />,
    espera: <Clock className="w-3 h-3" />,
    confirmado: <CheckCircle2 className="w-3 h-3" />,
    cancelado: <XCircle className="w-3 h-3" />,
  };

  const labels = {
    creado: "Creado",
    procesando: "Procesando",
    espera: "Pendiente",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono uppercase tracking-wider ${styles[status]}`}>
      {icons[status]}
      {labels[status]}
    </div>
  );
}

// Currency symbol helper
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    CLP: "$",
    ARS: "$",
    BRL: "R$",
    PEN: "S/",
    PYG: "₲",
  };
  return symbols[currency] || currency;
}

export function BoletaCard({ boleta }: { boleta: Boleta }) {
  return (
    <div className="group relative bg-white border-2 border-stone-200 hover:border-stone-900 transition-all duration-300 overflow-hidden">
      {/* Diagonal corner stripe for status */}
      <div
        className={`absolute top-0 right-0 w-16 h-16 transform rotate-45 translate-x-8 -translate-y-8 ${
          boleta.estado === "confirmado"
            ? "bg-emerald-500"
            : boleta.estado === "espera"
            ? "bg-amber-500"
            : boleta.estado === "procesando"
            ? "bg-blue-500"
            : boleta.estado === "creado"
            ? "bg-gray-500"
            : "bg-red-500"
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Image preview */}
        <div className="relative aspect-[4/3] bg-stone-100 border-2 border-stone-200 overflow-hidden group-hover:border-stone-400 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-stone-300" />
          </div>
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold">Ver imagen</span>
          </div>
        </div>

        {/* Receipt info */}
        <div className="space-y-3">
          {/* Top row: status and reference */}
          <div className="flex items-start justify-between gap-2">
            <StatusBadge status={boleta.estado} />
            {boleta.referencia && (
              <span className="text-xs font-mono text-stone-500 bg-stone-50 px-2 py-1 border border-stone-200">
                {boleta.referencia}
              </span>
            )}
          </div>

          {/* Business name */}
          {boleta.razon_social && (
            <h4 className="font-bold text-stone-900 text-base leading-tight tracking-tight">
              {boleta.razon_social}
            </h4>
          )}

          {/* Description */}
          {boleta.descripcion && (
            <p className="text-sm text-stone-600 leading-snug">
              {boleta.descripcion}
            </p>
          )}

          {/* Date */}
          {boleta.date && (
            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {boleta.date}
            </div>
          )}

          {/* Amount */}
          <div className="pt-3 border-t-2 border-stone-900">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Total</span>
              <span className="text-2xl font-black text-stone-900 font-mono tabular-nums">
                {getCurrencySymbol(boleta.moneda)}
                {boleta.total.toLocaleString("es-CL")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
