# Odoo 17 + n8n - Ejemplos de Integración para Automatización de Gastos

## Configuración Inicial en n8n

### Webhook de n8n detectado:
```
https://tahan-n8n.0cguqx.easypanel.host/webhook-test/12786663-b387-4b43-b9e7-d6e55ceeb98d
```

---

## Workflow 1: Procesar Boleta Completa (IA → Odoo)

### Descripción
Recibe datos de una boleta analizada por IA y crea el gasto en Odoo automáticamente.

### Nodos en n8n:

#### 1. Webhook (Trigger)
**Tipo:** Webhook
**Método:** POST
**Path:** `/webhook/process-expense`

**Payload esperado:**
```json
{
  "boleta_id": "uuid-de-la-boleta",
  "conductor": "Alberto Angel Lujan",
  "categoria": "Peaje",
  "fecha": "2025-11-17",
  "monto": 15000,
  "moneda": "CLP",
  "empresa": "TURKEN",
  "descripcion": "Peaje Ruta 5",
  "imagen_url": "https://..."
}
```

#### 2. Supabase: Buscar Empleado
**Tipo:** Supabase
**Operación:** Select rows
**Tabla:** `odoo_employees`
**Filtro:** `name.ilike.%{{ $json.conductor }}%`

**Output esperado:**
```json
{
  "odoo_id": 970,
  "name": "Alberto Angel Lujan",
  "company_id": 3,
  "company_name": "EXPORTADORA E IMPORTADORA TURKEN S A"
}
```

#### 3. Supabase: Buscar Categoría
**Tipo:** Supabase
**Operación:** Select rows
**Tabla:** `odoo_expense_categories`
**Filtro:** `keywords.cs.{peaje}` (contains)

**Output esperado:**
```json
{
  "odoo_id": 46707,
  "name": "PEAJES",
  "code": null
}
```

#### 4. Supabase: Buscar Moneda
**Tipo:** Supabase
**Operación:** Select rows
**Tabla:** `odoo_currencies`
**Filtro:** `code.eq.{{ $json.moneda }}`

**Output esperado:**
```json
{
  "odoo_id": 45,
  "code": "CLP",
  "symbol": "$"
}
```

#### 5. HTTP Request: Crear Gasto en Odoo
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense",
      "create",
      [
        {
          "name": "{{ $json.descripcion }}",
          "date": "{{ $json.fecha }}",
          "employee_id": {{ $node["Supabase: Buscar Empleado"].json.odoo_id }},
          "product_id": {{ $node["Supabase: Buscar Categoría"].json.odoo_id }},
          "quantity": 1,
          "total_amount": {{ $json.monto }},
          "total_amount_currency": {{ $json.monto }},
          "payment_mode": "own_account",
          "currency_id": {{ $node["Supabase: Buscar Moneda"].json.odoo_id }},
          "company_id": {{ $node["Supabase: Buscar Empleado"].json.company_id }}
        }
      ],
      {
        "context": {
          "allowed_company_ids": [{{ $node["Supabase: Buscar Empleado"].json.company_id }}],
          "force_company": {{ $node["Supabase: Buscar Empleado"].json.company_id }}
        }
      }
    ]
  },
  "id": 1
}
```

**Expression para extraer expense_id:**
```javascript
{{ $json.result }}
```

#### 6. Supabase: Guardar Log
**Tipo:** Supabase
**Operación:** Insert
**Tabla:** `expense_processing_log`

**Datos:**
```json
{
  "boleta_id": "{{ $node["Webhook"].json.boleta_id }}",
  "odoo_expense_id": {{ $node["HTTP Request: Crear Gasto en Odoo"].json.result }},
  "status": "created",
  "processed_at": "{{ $now.toISO() }}"
}
```

#### 7. Response
**Tipo:** Respond to Webhook
**Status:** 200
**Body:**
```json
{
  "success": true,
  "odoo_expense_id": {{ $node["HTTP Request: Crear Gasto en Odoo"].json.result }},
  "message": "Gasto creado exitosamente en Odoo"
}
```

---

## Workflow 2: Agrupar Gastos Automáticamente

### Descripción
Se ejecuta periódicamente (ej: cada noche) y crea reportes con gastos sin asignar.

### Nodos en n8n:

#### 1. Cron (Trigger)
**Tipo:** Schedule Trigger
**Modo:** Every day
**Hora:** 23:00 (11 PM)

#### 2. HTTP Request: Buscar Empleados con Gastos Pendientes
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.employee",
      "search_read",
      [],
      {
        "fields": ["id", "name", "company_id"]
      }
    ]
  },
  "id": 1
}
```

#### 3. Split In Batches
**Tipo:** Split In Batches
**Batch Size:** 1

#### 4. HTTP Request: Buscar Gastos sin Reporte
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense",
      "search_read",
      [[
        ["sheet_id", "=", false],
        ["state", "=", "draft"],
        ["employee_id", "=", {{ $json.id }}]
      ]],
      {
        "fields": ["id", "name", "total_amount", "date"]
      }
    ]
  },
  "id": 2
}
```

#### 5. IF: Verificar si hay suficientes gastos
**Tipo:** IF
**Condición:** `{{ $json.result.length >= 5 }}`

##### Rama TRUE:

#### 6. Function: Extraer IDs de Gastos
**Tipo:** Function
**Código JavaScript:**
```javascript
const expenses = $node["HTTP Request: Buscar Gastos sin Reporte"].json.result;
const expenseIds = expenses.map(exp => exp.id);
const employee = $node["Split In Batches"].json;
const totalAmount = expenses.reduce((sum, exp) => sum + exp.total_amount, 0);

// Generar nombre del reporte
const currentMonth = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
const reportName = `Reporte ${employee.name} - ${currentMonth}`;

return {
  expense_ids: expenseIds,
  employee_id: employee.id,
  employee_name: employee.name,
  company_id: employee.company_id[0],
  report_name: reportName,
  total_amount: totalAmount,
  expense_count: expenseIds.length
};
```

#### 7. HTTP Request: Crear Reporte de Gastos
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense.sheet",
      "create",
      [
        {
          "name": "{{ $json.report_name }}",
          "employee_id": {{ $json.employee_id }},
          "expense_line_ids": [[6, 0, {{ JSON.stringify($json.expense_ids) }}]],
          "company_id": {{ $json.company_id }}
        }
      ],
      {
        "context": {
          "allowed_company_ids": [{{ $json.company_id }}],
          "force_company": {{ $json.company_id }}
        }
      }
    ]
  },
  "id": 3
}
```

#### 8. HTTP Request: Enviar Reporte (Submit)
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense.sheet",
      "action_submit_sheet",
      [[{{ $node["HTTP Request: Crear Reporte de Gastos"].json.result }}]]
    ]
  },
  "id": 4
}
```

#### 9. Supabase: Actualizar Logs
**Tipo:** Supabase
**Operación:** Update
**Tabla:** `expense_processing_log`

**Filtros:** `odoo_expense_id.in.({{ JSON.stringify($node["Function: Extraer IDs de Gastos"].json.expense_ids) }})`

**Datos:**
```json
{
  "odoo_sheet_id": {{ $node["HTTP Request: Crear Reporte de Gastos"].json.result }},
  "status": "in_report"
}
```

#### 10. Send Email (Opcional)
**Tipo:** Send Email
**Para:** `manager@empresastahan.com`
**Asunto:** `Nuevo Reporte de Gastos: {{ $node["Function: Extraer IDs de Gastos"].json.report_name }}`

**Cuerpo:**
```html
<h2>Reporte de Gastos Creado</h2>
<p>Se ha creado un nuevo reporte de gastos:</p>
<ul>
  <li><strong>Empleado:</strong> {{ $node["Function: Extraer IDs de Gastos"].json.employee_name }}</li>
  <li><strong>Cantidad de gastos:</strong> {{ $node["Function: Extraer IDs de Gastos"].json.expense_count }}</li>
  <li><strong>Monto total:</strong> ${{ $node["Function: Extraer IDs de Gastos"].json.total_amount }}</li>
</ul>
<p>Por favor, revisa y aprueba el reporte en Odoo.</p>
```

---

## Workflow 3: Sincronizar Catálogos (Supabase ← Odoo)

### Descripción
Sincroniza empleados, productos, monedas y empresas desde Odoo a Supabase.

### Nodos en n8n:

#### 1. Cron (Trigger)
**Tipo:** Schedule Trigger
**Modo:** Every day
**Hora:** 02:00 (2 AM)

#### 2. HTTP Request: Obtener Empleados de Odoo
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.employee",
      "search_read",
      [],
      {
        "fields": ["id", "name", "work_email", "company_id"]
      }
    ]
  },
  "id": 1
}
```

#### 3. Function: Transformar Datos de Empleados
**Tipo:** Function
**Código:**
```javascript
const employees = $input.item.json.result;

return employees.map(emp => ({
  json: {
    odoo_id: emp.id,
    name: emp.name,
    email: emp.work_email,
    company_id: emp.company_id ? emp.company_id[0] : null,
    company_name: emp.company_id ? emp.company_id[1] : null,
    updated_at: new Date().toISOString()
  }
}));
```

#### 4. Supabase: Upsert Empleados
**Tipo:** Supabase
**Operación:** Upsert
**Tabla:** `odoo_employees`
**Conflict Column:** `odoo_id`

#### 5. HTTP Request: Obtener Productos
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "product.product",
      "search_read",
      [[["can_be_expensed", "=", true]]],
      {
        "fields": ["id", "name", "default_code"]
      }
    ]
  },
  "id": 2
}
```

#### 6. Function: Transformar y Asignar Keywords
**Tipo:** Function
**Código:**
```javascript
const products = $input.item.json.result;

// Función para generar keywords automáticamente
function generateKeywords(name) {
  const nameWords = name.toLowerCase().split(/\s+/);

  // Mapeo de categorías comunes
  const keywordMap = {
    'peaje': ['peaje', 'tag', 'autopista', 'telepeaje'],
    'combustible': ['combustible', 'gasolina', 'diesel', 'nafta', 'bencina'],
    'estacionamiento': ['estacionamiento', 'parking', 'cochera'],
    'comida': ['comida', 'alimento', 'restaurante', 'almuerzo', 'cena'],
    'hotel': ['hotel', 'hospedaje', 'alojamiento'],
    'taxi': ['taxi', 'uber', 'cabify', 'transporte'],
    'herramienta': ['herramienta', 'taller', 'repuesto']
  };

  let keywords = nameWords;

  // Agregar keywords relacionadas
  for (const [key, values] of Object.entries(keywordMap)) {
    if (name.toLowerCase().includes(key)) {
      keywords = [...keywords, ...values];
    }
  }

  return [...new Set(keywords)]; // Eliminar duplicados
}

return products.map(prod => ({
  json: {
    odoo_id: prod.id,
    name: prod.name,
    code: prod.default_code,
    keywords: generateKeywords(prod.name),
    updated_at: new Date().toISOString()
  }
}));
```

#### 7. Supabase: Upsert Productos
**Tipo:** Supabase
**Operación:** Upsert
**Tabla:** `odoo_expense_categories`
**Conflict Column:** `odoo_id`

#### 8. HTTP Request: Obtener Monedas
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "res.currency",
      "search_read",
      [[["active", "=", true]]],
      {
        "fields": ["id", "name", "symbol", "position"]
      }
    ]
  },
  "id": 3
}
```

#### 9. Supabase: Upsert Monedas
**Tipo:** Supabase
**Operación:** Upsert
**Tabla:** `odoo_currencies`

#### 10. HTTP Request: Obtener Empresas
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "res.company",
      "search_read",
      [],
      {
        "fields": ["id", "name", "currency_id"]
      }
    ]
  },
  "id": 4
}
```

#### 11. Supabase: Upsert Empresas
**Tipo:** Supabase
**Operación:** Upsert
**Tabla:** `odoo_companies`

#### 12. Supabase: Actualizar Estado de Sincronización
**Tipo:** Supabase
**Operación:** Upsert
**Tabla:** `odoo_sync_status`

**Datos:**
```json
{
  "table_name": "all_catalogs",
  "last_sync_at": "{{ $now.toISO() }}",
  "record_count": {{ $node["HTTP Request: Obtener Empleados de Odoo"].json.result.length }},
  "status": "success"
}
```

---

## Workflow 4: Webhook para Aprobar Reporte

### Descripción
Permite aprobar reportes desde una interfaz externa o automatización.

### Nodos en n8n:

#### 1. Webhook (Trigger)
**Tipo:** Webhook
**Método:** POST
**Path:** `/webhook/approve-report`

**Payload esperado:**
```json
{
  "sheet_id": 1624,
  "approved_by": "Juan Manager"
}
```

#### 2. HTTP Request: Aprobar Reporte
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense.sheet",
      "action_approve_expense_sheets",
      [[{{ $json.sheet_id }}]]
    ]
  },
  "id": 1
}
```

#### 3. HTTP Request: Leer Estado del Reporte
**Tipo:** HTTP Request
**Método:** POST
**URL:** `https://odoo17.odoosistema.com/jsonrpc`

**Body:**
```json
{
  "jsonrpc": "2.0",
  "method": "call",
  "params": {
    "service": "object",
    "method": "execute_kw",
    "args": [
      "Tahan_Nov_2025",
      91,
      "123456789",
      "hr.expense.sheet",
      "read",
      [[{{ $node["Webhook"].json.sheet_id }}]],
      {
        "fields": ["id", "name", "state", "total_amount", "employee_id"]
      }
    ]
  },
  "id": 2
}
```

#### 4. Supabase: Actualizar Logs
**Tipo:** Supabase
**Operación:** Update
**Tabla:** `expense_processing_log`

**Filtro:** `odoo_sheet_id.eq.{{ $node["Webhook"].json.sheet_id }}`

**Datos:**
```json
{
  "status": "approved",
  "processed_at": "{{ $now.toISO() }}"
}
```

#### 5. Response
**Tipo:** Respond to Webhook
**Status:** 200
**Body:**
```json
{
  "success": true,
  "sheet_id": {{ $node["Webhook"].json.sheet_id }},
  "state": "{{ $node["HTTP Request: Leer Estado del Reporte"].json.result[0].state }}",
  "message": "Reporte aprobado exitosamente"
}
```

---

## Funciones de Utilidad para n8n

### Function: Manejo de Errores de Odoo

```javascript
// Node: Function - Parse Odoo Response
const response = $input.item.json;

if (response.error) {
  // Error de Odoo
  throw new Error(JSON.stringify({
    error: true,
    message: response.error.message,
    debug: response.error.data?.debug || 'No debug info',
    code: response.error.code
  }));
}

// Respuesta exitosa
return {
  json: {
    success: true,
    result: response.result
  }
};
```

### Function: Formatear Fecha para Odoo

```javascript
// Node: Function - Format Date
const dateString = $json.fecha; // "2025-11-17" o "17/11/2025"

// Convertir a formato YYYY-MM-DD si es necesario
let formattedDate;

if (dateString.includes('/')) {
  // Formato DD/MM/YYYY o DD/MM/YY
  const parts = dateString.split('/');
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  let year = parts[2];

  // Si el año es de 2 dígitos, asumir 20XX
  if (year.length === 2) {
    year = '20' + year;
  }

  formattedDate = `${year}-${month}-${day}`;
} else {
  // Asumir que ya está en formato YYYY-MM-DD
  formattedDate = dateString;
}

return {
  json: {
    formatted_date: formattedDate,
    original_date: dateString
  }
};
```

### Function: Normalizar Nombre de Conductor

```javascript
// Node: Function - Normalize Driver Name
const rawName = $json.conductor;

// Normalizar nombre
const normalizedName = rawName
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
  .replace(/\s+/g, ' '); // Normalizar espacios

return {
  json: {
    normalized_name: normalizedName,
    original_name: rawName,
    search_pattern: `%${normalizedName}%`
  }
};
```

### Function: Validar Monto

```javascript
// Node: Function - Validate Amount
const amount = $json.monto;

// Validaciones
const validations = {
  is_number: typeof amount === 'number',
  is_positive: amount > 0,
  is_not_too_large: amount < 10000000, // 10 millones
  is_not_zero: amount !== 0
};

const is_valid = Object.values(validations).every(v => v === true);

if (!is_valid) {
  throw new Error(JSON.stringify({
    error: 'Invalid amount',
    amount: amount,
    validations: validations
  }));
}

return {
  json: {
    amount: amount,
    is_valid: true,
    validations: validations
  }
};
```

---

## Variables de Entorno Recomendadas para n8n

```env
ODOO_URL=https://odoo17.odoosistema.com
ODOO_DB=Tahan_Nov_2025
ODOO_USER=juancruztahan@empresastahan.com
ODOO_PASSWORD=123456789
ODOO_UID=91

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Configuraciones
MIN_EXPENSES_FOR_REPORT=5
AUTO_SUBMIT_REPORTS=true
AUTO_APPROVE_UNDER_AMOUNT=50000
```

---

## Tips y Mejores Prácticas

### 1. Reintentos Automáticos

Configura reintentos en los nodos HTTP Request:
- **Retry On Fail:** Yes
- **Max Tries:** 3
- **Wait Between Tries:** 1000ms

### 2. Logging

Agrega nodos de logging para debug:
```javascript
// Node: Function - Log Request
console.log('Creating expense:', JSON.stringify($json, null, 2));
return $input.all();
```

### 3. Notificaciones

Configura notificaciones en caso de error:
- Slack
- Email
- Telegram
- Discord

### 4. Monitoreo

Crea un dashboard en Supabase para monitorear:
- Gastos creados por día
- Reportes pendientes
- Errores en el procesamiento
- Tiempo promedio de procesamiento

### 5. Rate Limiting

Si procesas muchas boletas, agrega delays:
- **Wait** node entre requests
- **Batch** processing en grupos de 10-20

---

## Ejemplo de Payload Completo para Testing

```bash
# Test Workflow 1: Procesar Boleta
curl -X POST https://tahan-n8n.0cguqx.easypanel.host/webhook/process-expense \
  -H "Content-Type: application/json" \
  -d '{
    "boleta_id": "123e4567-e89b-12d3-a456-426614174000",
    "conductor": "Alberto Angel Lujan",
    "categoria": "Peaje",
    "fecha": "2025-11-17",
    "monto": 15000,
    "moneda": "CLP",
    "empresa": "TURKEN",
    "descripcion": "Peaje Ruta 5 - Test desde n8n",
    "imagen_url": "https://example.com/boleta.jpg"
  }'
```

```bash
# Test Workflow 4: Aprobar Reporte
curl -X POST https://tahan-n8n.0cguqx.easypanel.host/webhook/approve-report \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": 1624,
    "approved_by": "Juan Manager"
  }'
```

---

**Fecha:** 17 de Noviembre 2025
**Versión:** 1.0
**Plataforma:** n8n + Odoo 17 + Supabase
