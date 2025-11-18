#!/bin/bash

# Script de prueba para el endpoint /api/create-expense
# Asegúrate de tener una boleta en estado "espera" o "confirmado" en Supabase

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL del endpoint (cambiar si usas otro puerto)
API_URL="http://localhost:3000/api/create-expense"

echo -e "${YELLOW}=== Test de Creación de Gasto en Odoo ===${NC}\n"

# Verificar que se pasó un boleta_id
if [ -z "$1" ]; then
  echo -e "${RED}Error: Debes proporcionar un boleta_id${NC}"
  echo "Uso: ./test-create-expense.sh <boleta_id> [product_id]"
  echo ""
  echo "Ejemplo:"
  echo "  ./test-create-expense.sh 550e8400-e29b-41d4-a716-446655440000"
  echo "  ./test-create-expense.sh 550e8400-e29b-41d4-a716-446655440000 46707"
  exit 1
fi

BOLETA_ID=$1
PRODUCT_ID=${2:-}

# Construir el payload
if [ -z "$PRODUCT_ID" ]; then
  PAYLOAD="{\"boleta_id\": \"$BOLETA_ID\"}"
  echo -e "${YELLOW}Creando gasto sin especificar categoría (matching automático)...${NC}"
else
  PAYLOAD="{\"boleta_id\": \"$BOLETA_ID\", \"product_id\": $PRODUCT_ID}"
  echo -e "${YELLOW}Creando gasto con categoría ID: $PRODUCT_ID...${NC}"
fi

echo -e "Payload: ${YELLOW}$PAYLOAD${NC}\n"

# Realizar la petición POST
echo -e "${YELLOW}Enviando petición a $API_URL...${NC}\n"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\n%{http_code}")

# Separar el body y el status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)

# Mostrar resultado
echo -e "${YELLOW}Status Code:${NC} $HTTP_STATUS"
echo -e "${YELLOW}Response:${NC}"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

# Verificar si fue exitoso
if [ "$HTTP_STATUS" -eq 201 ]; then
  echo -e "\n${GREEN}✓ Gasto creado exitosamente en Odoo!${NC}"

  # Extraer el odoo_expense_id si está disponible
  ODOO_EXPENSE_ID=$(echo "$HTTP_BODY" | jq -r '.data.odoo_expense_id' 2>/dev/null)
  if [ "$ODOO_EXPENSE_ID" != "null" ] && [ -n "$ODOO_EXPENSE_ID" ]; then
    echo -e "${GREEN}Odoo Expense ID: $ODOO_EXPENSE_ID${NC}"

    # Hacer GET para verificar el estado
    echo -e "\n${YELLOW}Verificando estado del gasto...${NC}"
    curl -s "$API_URL?boleta_id=$BOLETA_ID" | jq '.'
  fi
else
  echo -e "\n${RED}✗ Error al crear el gasto${NC}"
  exit 1
fi

echo ""
