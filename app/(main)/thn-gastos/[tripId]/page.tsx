import { SiteHeader } from "@/components/site-header";
import { Suspense } from "react";
import { ArrowLeft, MapPin, Calendar, Wallet } from "lucide-react";
import Link from "next/link";
import { AddBoletaModal } from "./add-boleta-modal";
import { TripDetailRealtime } from "./trip-detail-realtime";
import { getTripDetail, type TripDetail as TripDetailType, type TripStatus } from "../data";
import { notFound } from "next/navigation";

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

// Trip header component
function TripHeader({ trip }: { trip: TripDetailType }) {
  const statusStyles: Record<TripStatus, string> = {
    planned: "bg-blue-500 text-white",
    in_progress: "bg-amber-500 text-white",
    completed: "bg-emerald-500 text-white",
    confirmed: "bg-sky-500 text-white",
    pending_approval: "bg-orange-500 text-white",
    on_hold: "bg-gray-500 text-white",
    cancelled: "bg-red-500 text-white",
  };

  const statusLabels: Record<TripStatus, string> = {
    planned: "Nuevo",
    in_progress: "En Curso",
    completed: "Finalizado",
    confirmed: "Confirmado",
    pending_approval: "Pendiente",
    on_hold: "En Espera",
    cancelled: "Cancelado",
  };

  return (
    <div className="bg-white border-4 border-stone-900 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Back button and status */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/thn-gastos"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-mono text-sm uppercase tracking-wider transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </Link>

        <div className={`px-4 py-2 font-black text-sm uppercase tracking-widest ${statusStyles[trip.status]}`}>
          {statusLabels[trip.status]}
        </div>
      </div>

      {/* Trip number and driver */}
      <div className="space-y-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2">Número de Viaje</div>
          <div className="text-5xl font-black tracking-tighter text-stone-900 font-mono">
            {trip.trip_number}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2">Conductor</div>
          <div className="text-2xl font-bold text-stone-900">
            {trip.driver}
          </div>
        </div>
      </div>

      {/* Trip details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t-2 border-stone-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-stone-500">
            <MapPin className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Ruta</span>
          </div>
          <div className="text-base font-bold text-stone-900 leading-tight">
            {trip.destination}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-stone-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Inicio</span>
          </div>
          <div className="text-base font-mono text-stone-900">
            {trip.start_date
              ? new Date(trip.start_date).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "No definido"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-stone-500">
            <Wallet className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-bold">Adelantado</span>
          </div>
          <div className="text-xl font-black font-mono text-stone-900 tabular-nums">
            {getCurrencySymbol(trip.moneda_adelantado)}
            {trip.monto_adelantado.toLocaleString("es-CL")} {trip.moneda_adelantado}
          </div>
        </div>
      </div>
    </div>
  );
}


// Main data component
async function TripDetailData({ tripId }: { tripId: string }) {
  const trip = await getTripDetail(tripId);

  if (!trip) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Trip header */}
      <TripHeader trip={trip} />

      {/* Add boleta button */}
      <div className="flex justify-end">
        <AddBoletaModal tripId={tripId} />
      </div>

      {/* Currency sections with Realtime (un solo canal para todo el trip) */}
      <TripDetailRealtime
        tripId={tripId}
        initialGroups={trip.currency_groups}
        monedaAdelantado={trip.moneda_adelantado}
        montoAdelantado={trip.monto_adelantado}
      />
    </div>
  );
}

// Skeleton loader
function TripDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-4 border-stone-200 p-8">
        <div className="h-6 bg-stone-200 w-32 mb-6"></div>
        <div className="space-y-4 mb-8">
          <div className="h-12 bg-stone-200 w-64"></div>
          <div className="h-8 bg-stone-200 w-48"></div>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-stone-200">
          <div className="h-16 bg-stone-200"></div>
          <div className="h-16 bg-stone-200"></div>
          <div className="h-16 bg-stone-200"></div>
        </div>
      </div>

      {/* Currency sections skeleton */}
      {[1, 2].map((i) => (
        <div key={i} className="border-4 border-stone-200 bg-white">
          <div className="bg-stone-200 p-6 h-48"></div>
          <div className="p-6 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-64 bg-stone-100"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function generateStaticParams() {
  return [{ tripId: '00000000-0000-0000-0000-000000000000' }];
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <>
      <SiteHeader title="Detalle de Viaje" />

      <div className="min-h-screen bg-stone-100 p-6">
        <div className="max-w-[1600px] mx-auto">
          <Suspense fallback={<TripDetailSkeleton />}>
            <TripDetailData tripId={tripId} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
