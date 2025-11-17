"use client";

import { useState, useCallback } from "react";
import { Search, Filter } from "lucide-react";
import { TripStatus } from "./trips-list";

const STATUS_OPTIONS: Array<{ value: TripStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
  { value: "en-proceso", label: "En Proceso" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

interface TripFiltersProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TripStatus | "all") => void;
  currentStatus: TripStatus | "all";
}

export function TripFilters({ onSearchChange, onStatusChange, currentStatus }: TripFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handleStatusSelect = useCallback((status: TripStatus | "all") => {
    onStatusChange(status);
    setIsFilterOpen(false);
  }, [onStatusChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por chofer, patente o destino..."
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* Filter Button */}
      <div className="relative">
        <button
          onClick={handleToggleFilter}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${
            currentStatus !== "all"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtros
          {currentStatus !== "all" && (
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
                      currentStatus === option.value
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
  );
}
