# Guía de Pruebas - Temporal Workflows

Esta guía te ayudará a probar la integración de Temporal con tu aplicación Next.js.

## ✅ Pre-requisitos

1. **Worker de Temporal ejecutándose** (ya lo tienes corriendo en tu VPS)
   - Deberías ver en los logs: `👷 Worker iniciado y esperando tareas en 'tahan-gastos-queue'...`
   - Estado: `Worker state changed { state: 'RUNNING' }`

2. **Next.js en desarrollo**
   ```bash
   npm run dev
   ```

3. **Variable de entorno configurada**
   ```bash
   # En tu .env.local
   TEMPORAL_ADDRESS=tu-vps-ip:7233
   ```

## 🧪 Métodos de Prueba

### Opción 1: Script Node.js (Recomendado para desarrollo)

```bash
# Probar procesamiento de boletas
node test-temporal.js process-receipt

# Probar creación de gastos en Odoo
node test-temporal.js create-expense
```

### Opción 2: cURL

#### Probar `/api/process-receipt`
```bash
curl -X POST http://localhost:3000/api/process-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "test-trip-123",
    "fotoUrl": "https://example.com/receipt.jpg",
    "conductorDescription": "Compra de combustible"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Análisis iniciado en segundo plano",
  "workflowId": "receipt-test-trip-123-1234567890"
}
```

#### Probar `/api/create-expense`
```bash
curl -X POST http://localhost:3000/api/create-expense \
  -H "Content-Type: application/json" \
  -d '{
    "boleta_id": 1,
    "product_id": 123
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Creación de gasto iniciada en Odoo",
  "workflowId": "expense-1-1234567890"
}
```

### Opción 3: Postman/Insomnia

Crea dos requests POST:

1. **Process Receipt**
   - URL: `http://localhost:3000/api/process-receipt`
   - Body (JSON):
   ```json
   {
     "trip_id": "test-trip-123",
     "fotoUrl": "https://example.com/receipt.jpg",
     "conductorDescription": "Compra de combustible",
     "audioUrl": "https://example.com/audio.mp3"
   }
   ```

2. **Create Expense**
   - URL: `http://localhost:3000/api/create-expense`
   - Body (JSON):
   ```json
   {
     "boleta_id": 1,
     "product_id": 123
   }
   ```

### Opción 4: Desde tu aplicación Next.js

Si tienes una UI, simplemente usa los flujos normales de tu aplicación.

## 📊 Monitorear los Workflows

### 1. Logs del Worker (VPS)
Deberías ver actividad en los logs de tu worker cuando los workflows se ejecuten:

```
[INFO] Workflow started { workflowId: 'receipt-test-trip-123-...' }
[INFO] Activity started { activityType: 'getTripInfo' }
[INFO] Activity completed { activityType: 'getTripInfo' }
...
```

### 2. Temporal Web UI
Si tienes la UI de Temporal disponible:
- URL: `http://tu-vps-ip:8233`
- Navega a "Workflows" para ver los workflows en ejecución
- Haz click en un workflow para ver su historia completa

### 3. Logs de Next.js
Revisa la consola de Next.js para ver si hay errores al iniciar workflows.

## 🔍 Qué Verificar

### ✅ Workflow exitoso
- [ ] El endpoint devuelve `success: true`
- [ ] Se recibe un `workflowId`
- [ ] El worker muestra logs de ejecución
- [ ] No hay errores en los logs del worker
- [ ] Las activities se ejecutan en orden

### ❌ Posibles Errores

#### Error: "Cannot connect to Temporal"
```
Error: Failed to connect to temporal server
```
**Solución:** Verifica que `TEMPORAL_ADDRESS` esté correctamente configurado.

#### Error: "Workflow not found"
```
Error: No activities registered for task queue
```
**Solución:** Asegúrate de que el worker esté corriendo y registrado en el mismo taskQueue (`tahan-gastos-queue`).

#### Error de timeout
```
Error: Activity timeout
```
**Solución:** Las activities tienen timeouts configurados. Revisa si alguna activity externa (API, DB) está tardando mucho.

## 🎯 Próximos Pasos

Una vez que las pruebas básicas funcionen:

1. **Pruebas con datos reales**
   - Usa un trip_id real de tu base de datos
   - Usa una URL de imagen real
   - Verifica que las activities accedan correctamente a tu DB

2. **Probar manejo de errores**
   - Envía datos inválidos
   - Verifica que los retries funcionen correctamente
   - Prueba con servicios externos caídos (Odoo, AI API)

3. **Monitoreo en producción**
   - Configura alertas para workflows fallidos
   - Revisa métricas de duración de workflows
   - Monitorea el uso de recursos del worker

## 📝 Notas Importantes

- Los workflows son **asíncronos**: El endpoint devuelve inmediatamente, el procesamiento real sucede en el worker
- El `workflowId` es único y puede usarse para consultar el estado del workflow
- Los workflows tienen **retry automático** configurado en las activities
- El timeout máximo de los endpoints es 10 segundos (suficiente solo para iniciar el workflow)

## 🐛 Debug

Si algo no funciona, revisa en orden:

1. ¿El worker está corriendo? → Logs del VPS
2. ¿Next.js puede conectarse al servidor Temporal? → Logs de Next.js
3. ¿Las activities tienen acceso a DB/APIs? → Logs del worker
4. ¿Los datos de entrada son válidos? → Validaciones en los endpoints
