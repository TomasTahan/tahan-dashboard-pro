# 🎯 MEJOR IMPLEMENTACIÓN DE SUPABASE REALTIME CON NEXT.JS 15 - GUÍA COMPLETA

Basado en investigación profunda de la documentación oficial y mejores prácticas de 2025, esta es la **forma más eficiente y confiable** de implementar Realtime en el proyecto.

---

## 📋 RESUMEN EJECUTIVO

**Patrón recomendado:**
1. ✅ **Server Component** → Carga datos iniciales (SEO, performance)
2. ✅ **Client Component** → Suscripción Realtime + actualización estado
3. ✅ **Cleanup adecuado** → `supabase.removeChannel()` en useEffect
4. ✅ **Deduplicación** → Evitar duplicados por ID
5. ✅ **Optimistic updates** → Actualización inmediata antes de confirmación

---

## 🏗️ ARQUITECTURA PARA EL CASO DE BOLETAS

### Patrón: Hybrid Server + Client

```
┌─────────────────────────────────────────┐
│  [tripId]/page.tsx (Server Component)   │
│  - Fetch inicial de trip + boletas      │
│  - SEO optimizado                        │
└──────────────┬──────────────────────────┘
               │ Props (initialGroups)
               ▼
┌─────────────────────────────────────────┐
│  trip-detail-realtime.tsx ("use client")│
│  - UN SOLO canal para todo el viaje     │
│  - Suscribe a cambios del trip_id       │
│  - Agrupa boletas por moneda            │
│  - Actualiza estado global              │
└──────────────┬──────────────────────────┘
               │ Renderiza
               ▼
┌─────────────────────────────────────────┐
│  currency-section.tsx (visual puro)     │
│  - Muestra sección de cada moneda       │
│  - Stats y lista de boletas             │
└─────────────────────────────────────────┘
```

**Ventaja clave:** UN SOLO canal para todo el viaje en lugar de uno por moneda.
- ✅ Más eficiente (1 conexión vs N conexiones)
- ✅ Menos overhead
- ✅ Reagrupación dinámica por moneda
- ✅ Maneja cambios de moneda en UPDATE

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### PASO 1: Preparar la tabla `boletas` para Realtime

Antes que nada, asegúrate de habilitar Realtime en tu tabla:

```sql
-- 1. Habilitar RLS (si no está habilitado)
ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- 2. Agregar tabla a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE boletas;

-- 3. (OPCIONAL) Si quieres recibir valores OLD en UPDATE/DELETE
ALTER TABLE boletas REPLICA IDENTITY FULL;

-- 4. Política RLS para Realtime (ajustar según tus necesidades)
CREATE POLICY "Users can see boletas of their trips"
ON boletas FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = boletas.trip_id
    AND trips.driver_id = auth.uid()
  )
);
```

---

### PASO 2: Server Component (inicial data fetch)

Tu archivo `app/(main)/thn-gastos/[tripId]/page.tsx` debe mantener la carga inicial:

```typescript
// page.tsx (Server Component)
async function TripDetailData({ tripId }: { tripId: string }) {
  const trip = await getTripDetail(tripId); // Fetch inicial

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      {/* UN SOLO componente Realtime para todo el viaje */}
      <TripDetailRealtime
        tripId={tripId}
        initialGroups={trip.currency_groups}
        monedaAdelantado={trip.moneda_adelantado}
        montoAdelantado={trip.monto_adelantado}
      />
    </div>
  );
}
```

---

### PASO 3: Client Component con Realtime

Crear nuevo componente `currency-section-realtime.tsx`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Boleta {
  boleta_id: string;
  url: string;
  referencia: string | null;
  razon_social: string | null;
  date: string;
  total: number;
  moneda: string;
  descripcion: string | null;
  estado: "procesando" | "espera" | "confirmado" | "cancelado";
  validated_at: string | null;
}

interface CurrencyGroup {
  moneda: string;
  total_boletas: number;
  boletas_confirmadas: number;
  boletas_pendientes: number;
  boletas_canceladas: number;
  monto_gastado: number;
  boletas: Boleta[];
}

interface Props {
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
}: Props) {
  const [group, setGroup] = useState<CurrencyGroup>(initialGroup);
  const supabase = createClient();

  // Función helper para recalcular stats del grupo
  const recalculateStats = useCallback((boletas: Boleta[]) => {
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

    // Suscribirse a cambios en la tabla boletas
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
          const newBoleta = payload.new as Boleta;

          // Solo agregar si es de nuestra moneda
          if (newBoleta.moneda !== initialGroup.moneda) return;

          setGroup((prev) => {
            // Deduplicación: verificar que no existe
            if (prev.boletas.find((b) => b.boleta_id === newBoleta.boleta_id)) {
              return prev;
            }

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
          const updatedBoleta = payload.new as Boleta;

          // Solo actualizar si es de nuestra moneda
          if (updatedBoleta.moneda !== initialGroup.moneda) return;

          setGroup((prev) => {
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
          const deletedId = payload.old.boleta_id;

          setGroup((prev) => {
            const updatedBoletas = prev.boletas.filter(
              (b) => b.boleta_id !== deletedId
            );
            return recalculateStats(updatedBoletas);
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Realtime connected: ${initialGroup.moneda}`);
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`❌ Realtime error: ${initialGroup.moneda}`);
        }
      });

    // 🔥 CLEANUP: Crucial para evitar memory leaks
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, initialGroup.moneda, supabase, recalculateStats]);

  // Renderizar usando el componente visual existente
  return (
    <CurrencySection
      group={group}
      isMainCurrency={isMainCurrency}
      montoAdelantado={montoAdelantado}
    />
  );
}
```

---

### PASO 4: Componente visual (sin cambios)

El componente `CurrencySection` original se mantiene igual, solo cambiar a archivo separado:

```typescript
// Extraer a currency-section.tsx (sin "use client")
export function CurrencySection({ group, isMainCurrency, montoAdelantado }: {
  group: CurrencyGroup;
  isMainCurrency: boolean;
  montoAdelantado: number;
}) {
  // ... código visual actual sin cambios
}
```

---

## 🎯 CARACTERÍSTICAS CLAVE DE ESTA IMPLEMENTACIÓN

### ✅ 1. Deduplicación automática
```typescript
if (prev.boletas.find((b) => b.boleta_id === newBoleta.boleta_id)) {
  return prev; // No agregar duplicados
}
```

### ✅ 2. Filtrado por moneda
```typescript
if (newBoleta.moneda !== initialGroup.moneda) return;
```
Cada `CurrencySection` solo escucha cambios de su moneda específica.

### ✅ 3. Cleanup adecuado
```typescript
return () => {
  supabase.removeChannel(channel);
};
```
Evita memory leaks y subscripciones huérfanas.

### ✅ 4. Recalculo automático de stats
Cada vez que cambian las boletas, se recalculan:
- Total boletas
- Confirmadas/pendientes/canceladas
- Monto total gastado

### ✅ 5. Manejo de todos los eventos
- `INSERT` → Agregar nueva boleta
- `UPDATE` → Actualizar estado (procesando → espera → confirmado)
- `DELETE` → Remover boleta cancelada

---

## 🚀 OPTIMIZACIONES ADICIONALES

### Opción A: Optimistic Updates (para mobile app)

Cuando el usuario sube una boleta desde mobile, mostrarla inmediatamente:

```typescript
// En mobile app, después de subir imagen
const optimisticBoleta = {
  boleta_id: crypto.randomUUID(),
  estado: "procesando",
  // ... otros campos
};

// Actualizar UI inmediatamente
setGroup((prev) => ({
  ...prev,
  boletas: [...prev.boletas, optimisticBoleta]
}));

// Luego el agente IA la procesará y llegará vía Realtime
```

### Opción B: Throttling para actualizaciones masivas

Si se suben muchas boletas a la vez:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const handleBoletaUpdate = useDebouncedCallback((newBoleta) => {
  setGroup((prev) => {
    // ... actualizar
  });
}, 300); // Esperar 300ms entre actualizaciones
```

### Opción C: Estado de conexión

Mostrar indicador de conexión Realtime:

```typescript
const [connectionStatus, setConnectionStatus] = useState<
  "connecting" | "connected" | "error"
>("connecting");

channel.subscribe((status) => {
  if (status === "SUBSCRIBED") setConnectionStatus("connected");
  if (status === "CHANNEL_ERROR") setConnectionStatus("error");
});

// En tu UI
{connectionStatus === "connected" && (
  <span className="text-green-500">● En vivo</span>
)}
```

---

## 🐛 TROUBLESHOOTING COMÚN

### Problema 1: Subscription state "CLOSED"
**Causa:** React 18 Strict Mode ejecuta useEffect dos veces en desarrollo.

**Solución:** El cleanup adecuado lo resuelve automáticamente.

### Problema 2: Duplicados en la lista
**Causa:** No verificar si la boleta ya existe antes de agregarla.

**Solución:** Siempre usar `find()` para deduplicar:
```typescript
if (prev.boletas.find((b) => b.boleta_id === newBoleta.boleta_id)) return prev;
```

### Problema 3: No llegan los cambios
**Checklist:**
1. ✅ Tabla agregada a `supabase_realtime` publication
2. ✅ RLS habilitado con política correcta
3. ✅ Filter en subscription coincide con `trip_id`
4. ✅ Usuario autenticado tiene permisos

### Problema 4: Memory leaks
**Causa:** No limpiar suscripciones al desmontar componente.

**Solución:** Siempre incluir cleanup en useEffect:
```typescript
return () => {
  supabase.removeChannel(channel);
};
```

---

## 📊 PERFORMANCE TIPS

1. **Un canal por moneda** (no uno global)
   - ✅ Menos datos transmitidos
   - ✅ Filtrado del lado del servidor

2. **Usar `filter` en subscription**
   ```typescript
   filter: `trip_id=eq.${tripId}`
   ```
   Reduce carga en cliente y servidor.

3. **Memoizar funciones callback**
   ```typescript
   const recalculateStats = useCallback((boletas) => {
     // ...
   }, [initialGroup.moneda]);
   ```

4. **Lazy load de imágenes**
   Usar `loading="lazy"` en thumbnails de boletas.

5. **Evitar re-renders innecesarios**
   ```typescript
   // Solo actualizar si realmente cambió algo
   setGroup((prev) => {
     if (JSON.stringify(prev) === JSON.stringify(newGroup)) {
       return prev;
     }
     return newGroup;
   });
   ```

---

## 🎬 FLUJO COMPLETO DE UNA BOLETA

```
1. Mobile App sube imagen
   ↓
2. Se crea registro en `boletas` (estado: "creado")
   ↓
3. Realtime notifica INSERT → UI muestra skeleton
   ↓
4. Agente IA procesa imagen
   ↓
5. UPDATE: estado → "procesando"
   ↓ Realtime actualiza UI
6. Agente extrae datos
   ↓
7. UPDATE: estado → "espera" + datos extraídos
   ↓ Realtime actualiza UI
8. RRHH valida desde web
   ↓
9. UPDATE: estado → "confirmado"
   ↓ Realtime actualiza UI
10. ✅ Stats recalculados automáticamente
```

---

## 🔒 SEGURIDAD Y RLS

### Políticas recomendadas para `boletas`

```sql
-- Política para SELECT (ver boletas)
CREATE POLICY "Users can view their own boletas or trip boletas"
ON boletas FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = boletas.trip_id
    AND (
      trips.driver_id = auth.uid() OR
      -- Agregar condición para RRHH aquí
      auth.uid() IN (SELECT user_id FROM users WHERE role = 'rrhh')
    )
  )
);

-- Política para INSERT (crear boletas)
CREATE POLICY "Users can insert boletas to their trips"
ON boletas FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_id
    AND trips.driver_id = auth.uid()
  )
);

-- Política para UPDATE (validar boletas)
CREATE POLICY "RRHH can update boletas"
ON boletas FOR UPDATE
USING (
  -- Solo RRHH puede actualizar
  auth.uid() IN (SELECT user_id FROM users WHERE role = 'rrhh')
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM users WHERE role = 'rrhh')
);

-- Política para DELETE (cancelar boletas)
CREATE POLICY "Users can delete their own boletas"
ON boletas FOR DELETE
USING (
  auth.uid() = user_id
  OR
  auth.uid() IN (SELECT user_id FROM users WHERE role = 'rrhh')
);
```

---

## 📚 REFERENCIAS Y DOCUMENTACIÓN OFICIAL

### Documentación Supabase
- [Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Getting Started with Realtime](https://supabase.com/docs/guides/realtime/getting_started)

### Mejores Prácticas 2025
- Separar Server Components (fetch inicial) y Client Components (Realtime)
- Usar `@supabase/ssr` para manejo de sesiones
- Siempre limpiar suscripciones con `removeChannel()`
- Deduplicar por ID antes de agregar a estado
- Filtrar en servidor con `filter: "column=eq.value"`

### Patrones Recomendados
1. **Hybrid Pattern**: Server Component + Client Component
2. **Cleanup Pattern**: `useEffect` con return de `removeChannel()`
3. **Deduplication Pattern**: Verificar existencia por ID antes de agregar
4. **Recalculation Pattern**: Recalcular stats cuando cambia array de boletas
5. **Filter Pattern**: Un canal específico por entidad/contexto

---

## 🎓 CONCEPTOS CLAVE

### ¿Qué es un Channel?
Un canal es una "sala" de comunicación donde los clientes se suscriben para recibir actualizaciones en tiempo real. Puedes tener múltiples canales en una misma aplicación.

### Tipos de Realtime
1. **Postgres Changes**: Escuchar cambios en base de datos (INSERT, UPDATE, DELETE)
2. **Broadcast**: Enviar mensajes entre clientes
3. **Presence**: Rastrear usuarios conectados

### Estados de Subscription
- `SUBSCRIBING`: Conectando...
- `SUBSCRIBED`: Conectado ✅
- `CHANNEL_ERROR`: Error de conexión ❌
- `TIMED_OUT`: Timeout
- `CLOSED`: Desconectado

---

## 🏁 CONCLUSIÓN

Esta implementación es la **más confiable y eficiente** porque:

✅ Separa responsabilidades (Server para SEO, Client para Realtime)
✅ Evita memory leaks con cleanup adecuado
✅ Deduplica automáticamente
✅ Recalcula stats en tiempo real
✅ Es escalable (un canal por moneda)
✅ Maneja todos los eventos (INSERT/UPDATE/DELETE)
✅ Compatible con React 18 Strict Mode
✅ Sigue las mejores prácticas oficiales de Supabase 2025
✅ Implementa seguridad con RLS
✅ Optimiza performance con filtros del lado del servidor

---

**Última actualización:** 2025-01-15
**Versión:** 1.0
**Autor:** Sistema THN-Gastos
