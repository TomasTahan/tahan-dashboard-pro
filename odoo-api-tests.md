# Odoo 17 API - Documentación y Tests para Módulo de Gastos

## Información de Conexión
- **URL**: https://odoo17.odoosistema.com/
- **Base de Datos**: Tahan_Nov_2025
- **Usuario**: juancruztahan@empresastahan.com
- **Password**: 123456789
- **Versión**: Odoo 17

## Endpoint API
- **JSON-RPC**: https://odoo17.odoosistema.com/jsonrpc

---

## Tests Realizados

### 1. Autenticación

```bash
# Test de autenticación para obtener UID
curl -X POST https://odoo17.odoosistema.com/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": [
        "Tahan_Nov_2025",
        "juancruztahan@empresastahan.com",
        "123456789",
        {}
      ]
    },
    "id": 1
  }'
```

**Resultado**:

---

## Estructura de Modelos Odoo

### Modelos Principales para Gastos

1. **hr.expense** - Gastos individuales
2. **hr.expense.sheet** - Reportes de gastos (agrupación de múltiples gastos)
3. **hr.employee** - Empleados/Conductores
4. **product.product** - Productos/Categorías de gastos
5. **res.currency** - Monedas
6. **res.company** - Empresas

---

## Notas de Investigación

- Odoo 17 usa JSON-RPC 2.0 sobre HTTP POST
- El método principal es `execute_kw` que permite ejecutar operaciones CRUD
- Métodos disponibles: `search`, `search_read`, `create`, `write`, `unlink`, `fields_get`
- Se puede usar API Key en lugar de password para autenticación

