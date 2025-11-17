import { Calendar } from "lucide-react";
import { BoletaCard } from "./boleta-card";

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

// Currency flag helper
function getCurrencyFlag(currency: string): string {
  const flags: Record<string, string> = {
    CLP: "🇨🇱",
    ARS: "🇦🇷",
    BRL: "🇧🇷",
    PEN: "🇵🇪",
    PYG: "🇵🇾",
  };
  return flags[currency] || "💱";
}

export interface Boleta {
  boleta_id: string;
  url: string | null;
  referencia: string | null;
  razon_social: string | null;
  date: string | null;
  total: number;
  moneda: string;
  descripcion: string | null;
  identificador_fiscal: string | null;
  estado: "creado" | "procesando" | "espera" | "confirmado" | "cancelado";
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CurrencyGroup {
  moneda: string;
  total_boletas: number;
  boletas_confirmadas: number;
  boletas_pendientes: number;
  boletas_canceladas: number;
  monto_gastado: number;
  boletas: Boleta[];
}

interface CurrencySectionProps {
  group: CurrencyGroup;
  isMainCurrency: boolean;
  montoAdelantado: number;
}

export function CurrencySection({
  group,
  isMainCurrency,
  montoAdelantado
}: CurrencySectionProps) {
  const balance = isMainCurrency ? montoAdelantado - group.monto_gastado : null;
  const shouldReturn = balance !== null && balance > 0;
  const owedToDriver = balance !== null && balance < 0;

  return (
    <div className="border-4 border-stone-900 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-stone-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{getCurrencyFlag(group.moneda)}</span>
            <div>
              <h3 className="text-2xl font-black tracking-tight">
                {group.moneda}
              </h3>
              <p className="text-sm text-stone-400 font-mono">
                {group.total_boletas} boleta{group.total_boletas !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-1 font-bold">Total Gastado</div>
            <div className="text-3xl font-black font-mono tabular-nums">
              {getCurrencySymbol(group.moneda)}
              {group.monto_gastado.toLocaleString("es-CL")}
            </div>
          </div>
        </div>

        {/* Balance (only for main currency) */}
        {isMainCurrency && balance !== null && (
          <div className={`mt-4 pt-4 border-t-2 ${shouldReturn ? 'border-emerald-500' : owedToDriver ? 'border-amber-500' : 'border-stone-700'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 mb-1 font-bold">Adelantado</div>
                <div className="text-lg font-mono tabular-nums text-stone-300">
                  {getCurrencySymbol(group.moneda)}
                  {montoAdelantado.toLocaleString("es-CL")}
                </div>
              </div>

              <div className="text-right">
                <div className={`text-xs uppercase tracking-widest mb-1 font-bold ${
                  shouldReturn ? 'text-emerald-400' : owedToDriver ? 'text-amber-400' : 'text-stone-400'
                }`}>
                  {shouldReturn ? "Debe devolver" : owedToDriver ? "Se le debe" : "Balance"}
                </div>
                <div className={`text-2xl font-black font-mono tabular-nums ${
                  shouldReturn ? 'text-emerald-400' : owedToDriver ? 'text-amber-400' : 'text-white'
                }`}>
                  {getCurrencySymbol(group.moneda)}
                  {Math.abs(balance).toLocaleString("es-CL")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-4 pt-4 border-t border-stone-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-black font-mono text-emerald-400">{group.boletas_confirmadas}</div>
            <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">Confirmadas</div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-amber-400">{group.boletas_pendientes}</div>
            <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">Pendientes</div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-red-400">{group.boletas_canceladas}</div>
            <div className="text-xs uppercase tracking-wider text-stone-400 mt-1">Canceladas</div>
          </div>
        </div>
      </div>

      {/* Boletas grid */}
      <div className="p-6 bg-stone-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {group.boletas.map((boleta) => (
            <BoletaCard key={boleta.boleta_id} boleta={boleta} />
          ))}
        </div>
      </div>
    </div>
  );
}
