# Migración a Temporal - Guía Completa

## 📊 Resumen de cambios

Se han migrado dos endpoints críticos a Temporal workflows para mejorar la resiliencia, visibilidad y mantenibilidad:

1. **`/api/process-receipt`** → **`/api/process-receipt-temporal`**
2. **`/api/create-expense`** → **`/api/create-expense-temporal`**

## 🏗 Arquitectura

### Antes (Síncrono)
```
Cliente → API Route → Lógica completa (60-120s) → Respuesta
```

**Problemas:**
- ❌ Timeouts en procesos largos
- ❌ Sin reintentos automáticos
- ❌ Poca visibilidad de errores
- ❌ No recuperable ante fallos

### Después (Temporal)
```
Cliente → API Route → Temporal (iniciar workflow) → Respuesta inmediata (~100ms)
                           ↓
                      Worker ejecuta → Actividades → Resultado
```

**Beneficios:**
- ✅ Respuesta inmediata con workflow_id
- ✅ Reintentos automáticos configurables
- ✅ Dashboard de Temporal para monitoreo
- ✅ Workflows durables (sobreviven a crashes)
- ✅ Historial completo de ejecuciones

## 📁 Estructura creada

```
/
├── app/
│   └── api/
│       ├── process-receipt-temporal/    # Nuevo endpoint async
│       │   └── route.ts
│       ├── create-expense-temporal/     # Nuevo endpoint async
│       │   └── route.ts
│       └── workflow-status/             # Consultar estado
│           └── [workflowId]/route.ts
│
├── lib/
│   └── temporal-client.ts               # Cliente Temporal (singleton)
│
├── temporal/                            # Todo el código del worker
│   ├── workflows/
│   │   ├── process-receipt.workflow.ts
│   │   └── create-expense.workflow.ts
│   ├── activities/
│   │   ├── receipt.activities.ts
│   │   └── expense.activities.ts
│   ├── worker.ts                        # Entry point del worker
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── .vercelignore                        # Ignora /temporal en Vercel
```

## 🔄 Cambios en los endpoints

### 1. **POST /api/process-receipt-temporal**

**Antes (síncrono):**
```json
{
  "trip_id": "123",
  "fotoUrl": "https://...",
  "audioUrl": "https://..."
}
```
⏳ Espera 60-120s → Devuelve resultado completo

**Después (async):**
```json
{
  "trip_id": "123",
  "fotoUrl": "https://...",
  "audioUrl": "https://..."
}
```
⚡ Respuesta inmediata (100ms):
```json
{
  "success": true,
  "message": "Receipt processing started",
  "workflow": {
    "workflow_id": "process-receipt-123-1234567890",
    "run_id": "abc-def-ghi",
    "status": "running"
  },
  "status_url": "/api/workflow-status/process-receipt-123-1234567890"
}
```

### 2. **POST /api/create-expense-temporal**

**Antes (síncrono):**
```json
{
  "boleta_id": 456,
  "product_id": 789
}
```
⏳ Espera 30-60s → Devuelve resultado completo

**Después (async):**
```json
{
  "boleta_id": 456,
  "product_id": 789
}
```
⚡ Respuesta inmediata:
```json
{
  "success": true,
  "message": "Expense creation started",
  "workflow": {
    "workflow_id": "create-expense-456-1234567890",
    "run_id": "xyz-123-456",
    "status": "running"
  },
  "status_url": "/api/workflow-status/create-expense-456-1234567890"
}
```

### 3. **GET /api/workflow-status/[workflowId]** (Nuevo)

Consultar el estado de un workflow:

```bash
GET /api/workflow-status/process-receipt-123-1234567890
```

Respuesta:
```json
{
  "workflow_id": "process-receipt-123-1234567890",
  "status": "completed",
  "workflow_type": "processReceiptWorkflow",
  "start_time": "2025-11-18T10:00:00Z",
  "close_time": "2025-11-18T10:01:30Z",
  "execution_time_ms": 90000,
  "result": {
    "success": true,
    "boleta_id": 123,
    "estado": "espera",
    "extracted_data": { ... }
  },
  "error": null
}
```

Estados posibles:
- `"running"` - En ejecución
- `"completed"` - Completado exitosamente
- `"failed"` - Falló (contiene error)
- `"terminated"` - Terminado manualmente
- `"cancelled"` - Cancelado

## 🚀 Deployment

### Next.js (Vercel)
1. Los endpoints nuevos se deployarán automáticamente
2. `.vercelignore` excluye `/temporal` del build
3. Configurar variable: `TEMPORAL_ADDRESS=tahan-temporal.0cguqx.easypanel.host:7233`

### Worker (VPS)
```bash
# En el VPS
cd /path/to/tahan-dashboard-pro/temporal
npm install
npm run build
npm start

# O con systemd (ver temporal/README.md)
```

## 🔀 Migración gradual (recomendado)

### Opción 1: Endpoints paralelos
- Mantener `/api/process-receipt` (actual)
- Crear `/api/process-receipt-temporal` (nuevo)
- Migrar clientes gradualmente
- Deprecar endpoint viejo después

### Opción 2: Feature flag
```typescript
// En el endpoint actual
const USE_TEMPORAL = process.env.USE_TEMPORAL === 'true';

if (USE_TEMPORAL) {
  // Iniciar workflow
} else {
  // Lógica actual
}
```

### Opción 3: Reemplazo directo
- Renombrar `/api/process-receipt/route.ts` → `route.old.ts`
- Renombrar `/api/process-receipt-temporal` → `/api/process-receipt`
- Actualizar clientes para polling de estado

## 📱 Actualizar clientes (frontend/mobile)

### Antes:
```typescript
const response = await fetch('/api/process-receipt', {
  method: 'POST',
  body: JSON.stringify({ trip_id, fotoUrl })
});

const result = await response.json();
// result contiene datos finales
```

### Después (Polling):
```typescript
// 1. Iniciar workflow
const startResponse = await fetch('/api/process-receipt-temporal', {
  method: 'POST',
  body: JSON.stringify({ trip_id, fotoUrl })
});

const { workflow } = await startResponse.json();

// 2. Polling para obtener resultado
const result = await pollWorkflowStatus(workflow.workflow_id);

async function pollWorkflowStatus(workflowId: string) {
  while (true) {
    const statusResponse = await fetch(`/api/workflow-status/${workflowId}`);
    const status = await statusResponse.json();

    if (status.status === 'completed') {
      return status.result;
    }

    if (status.status === 'failed') {
      throw new Error(status.error.message);
    }

    // Esperar 2 segundos antes de volver a consultar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Después (Server-Sent Events - mejor):
```typescript
// API: /api/workflow-status/[workflowId]/stream
const eventSource = new EventSource(`/api/workflow-status/${workflowId}/stream`);

eventSource.onmessage = (event) => {
  const status = JSON.parse(event.data);

  if (status.status === 'completed') {
    console.log('Resultado:', status.result);
    eventSource.close();
  }
};
```

## 🎯 Próximos pasos

1. ✅ **Setup worker en VPS** (ver `temporal/README.md`)
2. ✅ **Configurar variables de entorno**
3. ✅ **Probar workflows** en dashboard de Temporal
4. ⏳ **Actualizar clientes** (frontend/mobile) para usar endpoints temporales
5. ⏳ **Deprecar endpoints viejos** después de migración completa

## 🔍 Monitoreo

Dashboard de Temporal:
```
https://tahan-temporal-web.0cguqx.easypanel.host/namespaces/default/workflows
```

Aquí podrás:
- Ver todos los workflows ejecutándose
- Historial completo de ejecuciones
- Detalles de cada actividad
- Logs y errores
- Reintentar workflows fallidos manualmente

## ❓ FAQ

### ¿Puedo seguir usando los endpoints viejos?
Sí, los endpoints actuales (`/api/process-receipt` y `/api/create-expense`) no se han modificado. Los nuevos endpoints tienen el sufijo `-temporal`.

### ¿Qué pasa si el worker se cae?
Los workflows quedarán en espera. Al reiniciar el worker, se retomarán automáticamente desde donde se quedaron.

### ¿Cuánto tiempo se guardan los workflows?
Por defecto, Temporal guarda el historial indefinidamente. Puedes configurar retention policies si quieres.

### ¿Cómo cancelo un workflow?
Desde el dashboard de Temporal o usando el cliente:
```typescript
const handle = client.workflow.getHandle(workflowId);
await handle.cancel();
```

## 📚 Recursos

- [Temporal Docs](https://docs.temporal.io/)
- [Temporal TypeScript SDK](https://typescript.temporal.io/)
- [Dashboard Tahan Temporal](https://tahan-temporal-web.0cguqx.easypanel.host/)
