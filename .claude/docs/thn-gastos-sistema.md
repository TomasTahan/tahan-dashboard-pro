# Sistema de Gestión de Gastos de Viaje (THN-Gastos)

## Descripción General

Sistema para automatizar el proceso de rendición de gastos de choferes durante viajes. Reemplaza el proceso manual de entregar boletas físicas a RRHH por un sistema digital con análisis de IA.

### Proceso Actual (Manual)

1. Chofer inicia viaje → RRHH le da dinero en efectivo
2. Chofer gasta durante el viaje → guarda boletas físicas
3. Chofer regresa → entrega todas las boletas a RRHH
4. RRHH registra manualmente cada boleta una por una
5. RRHH calcula si el chofer debe dinero o se le debe

### Proceso Objetivo (Automatizado)

1. Chofer inicia viaje → RRHH crea viaje en sistema con monto adelantado
2. Chofer gasta → saca foto a boleta desde app móvil
3. Agente IA analiza foto → extrae datos automáticamente
4. RRHH solo valida/edita datos extraídos → aprueba
5. Sistema calcula automáticamente balance (debe/se le debe)
6. Datos aprobados se sincronizan con Odoo (futuro)

### Fase Actual: Versión Manual (MVP)

Mientras los choferes no tienen la app móvil, RRHH hará todo el proceso:

- RRHH crea el viaje con monto adelantado
- RRHH saca fotos a las boletas
- Agente IA analiza las fotos y extrae moneda automáticamente
- RRHH valida los datos extraídos
- Sistema agrupa gastos por moneda y calcula balances automáticamente

---

## Modelo de Datos

### Jerarquía de Entidades

```
VIAJE (Trip)
  └── BOLETAS (múltiples gastos, agrupadas por moneda en queries)
```

**NOTA:** No hay tabla de "rendiciones". Los gastos se agrupan dinámicamente por moneda usando queries.

### 1. Tabla: `trips`

**Descripción:** Representa un viaje de un conductor. Contiene información básica del viaje y el monto adelantado.

**Campos:**

- `id` (uuid, PK): ID único del viaje
- `trip_number` (text, unique): Número interno del viaje que asigna RRHH
- `driver_id` (uuid, FK → auth.users): ID del conductor
- `driver` (text): Nombre del conductor (redundante, considerar deprecar)
- `monto_adelantado` (numeric): Dinero adelantado al conductor
- `moneda_adelantado` (text): Moneda del adelanto (CLP, ARS, BRL, PEN, PYG)
- `date` (timestamptz): Fecha de creación del viaje
- `start_date` (timestamptz): Fecha de inicio del viaje
- `end_date` (timestamptz): Fecha de finalización del viaje
- `destination` (text): Destino del viaje
- `status` (trip_status enum): Estado del viaje
- `created_at` (timestamptz): Fecha de creación del registro
- `updated_at` (timestamptz): Fecha de última actualización

**Estados disponibles (`trip_status` enum):**

- `planned`: Nuevo/Planeado
- `confirmed`: Confirmado
- `pending_approval`: Pendiente de aprobación
- `in_progress`: En curso
- `on_hold`: En espera
- `completed`: Finalizado
- `cancelled`: Cancelado

**Estados a usar en MVP:**

- `planned` → Nuevo (viaje creado, cargando boletas)
- `in_progress` → En curso (viaje activo)
- `completed` → Finalizado (viaje terminado, todas las boletas procesadas)

---

### 2. Tabla: `boletas` (EXISTENTE - AJUSTAR)

**Descripción:** Boleta/recibo de gasto. Almacena los datos extraídos por el agente IA de las fotos de boletas.

**Campos:**

- `boleta_id` (bigint, PK): ID único de la boleta
- `trip_id` (uuid, FK → trips.id): Viaje al que pertenece esta boleta
- `user_id` (uuid, FK → auth.users): Usuario que creó la boleta (para RLS)
- `url` (text): URL de la imagen en Supabase Storage
- `referencia` (text, nullable): Identificador único del recibo
- `razon_social` (text, nullable): Razón social del emisor
- `date` (text, nullable): Fecha del recibo (formato: dd/MM/yyyy HH:mm:ss)
- `total` (float): Monto total del recibo
- `moneda` (text, nullable): Moneda (CLP, ARS, BRL, PEN, PYG) - **Extraída por agente IA**
- `descripcion` (text, nullable): Descripción del gasto
- `identificador_fiscal` (text, nullable): RUT/CUIT/CNPJ/RUC del emisor
- `estado` (boleta_estado enum): Estado de la boleta
- `validated_at` (timestamptz, nullable): Fecha de validación/aprobación
- `validated_by` (uuid, FK → auth.users, nullable): Usuario que validó la boleta
- `created_at` (timestamptz): Fecha de creación
- `updated_at` (timestamptz): Fecha de última actualización

**Estados actuales (`boleta_estado` enum):**

- `creado`: Boleta creada, esperando subir imagen
- `procesando`: Agente IA está analizando la imagen
- `espera`: Esperando validación de RRHH
- `confirmado`: Boleta validada y aprobada
- `cancelado`: Boleta rechazada/cancelada

**Datos extraídos por el agente IA:**

```python
referencia: Optional[str]  # ID único del recibo si disponible
razon_social: Optional[str]  # Razón social del emisor
date: str  # Formato: dd/MM/yyyy HH:mm:ss
total: float  # Monto total
moneda: Optional[str]  # CLP, ARS, BRL, PEN, PYG según país
descripcion: Optional[str]  # Descripción del gasto
identificador_fiscal: Optional[str]  # CUIT/RUT/CNPJ/RUC/etc
```

**Índices:**

- `trip_id` (para queries de boletas por viaje)
- `moneda` (para agrupar gastos por moneda)
- `estado` (para filtros por estado)
- `user_id` (ya existe para RLS)

---

### 3. Tabla: `position_levels` (EXISTENTE - YA CREADO)

**Descripción:** Niveles jerárquicos de posiciones en la empresa.

**Registro CREADO:**

- `nombre`: "Chofer"
- `rank`: 10

---

## Flujo de Trabajo Detallado

### A. Creación de Viaje (RRHH)

**Ruta:** `/thn-gastos` → Modal "Crear Viaje"

**Datos solicitados:**

1. **Número de viaje** (text, requerido): Número interno asignado por RRHH
2. **Chofer** (select, requerido): Dropdown con choferes (filtrar users con position_level.rank = 10)
3. **Monto adelantado** (numeric, requerido): Dinero entregado al conductor
4. **Moneda** (select, requerido): Moneda del adelanto (CLP, ARS, BRL, PEN, PYG)

**Proceso:**

1. RRHH llena formulario y crea viaje
2. Sistema crea registro en `trips` con estado `planned`
3. Redirección a `/thn-gastos/[tripId]`

---

### B. Agregar Boleta al Viaje (RRHH)

**Ruta:** `/thn-gastos/[tripId]` → Botón "Agregar Boleta"

**Proceso:**

1. RRHH hace clic en "Agregar Boleta"
2. Se abre modal/drawer con opción de subir imagen
3. RRHH selecciona/toma foto de la boleta
4. Sistema sube imagen a Supabase Storage
5. Sistema crea registro en `boletas` con:
   - `estado`: `creado`
   - `trip_id`: ID del viaje
   - `user_id`: ID del usuario de RRHH
   - `url`: URL de la imagen en Storage
6. Sistema dispara el agente IA (webhook/función)
7. Agente cambia estado a `procesando`
8. Agente analiza imagen y extrae datos (incluyendo moneda)
9. Agente actualiza boleta con datos extraídos y cambia estado a `espera`
10. En la UI (con realtime), la boleta aparece en estado "Esperando validación"

---

### C. Validación de Boleta (RRHH)

**Ruta:** `/thn-gastos/[tripId]` → Click en boleta en estado `espera`

**Proceso:**

1. RRHH hace clic en boleta pendiente
2. Se abre modal/drawer mostrando:
   - Imagen de la boleta (preview)
   - Datos extraídos por el agente (editables)
   - Botones: "Aprobar" / "Editar y Aprobar" / "Rechazar"
3. RRHH revisa datos:
   - Si están correctos → "Aprobar"
   - Si tienen errores → edita campos y luego "Aprobar"
   - Si la boleta no es válida → "Rechazar"
4. Al aprobar:
   - Estado cambia a `confirmado`
   - Se guarda `validated_at` y `validated_by`
5. Al rechazar:
   - Estado cambia a `cancelado`
   - Boleta no se cuenta en cálculos

---

### D. Visualización de Gastos Agrupados por Moneda

**Ruta:** `/thn-gastos/[tripId]`

**Vista principal muestra:**

1. **Información del viaje:**

   - Número de viaje
   - Conductor
   - Monto adelantado y moneda
   - Estado del viaje

2. **Gastos agrupados por moneda (una sección por moneda):**

   - Se agrupan dinámicamente todas las boletas del viaje por su campo `moneda`
   - Para cada moneda encontrada en las boletas:
     - Nombre de la moneda
     - Cantidad de boletas (total, confirmadas, pendientes)
     - Monto total gastado (suma de boletas confirmadas)
     - **Balance solo si la moneda coincide con `moneda_adelantado`:**
       - Mostrar: Adelantado vs Gastado
       - Calcular: Debe devolver / Se le debe
     - Lista de boletas de esa moneda:
       - Thumbnail de imagen
       - Fecha
       - Descripción
       - Monto
       - Estado (badge con color)

3. **Botón "Agregar Boleta"** para cargar nuevas boletas al viaje

4. **Ejemplo visual:**

   ```
   VIAJE #1234 - Juan Pérez
   Adelantado: $500.000 CLP

   📊 GASTOS POR MONEDA:

   💵 CLP (Chile)
   ├─ 15 boletas confirmadas
   ├─ 2 boletas pendientes
   ├─ Total gastado: $450.000
   └─ ✅ Debe devolver: $50.000

   💵 ARS (Argentina)
   ├─ 8 boletas confirmadas
   ├─ 1 boleta pendiente
   └─ Total gastado: $120.000 (sin comparar con adelanto)

   💵 BRL (Brasil)
   ├─ 3 boletas confirmadas
   └─ Total gastado: R$500 (sin comparar con adelanto)
   ```

---

### E. Flujo con App Móvil (Futuro)

**Proceso con QR:**

1. RRHH crea viaje en web
2. En la vista del viaje, hay un botón "Generar QR"
3. Se genera QR con el `trip_id` codificado
4. Chofer escanea QR desde app móvil
5. App móvil se vincula al viaje
6. Chofer saca fotos de boletas desde la app
7. App sube fotos directamente vinculadas al trip_id del QR
8. Agente IA procesa automáticamente (extrae moneda de la boleta)
9. En la web (con realtime), RRHH ve nuevas boletas aparecer
10. RRHH valida boletas desde la web
11. Sistema agrupa automáticamente por moneda

---

## Estructura de Archivos

### Rutas Next.js

```
app/(main)/thn-gastos/
├── page.tsx                      # Lista de todos los viajes
├── [tripId]/
│   └── page.tsx                  # Detalle de viaje con rendiciones y boletas
├── create-trip-modal.tsx         # Modal para crear nuevo viaje
├── trip-filters.tsx              # Filtros de la lista de viajes
├── trip-status-badge.tsx         # Badge de estado de viaje
├── trips-list-content.tsx        # Contenido de la lista
├── trips-list-wrapper.tsx        # Wrapper de la lista
└── trips-list.tsx                # Componente principal de lista
```

### Componentes Nuevos a Crear

```
app/(main)/thn-gastos/[tripId]/
├── currency-section.tsx          # Sección de gastos agrupados por moneda
├── boleta-item.tsx               # Item de boleta en la lista
├── boleta-validation-modal.tsx   # Modal para validar/editar boleta
├── add-boleta-modal.tsx          # Modal para agregar boleta (subir foto)
└── trip-header.tsx               # Header con info del viaje
```

---

## Stack Tecnológico

- **Frontend:** Next.js 15 (App Router)
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage (imágenes de boletas)
- **Realtime:** Supabase Realtime (para ver boletas nuevas en vivo)
- **Agente IA:** VPS externo (workflow ya armado)
- **Integración futura:** Odoo (sincronización de datos aprobados)

---

## Consideraciones de Seguridad (RLS)

### Políticas de acceso:

- **trips:** Solo usuarios con acceso a la pantalla `/thn-gastos` pueden ver/crear viajes
- **boletas:** RLS ya implementado por `user_id`

### Roles:

- **RRHH:** Acceso completo a crear/editar/validar todo
- **Choferes (futuro):** Solo pueden crear boletas vinculadas a sus propios viajes (validando que `trips.driver_id` = `auth.uid()`)

---

## Funcionalidades Futuras (Post-MVP)

1. **App Móvil para Choferes:**

   - Escanear QR de viaje
   - Tomar fotos de boletas
   - Ver estado de boletas (aprobadas/pendientes/rechazadas)
   - Ver balance de rendiciones

2. **Integración con Odoo:**

   - Sincronizar boletas aprobadas
   - Crear asientos contables automáticos
   - Generar comprobantes de pago

3. **Reportes y Analytics:**

   - Dashboard de gastos por chofer
   - Reportes por período
   - Análisis de gastos por categoría/destino

4. **Notificaciones:**

   - Push notifications a choferes cuando boleta es aprobada/rechazada
   - Alertas a RRHH cuando hay boletas pendientes de validación

5. **Mejoras al Agente IA:**
   - Categorización automática de gastos
   - Detección de duplicados
   - Validación de montos sospechosos

---

## Próximos Pasos (Plan de Implementación)

1. ✅ Crear documentación del sistema
2. ✅ Crear position_level "Chofer" con rank 10
3. ✅ Eliminar tabla `rendiciones` de Supabase
4. ✅ Ajustar tabla `trips` (agregar `monto_adelantado` y `moneda_adelantado`)
5. ✅ Ajustar tabla `boletas` (agregar `trip_id`, `validated_at`, `validated_by`, `updated_at`)
6. ⏳ Implementar modal de creación de viaje (simplificado)
7. ⏳ Implementar página de detalle de viaje `/thn-gastos/[tripId]`
8. ⏳ Implementar agrupación dinámica por moneda (queries)
9. ⏳ Implementar carga de boletas (upload + trigger agente)
10. ⏳ Implementar validación de boletas
11. ⏳ Implementar cálculos de balance en tiempo real
12. ⏳ Testing y validación con RRHH

---

## Notas Técnicas

### Query para Agrupar Gastos por Moneda

```sql
-- Query para obtener gastos agrupados por moneda de un viaje
SELECT
  moneda,
  COUNT(*) as total_boletas,
  COUNT(*) FILTER (WHERE estado = 'confirmado') as boletas_confirmadas,
  COUNT(*) FILTER (WHERE estado = 'espera') as boletas_pendientes,
  COUNT(*) FILTER (WHERE estado = 'cancelado') as boletas_canceladas,
  COALESCE(SUM(total) FILTER (WHERE estado = 'confirmado'), 0) as monto_gastado
FROM boletas
WHERE trip_id = $1
GROUP BY moneda
ORDER BY moneda;
```

### Cálculo de Balance

```typescript
// Obtener info del viaje
const trip = await supabase
  .from("trips")
  .select("monto_adelantado, moneda_adelantado")
  .eq("id", tripId)
  .single();

// Obtener gastos agrupados por moneda
const gastosPorMoneda = await supabase
  .from("boletas")
  .select("moneda, total, estado")
  .eq("trip_id", tripId);

// Agrupar y calcular balance
const grupos = gastosPorMoneda.reduce((acc, boleta) => {
  if (!acc[boleta.moneda]) {
    acc[boleta.moneda] = {
      totalGastado: 0,
      confirmadas: 0,
      pendientes: 0,
    };
  }

  if (boleta.estado === "confirmado") {
    acc[boleta.moneda].totalGastado += boleta.total;
    acc[boleta.moneda].confirmadas++;
  } else if (boleta.estado === "espera") {
    acc[boleta.moneda].pendientes++;
  }

  return acc;
}, {});

// Calcular balance solo para moneda adelantada
if (trip.moneda_adelantado && grupos[trip.moneda_adelantado]) {
  const balance =
    trip.monto_adelantado - grupos[trip.moneda_adelantado].totalGastado;
  // balance > 0: Debe devolver
  // balance < 0: Se le debe
}
```

### Realtime Subscriptions

Suscribirse a cambios en `boletas` para actualizar la UI en tiempo real cuando el agente procesa una imagen:

```typescript
supabase
  .channel("boletas-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "boletas",
      filter: `trip_id=eq.${tripId}`,
    },
    (payload) => {
      // Actualizar UI con nueva boleta o cambio de estado
      // Re-agrupar por moneda
    }
  )
  .subscribe();
```

---

**Última actualización:** 2025-01-15
**Versión:** 1.0
**Autor:** Sistema THN-Gastos
