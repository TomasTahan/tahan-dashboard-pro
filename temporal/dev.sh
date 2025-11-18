#!/bin/bash

# Script para desarrollo local del worker de Temporal
# Asegúrate de tener las variables de entorno configuradas en .env

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando Temporal Worker en modo desarrollo${NC}\n"

# Verificar que existe .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  No se encontró archivo .env${NC}"
  echo "Copiando .env.example a .env..."
  cp .env.example .env
  echo -e "${YELLOW}Por favor, configura las variables en temporal/.env antes de continuar${NC}"
  exit 1
fi

# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs)

# Verificar variables críticas
if [ -z "$TEMPORAL_ADDRESS" ]; then
  echo -e "${YELLOW}⚠️  TEMPORAL_ADDRESS no está configurado en .env${NC}"
  exit 1
fi

echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm install

echo -e "\n${GREEN}🔄 Iniciando worker con hot reload...${NC}"
echo -e "Conectando a: ${TEMPORAL_ADDRESS}"
echo -e "Namespace: ${TEMPORAL_NAMESPACE:-default}\n"

npm run dev
