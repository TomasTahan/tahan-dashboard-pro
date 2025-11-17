"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CurrencySection, type Boleta, type CurrencyGroup } from "./currency-section";

interface TripDetailRealtimeProps {
  tripId: string;
  initialGroups: CurrencyGroup[];
  monedaAdelantado: string;
  montoAdelantado: number;
}

export function TripDetailRealtime({
  tripId,
  initialGroups,
  monedaAdelantado,
  montoAdelantado,
}: TripDetailRealtimeProps) {
  const [currencyGroups, setCurrencyGroups] = useState<CurrencyGroup[]>(initialGroups);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const supabase = createClient();

  // Función helper para recalcular stats de un grupo
  const recalculateGroupStats = useCallback((boletas: Boleta[]): Omit<CurrencyGroup, "moneda"> => {
    const confirmadas = boletas.filter((b) => b.estado === "confirmado");
    const pendientes = boletas.filter((b) => b.estado === "espera");
    const canceladas = boletas.filter((b) => b.estado === "cancelado");

    return {
      total_boletas: boletas.length,
      boletas_confirmadas: confirmadas.length,
      boletas_pendientes: pendientes.length,
      boletas_canceladas: canceladas.length,
      monto_gastado: confirmadas.reduce((sum, b) => sum + b.total, 0),
      boletas,
    };
  }, []);

  // Agrupar boletas por moneda
  const groupBoletas = useCallback((allBoletas: Boleta[]): CurrencyGroup[] => {
    const grouped = allBoletas.reduce((acc, boleta) => {
      if (!acc[boleta.moneda]) {
        acc[boleta.moneda] = [];
      }
      acc[boleta.moneda].push(boleta);
      return acc;
    }, {} as Record<string, Boleta[]>);

    return Object.entries(grouped).map(([moneda, boletas]) => ({
      moneda,
      ...recalculateGroupStats(boletas),
    }));
  }, [recalculateGroupStats]);

  useEffect(() => {
    // 🎯 UN SOLO CANAL para TODO el viaje
    const channel: RealtimeChannel = supabase.channel(`trip:${tripId}:boletas`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "boletas",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("🆕 INSERT detected:", payload);
          const newBoleta = payload.new as Boleta;

          setCurrencyGroups((prevGroups) => {
            // Obtener todas las boletas actuales
            const allBoletas = prevGroups.flatMap((g) => g.boletas);

            // Deduplicación
            if (allBoletas.find((b) => b.boleta_id === newBoleta.boleta_id)) {
              console.log("⚠️  Duplicate INSERT detected, skipping");
              return prevGroups;
            }

            console.log(`✅ Adding new boleta ${newBoleta.boleta_id} (${newBoleta.moneda})`);

            // Agregar nueva boleta y reagrupar
            const updatedBoletas = [...allBoletas, newBoleta];
            return groupBoletas(updatedBoletas);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "boletas",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("🔄 UPDATE detected:", payload);
          const updatedBoleta = payload.new as Boleta;

          setCurrencyGroups((prevGroups) => {
            const allBoletas = prevGroups.flatMap((g) => g.boletas);

            const boletaExists = allBoletas.find((b) => b.boleta_id === updatedBoleta.boleta_id);
            if (!boletaExists) {
              console.log("⚠️  UPDATE for non-existent boleta, skipping");
              return prevGroups;
            }

            console.log(`✅ Updating boleta ${updatedBoleta.boleta_id}`);

            // Actualizar boleta y reagrupar (por si cambió la moneda)
            const updatedBoletas = allBoletas.map((b) =>
              b.boleta_id === updatedBoleta.boleta_id ? updatedBoleta : b
            );
            return groupBoletas(updatedBoletas);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "boletas",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("🗑️  DELETE detected:", payload);
          const deletedId = payload.old.boleta_id;

          setCurrencyGroups((prevGroups) => {
            const allBoletas = prevGroups.flatMap((g) => g.boletas);

            const boletaExists = allBoletas.find((b) => b.boleta_id === deletedId);
            if (!boletaExists) {
              console.log("⚠️  DELETE for non-existent boleta, skipping");
              return prevGroups;
            }

            console.log(`✅ Removing boleta ${deletedId}`);

            const updatedBoletas = allBoletas.filter((b) => b.boleta_id !== deletedId);
            return groupBoletas(updatedBoletas);
          });
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Realtime status [Trip ${tripId}]:`, status);

        if (status === "SUBSCRIBED") {
          console.log(`✅ Realtime connected for trip ${tripId}`);
          setConnectionStatus("connected");
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`❌ Realtime error for trip ${tripId}`);
          setConnectionStatus("error");
        }
        if (status === "TIMED_OUT") {
          console.error(`⏱️  Realtime timeout for trip ${tripId}`);
          setConnectionStatus("error");
        }
        if (status === "CLOSED") {
          console.log(`🔌 Realtime closed for trip ${tripId}`);
          setConnectionStatus("connecting");
        }
      });

    // 🔥 CLEANUP: Crucial para evitar memory leaks
    return () => {
      console.log(`🧹 Cleaning up Realtime channel for trip ${tripId}`);
      supabase.removeChannel(channel);
    };
  }, [tripId, supabase, groupBoletas]);

  return (
    <div className="space-y-8">
      {/* Connection status indicator (global para todo el viaje) */}
      <div className="flex justify-end">
        {connectionStatus === "connected" && (
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider">En vivo</span>
          </div>
        )}
        {connectionStatus === "connecting" && (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 px-3 py-1.5 rounded-md border border-amber-500/20">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider">Conectando...</span>
          </div>
        )}
        {connectionStatus === "error" && (
          <div className="flex items-center gap-2 bg-red-500/10 text-red-700 px-3 py-1.5 rounded-md border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-xs font-mono uppercase tracking-wider">Error</span>
          </div>
        )}
      </div>

      {/* Currency sections */}
      {currencyGroups.map((group) => (
        <CurrencySection
          key={group.moneda}
          group={group}
          isMainCurrency={group.moneda === monedaAdelantado}
          montoAdelantado={montoAdelantado}
        />
      ))}

      {/* Empty state */}
      {currencyGroups.length === 0 && (
        <div className="text-center py-12 text-stone-500">
          <p className="text-lg font-mono">No hay boletas aún</p>
          <p className="text-sm mt-2">Las boletas aparecerán aquí en tiempo real cuando se agreguen</p>
        </div>
      )}
    </div>
  );
}
