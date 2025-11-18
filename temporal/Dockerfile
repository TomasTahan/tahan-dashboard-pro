# Dockerfile para el worker de Temporal
FROM node:20-alpine

# Instalar dependencias de sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar código compartido (lib)
COPY lib ./lib

# Copiar código del worker
COPY temporal ./temporal

# Cambiar al directorio temporal
WORKDIR /app/temporal

# Instalar dependencias
RUN npm install

# Build (compilará desde /app debido a baseUrl en tsconfig)
RUN npm run build

# Exponer puerto (opcional, solo para health checks)
EXPOSE 4000

# Start worker
CMD ["npm", "start"]
