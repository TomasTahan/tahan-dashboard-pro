# Temporal Worker - Tahan Dashboard

Worker de Temporal para procesar workflows de boletas y gastos.

## 📋 Workflows disponibles

### 1. **process-receipt** (`processReceiptWorkflow`)
Procesa boletas/recibos subidos por conductores:
- Crea registro en Supabase
- Transcribe audio (si hay)
- Analiza imagen con IA
- Actualiza datos extraídos

### 2. **create-expense** (`createExpenseWorkflow`)
Crea gastos en Odoo desde boletas:
- Valida boleta
- Obtiene información del conductor
- Determina categoría automáticamente
- Crea gasto en Odoo
- Actualiza estado

## 🚀 Deployment en VPS

### 1. Preparar el entorno

```bash
# Clonar repositorio en el VPS
git clone <repo-url>
cd tahan-dashboard-pro/temporal

# Instalar dependencias
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` con:

```bash
# Temporal
TEMPORAL_ADDRESS=tahan-temporal.0cguqx.easypanel.host:7233
TEMPORAL_NAMESPACE=default

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-secret-key

# Odoo
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your-database
ODOO_USERNAME=your-user
ODOO_PASSWORD=your-password

# OpenAI
OPENAI_API_KEY=sk-...
```

### 3. Build y ejecutar

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

### 4. Ejecutar como servicio (systemd)

Crear archivo `/etc/systemd/system/tahan-worker.service`:

```ini
[Unit]
Description=Tahan Temporal Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/tahan-dashboard-pro/temporal
Environment=NODE_ENV=production
EnvironmentFile=/path/to/tahan-dashboard-pro/temporal/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tahan-worker
sudo systemctl start tahan-worker

# Ver logs
sudo journalctl -u tahan-worker -f
```

### 5. Docker (alternativa)

Crear `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar código necesario
COPY temporal ./temporal
COPY lib ./lib
COPY package.json tsconfig.json ./

WORKDIR /app/temporal

# Instalar dependencias
RUN npm install
RUN npm run build

CMD ["npm", "start"]
```

Ejecutar:
```bash
docker build -t tahan-worker .
docker run -d \
  --name tahan-worker \
  --env-file .env \
  --restart unless-stopped \
  tahan-worker
```

## 🔍 Monitoreo

Ver workflows ejecutándose en el dashboard de Temporal:
https://tahan-temporal-web.0cguqx.easypanel.host/namespaces/default/workflows

## 📝 Logs

El worker imprime logs detallados:
- ✅ Conexión establecida
- 📋 Task queue escuchando
- 🔍 Actividades ejecutándose
- ❌ Errores y reintentos

## 🛠 Troubleshooting

### Worker no se conecta
```bash
# Verificar que Temporal esté accesible
nc -zv tahan-temporal.0cguqx.easypanel.host 7233
```

### Actividades fallan
- Verificar variables de entorno (Supabase, Odoo, OpenAI)
- Revisar logs del worker
- Ver detalles en el dashboard de Temporal

### Build falla
```bash
# Verificar que @/lib se resuelva correctamente
npm run build -- --verbose
```

## 📦 Estructura

```
temporal/
├── workflows/          # Definición de workflows
├── activities/         # Actividades (lógica de negocio)
├── worker.ts           # Entry point del worker
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Actualizar código

```bash
cd /path/to/tahan-dashboard-pro
git pull
cd temporal
npm install
npm run build
sudo systemctl restart tahan-worker
```
