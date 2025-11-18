#!/bin/bash

# Script de prueba para el endpoint /api/process-receipt
# Asegúrate de tener el servidor corriendo con: npm run dev

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing /api/process-receipt endpoint...${NC}\n"

# Variables de prueba
# IMPORTANTE: Reemplaza estos valores con datos reales de tu base de datos
TRIP_ID="9667a068-5d5b-4cb7-a8b2-7068ed47782a"
FOTO_URL="https://vgzxwljcledfipzlvfeo.supabase.co/storage/v1/object/public/rendiciones/fotos/9667a068-5d5b-4cb7-a8b2-7068ed47782a/1763402746207.jpg"

# URL del endpoint (ajusta según tu entorno)
API_URL="http://localhost:3000/api/process-receipt"

echo -e "${YELLOW}📝 Test Data:${NC}"
echo "Trip ID: $TRIP_ID"
echo "Foto URL: $FOTO_URL"
echo "API URL: $API_URL"
echo ""

# Test 1: Request exitoso
echo -e "${YELLOW}Test 1: Successful request${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"trip_id\": \"$TRIP_ID\",
    \"fotoUrl\": \"$FOTO_URL\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Test passed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Test failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 2: Missing trip_id
echo -e "${YELLOW}Test 2: Missing trip_id${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"fotoUrl\": \"$FOTO_URL\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Test passed (HTTP $HTTP_CODE - Expected error)${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Test failed (HTTP $HTTP_CODE - Expected 400)${NC}"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 3: Missing fotoUrl
echo -e "${YELLOW}Test 3: Missing fotoUrl${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"trip_id\": \"$TRIP_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✅ Test passed (HTTP $HTTP_CODE - Expected error)${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Test failed (HTTP $HTTP_CODE - Expected 400)${NC}"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 4: Invalid trip_id
echo -e "${YELLOW}Test 4: Invalid trip_id (non-existent)${NC}"
INVALID_TRIP_ID="00000000-0000-0000-0000-000000000000"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"trip_id\": \"$INVALID_TRIP_ID\",
    \"fotoUrl\": \"$FOTO_URL\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✅ Test passed (HTTP $HTTP_CODE - Expected error)${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Test failed (HTTP $HTTP_CODE - Expected 404)${NC}"
  echo "$BODY" | jq '.'
fi
echo ""

# Test 5: Con descripción del conductor
echo -e "${YELLOW}Test 5: Con descripción del conductor${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"trip_id\": \"$TRIP_ID\",
    \"fotoUrl\": \"$FOTO_URL\",
    \"conductor_description\": \"Peaje de Cristo Redentor camino a Argentina\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Test passed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'

  # Extraer keywords si están disponibles
  KEYWORDS=$(echo "$BODY" | jq -r '.data.extracted_data.keywords')
  if [ "$KEYWORDS" != "null" ]; then
    echo -e "${GREEN}🔑 Keywords generadas: $KEYWORDS${NC}"
  fi
else
  echo -e "${RED}❌ Test failed (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi
echo ""

echo -e "${YELLOW}🎉 Tests completed!${NC}"
