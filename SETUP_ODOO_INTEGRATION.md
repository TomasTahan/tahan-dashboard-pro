# Guía de Configuración - Integración con Odoo 17

Esta guía te ayudará a configurar la integración con Odoo para automatizar la creación de gastos.

## 📋 Prerequisitos

- [x] Base de datos de Supabase con schema aplicado (ver `SUPABASE_SCHEMA.sql`)
- [x] Acceso a Odoo 17 con credenciales
- [x] Variables de entorno configuradas en `.env`

## 🚀 Pasos de Configuración

### 1. Aplicar el Schema de Supabase

Si aún no has aplicado el schema, ejecuta el SQL en Supabase:

```bash
# Ve a Supabase Dashboard > SQL Editor > New Query
# Copia y pega el contenido de SUPABASE_SCHEMA.sql
# Ejecuta el script
```

Esto creará las siguientes tablas:
- `odoo_employees` - Cache de empleados
- `odoo_expense_categories` - Cache de categorías de gastos
- `odoo_currencies` - Cache de monedas
- `odoo_companies` - Cache de empresas
- `expense_processing_log` - Log de procesamiento
- `odoo_sync_status` - Control de sincronización

### 2. Configurar Variables de Entorno

Las variables de Odoo ya están en tu `.env`:

```bash
ODOO_URL=https://odoo17.odoosistema.com
ODOO_DATABASE=Tahan_Nov_2025
ODOO_USERNAME=juancruztahan@empresastahan.com
ODOO_PASSWORD=123456789
```

### 3. Sincronizar Categorías de Gastos desde Odoo

Necesitas poblar la tabla `odoo_expense_categories` con las categorías de Odoo.

#### Opción A: Manual (Recomendado para empezar)

Ejecuta en Supabase SQL Editor:

```sql
-- Ejemplo: Agregar categoría PEAJES
INSERT INTO odoo_expense_categories (odoo_id, name, code, keywords)
VALUES (
  46707,
  'PEAJES',
  '10030001',
  ARRAY['peaje', 'peajes', 'tag', 'autopista', 'toll', 'ruta']
);

-- Agregar más categorías según necesites
-- Puedes obtener los IDs y nombres desde Odoo o consultando la API
```

#### Opción B: Automática (Usando la API)

Puedes crear un script o endpoint para sincronizar automáticamente:

```typescript
// Ejemplo de código para sincronizar
import { odooClient } from "@/lib/odoo/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function syncCategories() {
  // 1. Obtener categorías de Odoo
  const categories = await odooClient.searchExpenseCategories();

  // 2. Insertar en Supabase
  for (const cat of categories) {
    await supabase.from("odoo_expense_categories").upsert({
      odoo_id: cat.id,
      name: cat.name,
      code: cat.default_code,
      keywords: [], // Agregar manualmente después
    }, { onConflict: 'odoo_id' });
  }

  console.log(`Sincronizadas ${categories.length} categorías`);
}
```

### 4. Configurar Keywords para Matching Automático

Las keywords permiten que el sistema identifique automáticamente la categoría correcta basándose en la descripción del gasto.

```sql
-- Ejemplos de configuración de keywords

-- PEAJES
UPDATE odoo_expense_categories
SET keywords = ARRAY['peaje', 'peajes', 'tag', 'autopista', 'toll', 'ruta', 'via']
WHERE name ILIKE '%peaje%';

-- COMBUSTIBLE
UPDATE odoo_expense_categories
SET keywords = ARRAY['combustible', 'gasolina', 'diesel', 'nafta', 'gas', 'gnc', 'fuel']
WHERE name ILIKE '%combustible%';

-- ALOJAMIENTO / HOSPEDAJE
UPDATE odoo_expense_categories
SET keywords = ARRAY['hotel', 'alojamiento', 'hospedaje', 'hostal', 'motel', 'lodging']
WHERE name ILIKE '%alojamiento%' OR name ILIKE '%hotel%';

-- COMIDAS
UPDATE odoo_expense_categories
SET keywords = ARRAY['comida', 'almuerzo', 'cena', 'desayuno', 'restaurant', 'food', 'meal']
WHERE name ILIKE '%comida%' OR name ILIKE '%aliment%';

-- MANTENIMIENTO
UPDATE odoo_expense_categories
SET keywords = ARRAY['mantenimiento', 'reparacion', 'taller', 'mecanico', 'service', 'repair']
WHERE name ILIKE '%mantenimiento%' OR name ILIKE '%reparacion%';
```

### 5. Verificar que los Drivers tengan odoo_id

Los conductores necesitan tener su `odoo_id` configurado en la tabla `empleados`:

```sql
-- Verificar drivers sin odoo_id
SELECT
  e.empleado_id,
  u.nombre_completo,
  e.odoo_id
FROM empleados e
JOIN users u ON u.user_id = e.user_id
WHERE e.odoo_id IS NULL;

-- Actualizar manualmente si es necesario
UPDATE empleados
SET odoo_id = 970  -- ID del empleado en Odoo
WHERE user_id = 'uuid-del-usuario';
```

**Para obtener el odoo_id de un empleado:**

1. Ve a Odoo > Empleados
2. Encuentra el empleado
3. La URL mostrará el ID: `https://odoo17.../hr.employee/970`
4. Actualiza la tabla `empleados` en Supabase

## 🧪 Testing

### Test 1: Verificar Autenticación con Odoo

Puedes probar la autenticación creando un script simple:

```typescript
// test-odoo-auth.ts
import { odooClient } from "@/lib/odoo/client";

async function testAuth() {
  try {
    const uid = await odooClient.authenticate();
    console.log("✓ Autenticación exitosa. UID:", uid);
  } catch (error) {
    console.error("✗ Error de autenticación:", error);
  }
}

testAuth();
```

### Test 2: Verificar Categorías

```sql
-- Ver todas las categorías sincronizadas
SELECT odoo_id, name, code, keywords
FROM odoo_expense_categories
ORDER BY name;

-- Probar búsqueda por keyword
SELECT * FROM find_category_by_keyword('peaje');
```

### Test 3: Crear un Gasto de Prueba

Usa el script de prueba incluido:

```bash
# Asegúrate de tener una boleta en estado "espera"
./test-create-expense.sh <boleta_id>

# O con categoría específica
./test-create-expense.sh <boleta_id> 46707
```

## 📊 Flujo Completo de Testing

1. **Crear una boleta de prueba**:
   ```bash
   curl -X POST http://localhost:3000/api/process-receipt \
     -H "Content-Type: application/json" \
     -d '{
       "trip_id": "uuid-del-trip",
       "fotoUrl": "https://url-de-imagen.jpg"
     }'
   ```

2. **Verificar que la boleta está en estado "espera"**:
   ```sql
   SELECT boleta_id, estado, descripcion, total, moneda
   FROM boletas
   WHERE estado = 'espera'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Crear el gasto en Odoo**:
   ```bash
   ./test-create-expense.sh <boleta_id>
   ```

4. **Verificar en expense_processing_log**:
   ```sql
   SELECT *
   FROM expense_processing_log
   WHERE boleta_id = '<boleta_id>';
   ```

5. **Verificar en Odoo**:
   - Ve a Odoo > Gastos
   - Busca el gasto recién creado
   - Verifica que tenga todos los datos correctos

## 🔧 Troubleshooting

### Problema: "Driver does not have an odoo_id"

**Solución**:
```sql
-- Buscar el driver en Odoo primero
-- Luego actualizar en Supabase
UPDATE empleados
SET odoo_id = [ID_DE_ODOO]
WHERE user_id = '[UUID_DEL_DRIVER]';
```

### Problema: "No se pudo determinar la categoría automáticamente"

**Solución**:
1. Verifica que existan categorías en `odoo_expense_categories`
2. Agrega keywords relevantes
3. O especifica `product_id` manualmente en el request

### Problema: "Currency not supported"

**Solución**:
Agrega la moneda al mapeo en `/lib/odoo/types.ts`:
```typescript
export const CURRENCY_MAP: Record<string, number> = {
  // ... existentes
  EUR: XX, // Agrega el ID de Odoo
};
```

## 📝 Datos de Referencia

### Empresa Predeterminada

- **Nombre**: EXPORTADORA E IMPORTADORA TURKEN S A
- **ID en Odoo**: 3
- **Moneda**: CLP (ID: 45)

### Monedas Configuradas

| Código | ID Odoo | Símbolo |
|--------|---------|---------|
| ARS    | 19      | $       |
| BRL    | 6       | R$      |
| CLP    | 45      | $       |
| PEN    | 154     | S/      |
| PYG    | 155     | ₲       |
| USD    | 2       | USD     |

### Categorías Comunes (Ejemplos)

| ID Odoo | Nombre | Keywords Sugeridos |
|---------|--------|-------------------|
| 46707   | PEAJES | peaje, tag, autopista, toll |
| 46161   | HERRAMIENTAS TALLER | herramienta, taller, tools |

## ✅ Checklist de Configuración

- [ ] Schema de Supabase aplicado
- [ ] Variables de entorno configuradas
- [ ] Tabla `odoo_expense_categories` poblada
- [ ] Keywords configurados para categorías principales
- [ ] Drivers tienen `odoo_id` en tabla `empleados`
- [ ] Test de autenticación exitoso
- [ ] Test de creación de gasto exitoso
- [ ] Verificado en Odoo que el gasto se creó correctamente

## 🎯 Próximos Pasos

Una vez que tengas la integración básica funcionando:

1. **Sincronización Automática**: Crear endpoint para sincronizar periódicamente categorías y empleados desde Odoo
2. **UI de Confirmación**: Agregar interfaz para que el humano confirme/edite datos antes de crear el gasto
3. **Reportes Automáticos**: Agrupar gastos automáticamente en reportes
4. **Workflow de Aprobación**: Implementar aprobación automática o semi-automática

## 📚 Recursos

- `ODOO_API_DOCUMENTATION.md` - Documentación completa de la API de Odoo
- `README_CREATE_EXPENSE_API.md` - Documentación del endpoint /api/create-expense
- `SUPABASE_SCHEMA.sql` - Schema completo de las tablas

---

**Última actualización**: 18 de Noviembre 2025
