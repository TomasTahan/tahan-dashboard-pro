# API de Procesamiento de Boletas

## Endpoint: `/api/process-receipt`

Este endpoint automatiza el primer flujo de trabajo para procesar boletas de gastos:
1. Crea una nueva boleta en Supabase
2. Envía la imagen a un servicio de IA para análisis
3. Actualiza la boleta con los datos extraídos
4. Cambia el estado a "espera" para aprobación manual

---

## Configuración Requerida

Antes de usar este endpoint, asegúrate de tener las siguientes variables de entorno configuradas en tu archivo `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # IMPORTANTE: Solo para backend
```

---

## Request

### Método
`POST`

### URL
```
http://localhost:3000/api/process-receipt
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "trip_id": "9667a068-5d5b-4cb7-a8b2-7068ed47782a",
  "fotoUrl": "https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/rendiciones/fotos/9667a068-5d5b-4cb7-a8b2-7068ed47782a/1763402746207.jpg"
}
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `trip_id` | string (UUID) | Sí | ID del viaje al que pertenece la boleta |
| `fotoUrl` | string (URL) | Sí | URL de la imagen de la boleta almacenada en Supabase Storage |

---

## Responses

### Success (201 Created)

```json
{
  "success": true,
  "message": "Receipt processed successfully",
  "data": {
    "boleta_id": 123,
    "trip_id": "9667a068-5d5b-4cb7-a8b2-7068ed47782a",
    "estado": "espera",
    "extracted_data": {
      "referencia": "001-014-0004807",
      "razon_social": "GAMAX S.R.L.",
      "date": "21/06/2025 00:49:00",
      "total": 600000,
      "moneda": "PYG",
      "descripcion": "DIESEL PORA",
      "identificador_fiscal": "80046174-6"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Campos Faltantes
```json
{
  "error": "Missing required fields",
  "message": "trip_id and fotoUrl are required"
}
```

#### 404 Not Found - Viaje No Existe
```json
{
  "error": "Trip not found",
  "message": "Trip with id 9667a068-5d5b-4cb7-a8b2-7068ed47782a does not exist"
}
```

#### 500 Internal Server Error - Error en Análisis de IA
```json
{
  "error": "AI analysis failed",
  "message": "AI service returned 500: Internal Server Error",
  "boleta_id": 123,
  "status": "partial_success"
}
```

**Nota:** Si el análisis de IA falla, la boleta se crea pero queda en estado "espera" con un mensaje de error en el campo `metadata` para revisión manual.

---

## Flujo de Estados de la Boleta

```
creado → procesando → espera → confirmado
                    ↓
                 cancelado
```

1. **creado**: Boleta recién creada, aún no procesada
2. **procesando**: El servicio de IA está analizando la imagen
3. **espera**: Datos extraídos, esperando confirmación del usuario
4. **confirmado**: Usuario aprobó los datos, lista para enviar a Odoo
5. **cancelado**: Boleta rechazada o cancelada

---

## Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:3000/api/process-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": "9667a068-5d5b-4cb7-a8b2-7068ed47782a",
    "fotoUrl": "https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/rendiciones/fotos/9667a068-5d5b-4cb7-a8b2-7068ed47782a/1763402746207.jpg"
  }'
```

## Ejemplo de Uso con JavaScript/TypeScript

```typescript
async function processReceipt(tripId: string, imageUrl: string) {
  try {
    const response = await fetch('/api/process-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip_id: tripId,
        fotoUrl: imageUrl,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to process receipt');
    }

    console.log('Receipt processed:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
}

// Uso
const tripId = '9667a068-5d5b-4cb7-a8b2-7068ed47782a';
const imageUrl = 'https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/rendiciones/fotos/...';

processReceipt(tripId, imageUrl)
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

---

## Validaciones

El endpoint realiza las siguientes validaciones:

1. ✅ **trip_id y fotoUrl son requeridos**
   - Si falta alguno, retorna error 400

2. ✅ **El viaje debe existir**
   - Busca el trip_id en la tabla `trips`
   - Si no existe, retorna error 404

3. ✅ **Asignación automática al conductor**
   - La boleta se asigna automáticamente al `driver_id` del viaje

4. ✅ **Manejo de errores de IA**
   - Si el servicio de IA falla, la boleta se guarda igualmente
   - El error se registra en el campo `metadata`
   - El estado se mantiene en "espera" para revisión manual

---

## Campos de la Tabla `boletas`

Después del procesamiento, la boleta tendrá los siguientes campos poblados:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `boleta_id` | bigint | ID único de la boleta (auto-generado) | 123 |
| `trip_id` | uuid | ID del viaje | 9667a068-5d5b-4cb7-a8b2-7068ed47782a |
| `user_id` | uuid | ID del conductor (del viaje) | abc123... |
| `url` | text | URL de la imagen | https://... |
| `estado` | enum | Estado actual | "espera" |
| `referencia` | text | Número de factura/boleta | "001-014-0004807" |
| `razon_social` | text | Nombre del comercio | "GAMAX S.R.L." |
| `date` | text | Fecha de la transacción | "21/06/2025 00:49:00" |
| `total` | double | Monto total | 600000 |
| `moneda` | text | Código de moneda | "PYG" |
| `descripcion` | text | Descripción del gasto | "DIESEL PORA" |
| `identificador_fiscal` | text | RUT/CUIT/RUC del comercio | "80046174-6" |
| `created_at` | timestamptz | Fecha de creación | 2025-01-15T... |
| `updated_at` | timestamptz | Última actualización | 2025-01-15T... |

---

## Próximos Pasos

Una vez que la boleta está en estado "espera", el flujo continúa así:

1. **Usuario revisa y confirma** los datos extraídos
2. **Se cambia el estado a "confirmado"**
3. **Segundo workflow (próximo a implementar):**
   - Buscar/validar empleado en Odoo
   - Buscar/validar categoría de gasto
   - Crear gasto en Odoo
   - Asociar gasto de Odoo con boleta en Supabase
   - Crear reporte de gastos (opcional)

---

## Troubleshooting

### Error: "Trip not found"
- Verifica que el `trip_id` existe en la tabla `trips`
- Asegúrate de usar el UUID correcto

### Error: "AI service returned 500"
- Verifica que el servicio de IA esté disponible en: https://tahan-test.0cguqx.easypanel.host/analyze-receipt
- Verifica que la imagen sea accesible públicamente
- La boleta se creará de todas formas, pero sin datos extraídos

### Error: "Failed to create boleta"
- Verifica la conexión a Supabase
- Asegúrate de tener configurado `SUPABASE_SERVICE_ROLE_KEY`
- Verifica que la tabla `boletas` existe y tiene los campos correctos

---

## Seguridad

- ✅ El endpoint usa **Service Role Key** para bypasear RLS
- ✅ Valida que el viaje existe antes de crear la boleta
- ✅ Asigna automáticamente la boleta al conductor del viaje
- ⚠️ **IMPORTANTE**: Nunca expongas el `SUPABASE_SERVICE_ROLE_KEY` en el cliente

---

## Logs y Debugging

Para debugging, puedes revisar:
1. Los logs del servidor Next.js
2. El campo `metadata` de la boleta en caso de errores
3. El campo `estado` para ver en qué paso del flujo está

```sql
-- Ver boletas con errores
SELECT boleta_id, estado, metadata, created_at
FROM boletas
WHERE metadata->>'error' IS NOT NULL;

-- Ver boletas en espera
SELECT boleta_id, trip_id, total, moneda, estado
FROM boletas
WHERE estado = 'espera';
```
