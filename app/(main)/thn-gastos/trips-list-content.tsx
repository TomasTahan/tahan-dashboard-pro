"use client";

import { useMemo } from "react";
import { Search, ChevronRight, Calendar, MapPin, User, Truck, Receipt } from "lucide-react";
import { TripStatusBadge } from "./trip-status-badge";
import { Trip, TripStatus } from "./trips-list";

interface TripsListContentProps {
  trips: Trip[];
  searchQuery: string;
  selectedStatus: TripStatus | "all";
  onTripClick: (tripId: string) => void;
  onClearFilters: () => void;
}

export function TripsListContent({
  trips,
  searchQuery,
  selectedStatus,
  onTripClick,
  onClearFilters,
}: TripsListContentProps) {
  // Pre-normalizar búsqueda
  const normalizedSearch = useMemo(
    () => searchQuery.toLowerCase().trim(),
    [searchQuery]
  );

  // Filtrado optimizado
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        !normalizedSearch ||
        trip.driverName.toLowerCase().includes(normalizedSearch) ||
        trip.truckPlate.toLowerCase().includes(normalizedSearch) ||
        trip.destination.toLowerCase().includes(normalizedSearch);

      const matchesStatus = selectedStatus === "all" || trip.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [trips, normalizedSearch, selectedStatus]);

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredTrips.length} {filteredTrips.length === 1 ? "viaje" : "viajes"}
          {searchQuery && " encontrado(s)"}
        </span>
        {selectedStatus !== "all" && (
          <button
            onClick={onClearFilters}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron viajes</h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Intenta con otros términos de búsqueda"
              : "Crea un nuevo viaje para comenzar"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => onTripClick(trip.id)}
              className="group relative bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all text-left shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {trip.driverName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 ml-10">
                    <Truck className="w-4 h-4" />
                    <span className="uppercase font-mono font-medium">{trip.truckPlate}</span>
                  </div>
                </div>
                <TripStatusBadge status={trip.status} />
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{trip.destination}</span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>
                  {new Date(trip.startDate).toLocaleDateString("es-CL")} -{" "}
                  {trip.actualEndDate
                    ? new Date(trip.actualEndDate).toLocaleDateString("es-CL")
                    : new Date(trip.estimatedEndDate).toLocaleDateString("es-CL")}
                </span>
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Gastos</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${trip.totalExpenses.toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Boletas</p>
                      <p className="text-lg font-bold text-gray-700">{trip.receiptsCount}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>

              {/* Budget indicator if exists */}
              {trip.initialBudget && trip.totalExpenses > 0 && (
                <div className="absolute top-4 right-4">
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      trip.totalExpenses > trip.initialBudget
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {trip.totalExpenses > trip.initialBudget ? "Sobre" : "OK"} presupuesto
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
