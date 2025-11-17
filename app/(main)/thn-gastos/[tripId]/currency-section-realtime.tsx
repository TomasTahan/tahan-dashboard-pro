"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CurrencySection, type Boleta, type CurrencyGroup } from "./currency-section";

interface CurrencySectionRealtimeProps {
  tripId: string;
  initialGroup: CurrencyGroup;
  isMainCurrency: boolean;
  montoAdelantado: number;
}

export function CurrencySectionRealtime({
  tripId,
  initialGroup,
  isMainCurrency,
  montoAdelantado,
}: CurrencySectionRealtimeProps) {
  const [group, setGroup] = useState<CurrencyGroup>(initialGroup);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const supabase = createClient();

  // Función helper para recalcular stats del grupo
  const recalculateStats = useCallback((boletas: Boleta[]): CurrencyGroup => {
    const confirmadas = boletas.filter((b) => b.estado === "confirmado");
    const pendientes = boletas.filter((b) => b.estado === "espera");
    const canceladas = boletas.filter((b) => b.estado === "cancelado");

    return {
      moneda: initialGroup.moneda,
      total_boletas: boletas.length,
      boletas_confirmadas: confirmadas.length,
      boletas_pendientes: pendientes.length,
      boletas_canceladas: canceladas.length,
      monto_gastado: confirmadas.reduce((sum, b) => sum + b.total, 0),
      boletas,
    };
  }, [initialGroup.moneda]);

  useEffect(() => {
    // Crear canal único para este viaje y moneda
    const channel: RealtimeChannel = supabase.channel(
      `trip:${tripId}:boletas:${initialGroup.moneda}`
    );

    // Suscribirse a cambios INSERT en la tabla boletas
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

          // Solo agregar si es de nuestra moneda
          if (newBoleta.moneda !== initialGroup.moneda) {
            console.log(`⏭️  Skipping INSERT - different currency (${newBoleta.moneda} !== ${initialGroup.moneda})`);
            return;
          }

          setGroup((prev) => {
            // Deduplicación: verificar que no existe
            if (prev.boletas.find((b) => b.boleta_id === newBoleta.boleta_id)) {
              console.log("⚠️  Duplicate INSERT detected, skipping");
              return prev;
            }

            console.log(`✅ Adding new boleta ${newBoleta.boleta_id}`);
            // Agregar nueva boleta y recalcular stats
            const updatedBoletas = [...prev.boletas, newBoleta];
            return recalculateStats(updatedBoletas);
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

          // Solo actualizar si es de nuestra moneda
          if (updatedBoleta.moneda !== initialGroup.moneda) {
            console.log(`⏭️  Skipping UPDATE - different currency (${updatedBoleta.moneda} !== ${initialGroup.moneda})`);
            return;
          }

          setGroup((prev) => {
            const boletaExists = prev.boletas.find((b) => b.boleta_id === updatedBoleta.boleta_id);

            if (!boletaExists) {
              console.log("⚠️  UPDATE for non-existent boleta, skipping");
              return prev;
            }

            console.log(`✅ Updating boleta ${updatedBoleta.boleta_id}`);
            const updatedBoletas = prev.boletas.map((b) =>
              b.boleta_id === updatedBoleta.boleta_id ? updatedBoleta : b
            );
            return recalculateStats(updatedBoletas);
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

          setGroup((prev) => {
            const boletaExists = prev.boletas.find((b) => b.boleta_id === deletedId);

            if (!boletaExists) {
              console.log("⚠️  DELETE for non-existent boleta, skipping");
              return prev;
            }

            console.log(`✅ Removing boleta ${deletedId}`);
            const updatedBoletas = prev.boletas.filter(
              (b) => b.boleta_id !== deletedId
            );
            return recalculateStats(updatedBoletas);
          });
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Realtime status [${initialGroup.moneda}]:`, status);

        if (status === "SUBSCRIBED") {
          console.log(`✅ Realtime connected: ${initialGroup.moneda}`);
          setConnectionStatus("connected");
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`❌ Realtime error: ${initialGroup.moneda}`);
          setConnectionStatus("error");
        }
        if (status === "TIMED_OUT") {
          console.error(`⏱️  Realtime timeout: ${initialGroup.moneda}`);
          setConnectionStatus("error");
        }
        if (status === "CLOSED") {
          console.log(`🔌 Realtime closed: ${initialGroup.moneda}`);
          setConnectionStatus("connecting");
        }
      });

    // 🔥 CLEANUP: Crucial para evitar memory leaks
    return () => {
      console.log(`🧹 Cleaning up Realtime channel: ${initialGroup.moneda}`);
      supabase.removeChannel(channel);
    };
  }, [tripId, initialGroup.moneda, supabase, recalculateStats]);

  return (
    <div className="relative">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10">
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

      {/* Render visual component */}
      <CurrencySection
        group={group}
        isMainCurrency={isMainCurrency}
        montoAdelantado={montoAdelantado}
      />
    </div>
  );
}
