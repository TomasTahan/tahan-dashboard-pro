"use client";

import { useState, useDeferredValue, useCallback, useMemo } from "react";
import { Trip, TripStatus } from "./trips-list";
import { TripFilters } from "./trip-filters";
import { TripsListContent } from "./trips-list-content";
import type { TripListItem } from "./data";
import { useRouter } from "next/navigation";

interface TripsListWrapperProps {
  trips: TripListItem[];
}

// Mapear status de BD a status de UI
function mapStatus(dbStatus: string): TripStatus {
  const statusMap: Record<string, TripStatus> = {
    planned: "nuevo",
    in_progress: "en-proceso",
    completed: "completado",
    cancelled: "cancelado",
    confirmed: "nuevo",
    pending_approval: "en-proceso",
    on_hold: "en-proceso",
  };
  return statusMap[dbStatus] || "nuevo";
}

// Transformar TripListItem a Trip (formato esperado por el componente de UI)
function transformTrips(dbTrips: TripListItem[]): Trip[] {
  return dbTrips.map((trip) => ({
    id: trip.id,
    driverName: trip.driver,
    truckPlate: "N/A", // TODO: Agregar campo truck_plate a la BD
    destination: trip.destination,
    startDate: trip.start_date || trip.created_at,
    estimatedEndDate: trip.end_date || trip.created_at,
    actualEndDate: trip.status === "completed" ? trip.end_date || undefined : undefined,
    status: mapStatus(trip.status),
    totalExpenses: trip.total_expenses,
    receiptsCount: trip.receipts_count,
    initialBudget: trip.monto_adelantado > 0 ? trip.monto_adelantado : undefined,
  }));
}

export function TripsListWrapper({ trips: dbTrips }: TripsListWrapperProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TripStatus | "all">("all");

  // Transformar trips una sola vez
  const trips = useMemo(() => transformTrips(dbTrips), [dbTrips]);

  // Usar deferred value para no bloquear la UI del input
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleTripClick = useCallback((tripId: string) => {
    router.push(`/thn-gastos/${tripId}`);
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setSelectedStatus("all");
  }, []);

  return (
    <div className="space-y-4">
      {/* Filtros estáticos - siempre visibles */}
      <TripFilters
        onSearchChange={setSearchQuery}
        onStatusChange={setSelectedStatus}
        currentStatus={selectedStatus}
      />

      {/* Contenido dinámico - Ya NO necesita Suspense aquí porque el Suspense está en page.tsx */}
      <TripsListContent
        trips={trips}
        searchQuery={deferredSearchQuery}
        selectedStatus={selectedStatus}
        onTripClick={handleTripClick}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}
