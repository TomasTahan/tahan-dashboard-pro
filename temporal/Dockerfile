# Dockerfile para el worker de Temporal
FROM node:20-alpine

# Instalar dependencias de sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package.json de la raíz (para types compartidos)
COPY package.json ./
COPY tsconfig.json ./

# Copiar código compartido (lib)
COPY lib ./lib

# Copiar código del worker
COPY temporal ./temporal

# Cambiar al directorio temporal
WORKDIR /app/temporal

# Instalar dependencias
RUN npm install

# Build
RUN npm run build

# Exponer puerto (opcional, solo para health checks)
EXPOSE 4000

# Start worker
CMD ["npm", "start"]
