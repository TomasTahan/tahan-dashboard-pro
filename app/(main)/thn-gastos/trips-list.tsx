"use client";

import { useState, useMemo, useDeferredValue, useCallback } from "react";
import { Search, Filter, ChevronRight, Calendar, MapPin, User, Truck, Receipt } from "lucide-react";
import { TripStatusBadge } from "./trip-status-badge";

export type TripStatus = "nuevo" | "en-proceso" | "completado" | "cancelado";

export interface Trip {
  id: string;
  driverName: string;
  truckPlate: string;
  destination: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  status: TripStatus;
  totalExpenses: number;
  receiptsCount: number;
  initialBudget?: number;
}

interface TripsListProps {
  trips: Trip[];
  onTripClick: (tripId: string) => void;
}

// 🎯 Optimización 5: Mover fuera del componente para evitar recrearlo
const STATUS_OPTIONS: Array<{ value: TripStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
  { value: "en-proceso", label: "En Proceso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

export function TripsList({ trips, onTripClick }: TripsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TripStatus | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 🎯 Optimización 2: useDeferredValue para búsqueda no bloqueante
  // La UI del input responde instantáneamente, el filtrado se ejecuta después
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // 🎯 Optimización 4: Pre-normalizar strings para búsqueda más eficiente
  const normalizedSearch = useMemo(
    () => deferredSearchQuery.toLowerCase().trim(),
    [deferredSearchQuery]
  );

  // 🎯 Optimización 1: useMemo para filtrado (solo recalcula cuando cambian deps)
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Si no hay búsqueda, skip la validación de texto
      const matchesSearch =
        !normalizedSearch ||
        trip.driverName.toLowerCase().includes(normalizedSearch) ||
        trip.truckPlate.toLowerCase().includes(normalizedSearch) ||
        trip.destination.toLowerCase().includes(normalizedSearch);

      const matchesStatus = selectedStatus === "all" || trip.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [trips, normalizedSearch, selectedStatus]);

  // 🎯 Optimización 3: useCallback para handlers estables
  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handleStatusSelect = useCallback((status: TripStatus | "all") => {
    setSelectedStatus(status);
    setIsFilterOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedStatus("all");
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por chofer, patente o destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={handleToggleFilter}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${
              selectedStatus !== "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {selectedStatus !== "all" && (
              <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold">1</span>
            )}
          </button>

          {/* Filter Dropdown */}
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={handleCloseFilter}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Estado del Viaje
                  </p>
                </div>
                <div className="p-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedStatus === option.value
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredTrips.length} {filteredTrips.length === 1 ? "viaje" : "viajes"}
          {searchQuery && " encontrado(s)"}
        </span>
        {selectedStatus !== "all" && (
          <button
            onClick={handleClearFilters}
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
