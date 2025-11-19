# Problema de Conexión con Temporal Server

## 🔴 Problema Detectado

Tu Next.js local no puede conectarse al servidor Temporal en tu VPS porque el **puerto 7233 no está expuesto públicamente**.

```
Error: Failed to connect before the deadline
```

## 🔍 Análisis de tu Setup Actual

### Servicios en Easypanel:
1. **temporal-server** - Servidor Temporal (puerto 7233 - INTERNO)
2. **temporal-web** - UI Web (HTTPS accesible: `https://tahan-temporal-web.0cguqx.easypanel.host`)
3. **temporal-db** - PostgreSQL
4. **temporal-elasticsearch** - ElasticSearch
5. **temporal-v2** - Tu Worker (conecta a `temporal-server:7233` internamente ✅)

### ¿Qué funciona?
- ✅ Worker → Temporal Server (dentro de Docker network)
- ✅ Temporal Web UI accesible externamente
- ❌ Next.js local → Temporal Server (bloqueado)

## 💡 Soluciones

### Opción 1: Exponer Puerto 7233 en Easypanel (RECOMENDADO)

En Easypanel, para el servicio `temporal-server`:

1. Ve a la configuración del servicio
2. Busca la sección de **Domains & Ports** o **Network**
3. Expón el puerto **7233** con un dominio
4. Debería quedarte algo como: `tahan-temporal-server.0cguqx.easypanel.host:7233`

Luego actualiza tu `.env`:
```bash
TEMPORAL_ADDRESS=tahan-temporal-server.0cguqx.easypanel.host:7233
```

### Opción 2: Correr Next.js TAMBIÉN en Docker (Producción)

Si quieres que Next.js también corra en Easypanel junto al worker:

**Dockerfile.nextjs** (nuevo):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

ENV TEMPORAL_ADDRESS=temporal-server:7233
ENV PORT=3000

CMD ["pnpm", "start"]
```

Luego en Easypanel:
- Crea un nuevo servicio para Next.js
- Usa el Dockerfile.nextjs
- Asegúrate de que esté en la misma red que temporal-server
- Expón el puerto 3000 con HTTPS

### Opción 3: Desarrollo Local con Temporal Local

Para desarrollo, puedes correr Temporal localmente:

```bash
# Instalar Temporal CLI
brew install temporal

# Correr servidor local
temporal server start-dev

# En .env
TEMPORAL_ADDRESS=localhost:7233
```

Esto te permite desarrollar sin depender del VPS.

### Opción 4: SSH Tunnel (Temporal)

Si no puedes exponer el puerto, crea un túnel SSH:

```bash
ssh -L 7233:temporal-server:7233 user@tu-vps
```

Luego en `.env`:
```bash
TEMPORAL_ADDRESS=localhost:7233
```

## 🎯 Recomendación para tu caso

Dado que:
- Ya tienes el worker corriendo en Docker ✅
- Temporal Web está expuesto ✅
- Solo necesitas que Next.js se conecte

**Te recomiendo la Opción 1**: Exponer el puerto 7233 en Easypanel.

## 📝 Pasos Siguientes

1. **Verifica en Easypanel** si puedes exponer el puerto 7233 del servicio `temporal-server`
2. **Configura el dominio** (ej: `tahan-temporal-grpc.0cguqx.easypanel.host`)
3. **Prueba la conexión**:
   ```bash
   nc -zv tahan-temporal-grpc.0cguqx.easypanel.host 7233
   ```
4. **Actualiza el .env** con la nueva dirección
5. **Re-ejecuta los tests**

## 🔧 Verificación Post-Configuración

Una vez expuesto el puerto, verifica:

```bash
# Test de conexión
telnet tahan-temporal-server.0cguqx.easypanel.host 7233

# O con netcat
nc -zv tahan-temporal-server.0cguqx.easypanel.host 7233
```

Si la conexión funciona, deberías poder ejecutar:
```bash
node test-temporal.js process-receipt
```

## ⚠️ Seguridad

El puerto 7233 de Temporal usa gRPC sin autenticación por defecto. Si lo expones públicamente, considera:

1. **Usar Temporal Cloud** (tiene autenticación integrada)
2. **Configurar mTLS** en Temporal
3. **Usar un VPN o IP whitelist**
4. **Proxy reverso con autenticación** (Nginx con auth)

Para desarrollo, está OK exponerlo temporalmente, pero en producción necesitas protegerlo.
