-- Script para habilitar Supabase Realtime en tabla boletas
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar que RLS esté habilitado
-- (Si ya está habilitado, este comando no hará nada)
ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- 2. Agregar tabla boletas a la publicación de Realtime
-- Esto permite que los cambios en la tabla se transmitan en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE boletas;

-- 3. (OPCIONAL) Habilitar REPLICA IDENTITY FULL
-- Esto permite recibir los valores antiguos en eventos UPDATE y DELETE
-- Solo necesario si quieres ver los valores previos antes de la actualización
ALTER TABLE boletas REPLICA IDENTITY FULL;

-- 4. Verificar que la tabla esté en la publicación
-- Ejecuta esto para confirmar:
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'boletas';

-- Deberías ver un resultado con:
-- schemaname | tablename
-- -----------+----------
-- public     | boletas

-- 5. Políticas RLS recomendadas para Realtime
-- (Ajustar según tus necesidades de seguridad)

-- Política para SELECT: Usuarios pueden ver boletas de sus viajes
CREATE POLICY IF NOT EXISTS "Users can view boletas of their trips"
ON boletas FOR SELECT
USING (
  -- El usuario es quien creó la boleta
  auth.uid() = user_id
  OR
  -- O es el conductor del viaje
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = boletas.trip_id
    AND trips.driver_id = auth.uid()
  )
  -- Agregar aquí condición para RRHH si es necesario
  -- OR auth.jwt() ->> 'role' = 'rrhh'
);

-- Política para INSERT: Usuarios pueden crear boletas en sus viajes
CREATE POLICY IF NOT EXISTS "Users can insert boletas to their trips"
ON boletas FOR INSERT
WITH CHECK (
  -- El usuario debe ser el mismo que crea la boleta
  auth.uid() = user_id
  AND
  -- Y debe existir el viaje
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_id
    -- Opcional: validar que sea su viaje
    -- AND trips.driver_id = auth.uid()
  )
);

-- Política para UPDATE: Actualizar boletas (RRHH para validación)
CREATE POLICY IF NOT EXISTS "Users can update their boletas"
ON boletas FOR UPDATE
USING (
  -- El usuario creó la boleta
  auth.uid() = user_id
  -- Agregar aquí lógica para RRHH
  -- OR auth.jwt() ->> 'role' = 'rrhh'
)
WITH CHECK (
  -- El usuario creó la boleta
  auth.uid() = user_id
  -- Agregar aquí lógica para RRHH
  -- OR auth.jwt() ->> 'role' = 'rrhh'
);

-- 6. Verificar políticas RLS existentes
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'boletas';

-- NOTAS IMPORTANTES:
-- - Asegúrate de que las políticas RLS estén configuradas correctamente
-- - Los usuarios deben estar autenticados para recibir actualizaciones Realtime
-- - El filtro en el cliente (filter: `trip_id=eq.${tripId}`) debe coincidir con los permisos RLS
-- - Prueba con un usuario autenticado para verificar que funciona
