-- ============================================================
-- SUPABASE SCHEMA PARA INTEGRACIÓN CON ODOO 17
-- Sistema de Automatización de Gastos
-- Fecha: 17 de Noviembre 2025
-- ============================================================

-- ============================================================
-- 1. TABLA: odoo_employees
-- Descripción: Cache de empleados/conductores desde Odoo
-- ============================================================
CREATE TABLE IF NOT EXISTS odoo_employees (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company_id INTEGER,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_odoo_employees_odoo_id ON odoo_employees(odoo_id);
CREATE INDEX idx_odoo_employees_name ON odoo_employees(name);
CREATE INDEX idx_odoo_employees_email ON odoo_employees(email);
CREATE INDEX idx_odoo_employees_company ON odoo_employees(company_id);

-- Búsqueda case-insensitive
CREATE INDEX idx_odoo_employees_name_lower ON odoo_employees(LOWER(name));

-- Comentarios
COMMENT ON TABLE odoo_employees IS 'Cache de empleados/conductores desde Odoo para búsquedas rápidas';
COMMENT ON COLUMN odoo_employees.odoo_id IS 'ID del empleado en Odoo (hr.employee)';
COMMENT ON COLUMN odoo_employees.name IS 'Nombre completo del empleado';
COMMENT ON COLUMN odoo_employees.email IS 'Email de trabajo del empleado';
COMMENT ON COLUMN odoo_employees.company_id IS 'ID de la empresa en Odoo';

-- ============================================================
-- 2. TABLA: odoo_expense_categories
-- Descripción: Cache de productos/categorías de gastos desde Odoo
-- ============================================================
CREATE TABLE IF NOT EXISTS odoo_expense_categories (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  keywords TEXT[], -- Array de palabras clave para matching con IA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categories_odoo_id ON odoo_expense_categories(odoo_id);
CREATE INDEX idx_categories_name ON odoo_expense_categories(name);
CREATE INDEX idx_categories_code ON odoo_expense_categories(code);

-- Índice GIN para búsqueda en array de keywords
CREATE INDEX idx_categories_keywords ON odoo_expense_categories USING GIN(keywords);

-- Comentarios
COMMENT ON TABLE odoo_expense_categories IS 'Cache de categorías de gastos (productos) desde Odoo';
COMMENT ON COLUMN odoo_expense_categories.odoo_id IS 'ID del producto en Odoo (product.product)';
COMMENT ON COLUMN odoo_expense_categories.keywords IS 'Palabras clave para matching automático con IA';

-- ============================================================
-- 3. TABLA: odoo_currencies
-- Descripción: Cache de monedas desde Odoo
-- ============================================================
CREATE TABLE IF NOT EXISTS odoo_currencies (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  code TEXT NOT NULL,
  symbol TEXT,
  position TEXT, -- 'before' o 'after'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_currencies_odoo_id ON odoo_currencies(odoo_id);
CREATE INDEX idx_currencies_code ON odoo_currencies(code);

-- Comentarios
COMMENT ON TABLE odoo_currencies IS 'Cache de monedas activas desde Odoo';
COMMENT ON COLUMN odoo_currencies.odoo_id IS 'ID de la moneda en Odoo (res.currency)';
COMMENT ON COLUMN odoo_currencies.code IS 'Código de moneda (ISO 4217): ARS, CLP, USD, etc.';
COMMENT ON COLUMN odoo_currencies.position IS 'Posición del símbolo: before o after';

-- ============================================================
-- 4. TABLA: odoo_companies
-- Descripción: Cache de empresas desde Odoo
-- ============================================================
CREATE TABLE IF NOT EXISTS odoo_companies (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency_id INTEGER,
  currency_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_companies_odoo_id ON odoo_companies(odoo_id);
CREATE INDEX idx_companies_name ON odoo_companies(name);

-- Comentarios
COMMENT ON TABLE odoo_companies IS 'Cache de empresas desde Odoo';
COMMENT ON COLUMN odoo_companies.odoo_id IS 'ID de la empresa en Odoo (res.company)';
COMMENT ON COLUMN odoo_companies.currency_id IS 'ID de la moneda predeterminada de la empresa';

-- ============================================================
-- 5. TABLA: expense_processing_log
-- Descripción: Log de procesamiento de gastos (boletas → Odoo)
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_processing_log (
  id SERIAL PRIMARY KEY,
  boleta_id UUID, -- Referencia a tabla de boletas (si existe)
  odoo_expense_id INTEGER, -- ID del gasto creado en Odoo
  odoo_sheet_id INTEGER, -- ID del reporte de gastos en Odoo
  status TEXT CHECK (status IN ('pending', 'created', 'in_report', 'approved', 'error')),
  error_message TEXT,
  metadata JSONB, -- Información adicional (datos de la boleta, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_expense_log_boleta ON expense_processing_log(boleta_id);
CREATE INDEX idx_expense_log_odoo_expense ON expense_processing_log(odoo_expense_id);
CREATE INDEX idx_expense_log_odoo_sheet ON expense_processing_log(odoo_sheet_id);
CREATE INDEX idx_expense_log_status ON expense_processing_log(status);
CREATE INDEX idx_expense_log_created_at ON expense_processing_log(created_at);

-- Índice GIN para búsquedas en metadata JSON
CREATE INDEX idx_expense_log_metadata ON expense_processing_log USING GIN(metadata);

-- Comentarios
COMMENT ON TABLE expense_processing_log IS 'Log de procesamiento de boletas a gastos en Odoo';
COMMENT ON COLUMN expense_processing_log.boleta_id IS 'ID de la boleta original';
COMMENT ON COLUMN expense_processing_log.odoo_expense_id IS 'ID del gasto creado en Odoo (hr.expense)';
COMMENT ON COLUMN expense_processing_log.odoo_sheet_id IS 'ID del reporte de gastos en Odoo (hr.expense.sheet)';
COMMENT ON COLUMN expense_processing_log.status IS 'Estado del procesamiento';
COMMENT ON COLUMN expense_processing_log.metadata IS 'Información adicional en formato JSON';

-- ============================================================
-- 6. TABLA: odoo_sync_status
-- Descripción: Control de sincronización de catálogos
-- ============================================================
CREATE TABLE IF NOT EXISTS odoo_sync_status (
  id SERIAL PRIMARY KEY,
  table_name TEXT UNIQUE NOT NULL,
  last_sync_at TIMESTAMPTZ,
  record_count INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'in_progress')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sync_status_table ON odoo_sync_status(table_name);
CREATE INDEX idx_sync_status_updated ON odoo_sync_status(updated_at);

-- Comentarios
COMMENT ON TABLE odoo_sync_status IS 'Control de sincronización de catálogos desde Odoo';
COMMENT ON COLUMN odoo_sync_status.table_name IS 'Nombre de la tabla sincronizada';
COMMENT ON COLUMN odoo_sync_status.last_sync_at IS 'Última vez que se sincronizó';
COMMENT ON COLUMN odoo_sync_status.record_count IS 'Cantidad de registros sincronizados';

-- ============================================================
-- 7. VISTA: expense_summary
-- Descripción: Resumen de gastos por empleado y estado
-- ============================================================
CREATE OR REPLACE VIEW expense_summary AS
SELECT
  e.odoo_id as employee_id,
  e.name as employee_name,
  e.company_name,
  COUNT(l.id) as total_expenses,
  COUNT(CASE WHEN l.status = 'created' THEN 1 END) as pending_expenses,
  COUNT(CASE WHEN l.status = 'in_report' THEN 1 END) as in_report_expenses,
  COUNT(CASE WHEN l.status = 'approved' THEN 1 END) as approved_expenses,
  COUNT(CASE WHEN l.status = 'error' THEN 1 END) as error_expenses,
  MAX(l.created_at) as last_expense_date
FROM odoo_employees e
LEFT JOIN expense_processing_log l ON l.metadata->>'employee_id' = e.odoo_id::text
GROUP BY e.odoo_id, e.name, e.company_name;

COMMENT ON VIEW expense_summary IS 'Resumen de gastos por empleado y estado';

-- ============================================================
-- 8. FUNCIONES DE UTILIDAD
-- ============================================================

-- Función: Buscar empleado por nombre (fuzzy)
CREATE OR REPLACE FUNCTION find_employee_by_name(search_name TEXT)
RETURNS TABLE (
  id INTEGER,
  odoo_id INTEGER,
  name TEXT,
  email TEXT,
  company_id INTEGER,
  company_name TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.odoo_id,
    e.name,
    e.email,
    e.company_id,
    e.company_name,
    similarity(LOWER(e.name), LOWER(search_name)) as similarity_score
  FROM odoo_employees e
  WHERE LOWER(e.name) ILIKE '%' || LOWER(search_name) || '%'
     OR similarity(LOWER(e.name), LOWER(search_name)) > 0.3
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Habilitar extensión pg_trgm para similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON FUNCTION find_employee_by_name IS 'Busca empleados por nombre usando fuzzy matching';

-- ============================================================
-- Función: Buscar categoría por keywords
CREATE OR REPLACE FUNCTION find_category_by_keyword(search_keyword TEXT)
RETURNS TABLE (
  id INTEGER,
  odoo_id INTEGER,
  name TEXT,
  code TEXT,
  keywords TEXT[],
  match_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.odoo_id,
    c.name,
    c.code,
    c.keywords,
    (SELECT COUNT(*) FROM unnest(c.keywords) kw WHERE LOWER(kw) LIKE '%' || LOWER(search_keyword) || '%') as match_count
  FROM odoo_expense_categories c
  WHERE c.keywords @> ARRAY[LOWER(search_keyword)]
     OR EXISTS (SELECT 1 FROM unnest(c.keywords) kw WHERE LOWER(kw) LIKE '%' || LOWER(search_keyword) || '%')
     OR LOWER(c.name) LIKE '%' || LOWER(search_keyword) || '%'
  ORDER BY match_count DESC, c.name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_category_by_keyword IS 'Busca categorías de gastos por palabra clave';

-- ============================================================
-- Función: Obtener estadísticas de sincronización
CREATE OR REPLACE FUNCTION get_sync_stats()
RETURNS TABLE (
  table_name TEXT,
  last_sync_at TIMESTAMPTZ,
  hours_since_sync NUMERIC,
  record_count INTEGER,
  status TEXT,
  needs_sync BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.table_name,
    s.last_sync_at,
    EXTRACT(EPOCH FROM (NOW() - s.last_sync_at)) / 3600 as hours_since_sync,
    s.record_count,
    s.status,
    (EXTRACT(EPOCH FROM (NOW() - s.last_sync_at)) / 3600 > 24 OR s.last_sync_at IS NULL) as needs_sync
  FROM odoo_sync_status s
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_sync_stats IS 'Obtiene estadísticas de sincronización de catálogos';

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER update_odoo_employees_updated_at
  BEFORE UPDATE ON odoo_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_odoo_categories_updated_at
  BEFORE UPDATE ON odoo_expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_odoo_companies_updated_at
  BEFORE UPDATE ON odoo_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at
  BEFORE UPDATE ON odoo_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. ROW LEVEL SECURITY (Opcional)
-- ============================================================

-- Habilitar RLS en las tablas si es necesario
-- ALTER TABLE odoo_employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE odoo_expense_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE odoo_currencies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE odoo_companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_processing_log ENABLE ROW LEVEL SECURITY;

-- Crear políticas según tus necesidades de seguridad
-- CREATE POLICY "Allow public read" ON odoo_employees FOR SELECT USING (true);

-- ============================================================
-- 11. DATOS INICIALES (Opcional)
-- ============================================================

-- Insertar estado inicial de sincronización
INSERT INTO odoo_sync_status (table_name, status) VALUES
  ('odoo_employees', 'success'),
  ('odoo_expense_categories', 'success'),
  ('odoo_currencies', 'success'),
  ('odoo_companies', 'success')
ON CONFLICT (table_name) DO NOTHING;

-- ============================================================
-- 12. QUERIES ÚTILES PARA TESTING
-- ============================================================

-- Buscar empleado por nombre
-- SELECT * FROM find_employee_by_name('Alberto');

-- Buscar categoría por keyword
-- SELECT * FROM find_category_by_keyword('peaje');

-- Ver estadísticas de sincronización
-- SELECT * FROM get_sync_stats();

-- Ver resumen de gastos por empleado
-- SELECT * FROM expense_summary;

-- Contar gastos por estado
-- SELECT status, COUNT(*) FROM expense_processing_log GROUP BY status;

-- Gastos creados hoy
-- SELECT * FROM expense_processing_log WHERE DATE(created_at) = CURRENT_DATE;

-- Gastos con errores
-- SELECT * FROM expense_processing_log WHERE status = 'error';

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================

-- Para ejecutar este script:
-- 1. Copia todo el contenido
-- 2. Ve a tu proyecto de Supabase
-- 3. SQL Editor → New Query
-- 4. Pega el script y ejecuta (Run)

-- Verificación post-instalación:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'odoo_%';
