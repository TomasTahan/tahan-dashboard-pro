# Pasos para Habilitar Realtime en Supabase

## 1. Ejecutar Script SQL

Ve al **SQL Editor** de tu proyecto en Supabase y ejecuta el archivo:
`.claude/docs/setup-realtime-boletas.sql`

O copia y pega este SQL:

```sql
-- 1. Verificar que RLS esté habilitado
ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- 2. Agregar tabla boletas a la publicación de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE boletas;

-- 3. (OPCIONAL) Habilitar REPLICA IDENTITY FULL
ALTER TABLE boletas REPLICA IDENTITY FULL;
```

## 2. Verificar la Configuración

Ejecuta este query para verificar que la tabla esté en la publicación:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'boletas';
```

Deberías ver:
```
schemaname | tablename
-----------+----------
public     | boletas
```

## 3. Verificar Políticas RLS

Ejecuta este query para ver las políticas actuales:

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'boletas';
```

## 4. Probar Realtime

Una vez habilitado:

1. Inicia el dev server: `npm run dev`
2. Abre la página de un viaje: `http://localhost:3000/thn-gastos/[tripId]`
3. Abre la consola del navegador (F12)
4. Deberías ver logs como:
   ```
   🔌 Realtime status [CLP]: SUBSCRIBED
   ✅ Realtime connected: CLP
   ```

## 5. Probar Inserción de Boleta

Para probar que funciona, inserta una boleta manualmente desde SQL Editor:

```sql
INSERT INTO boletas (
  trip_id,
  user_id,
  url,
  moneda,
  total,
  estado,
  date
) VALUES (
  '[TU_TRIP_ID_AQUI]',
  auth.uid(),
  'https://ejemplo.com/boleta.jpg',
  'CLP',
  50000,
  'espera',
  '15/11/2025 14:30:00'
);
```

**La boleta debería aparecer automáticamente en la UI sin refrescar la página!** 🎉

## 6. Indicadores Visuales

En la esquina superior derecha de cada sección de moneda verás:

- 🟢 **"En vivo"** (verde) = Conectado correctamente
- 🟡 **"Conectando..."** (amarillo) = Estableciendo conexión
- 🔴 **"Error"** (rojo) = Problema de conexión

## Troubleshooting

### No aparece el indicador "En vivo"
1. Verifica que ejecutaste el SQL para agregar la tabla a la publicación
2. Revisa la consola del navegador por errores
3. Verifica que el usuario esté autenticado

### Los cambios no se reflejan en tiempo real
1. Verifica que las políticas RLS permitan SELECT a tu usuario
2. Asegúrate de que el `trip_id` en el INSERT coincida con el viaje que estás viendo
3. Verifica que la `moneda` de la boleta coincida con alguna sección visible

### Error "unauthorized"
1. Revisa las políticas RLS - el usuario debe tener permiso SELECT
2. Verifica que el usuario esté autenticado correctamente

## Logs Útiles

En la consola del navegador verás:

```
🔌 Realtime status [CLP]: SUBSCRIBED
✅ Realtime connected: CLP
🆕 INSERT detected: { ... }
✅ Adding new boleta abc-123
```

Estos logs te ayudarán a debuggear cualquier problema.
