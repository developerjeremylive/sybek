# Sybek - OpenClaw Workspace

> Workspace de OpenClaw con herramientas de IA y Cloudflare Workers

## 🚀 Descripción

Sybek es un entorno de trabajo personal basado en **OpenClaw** que incluye:

- **Chat AI** - Interfaz web para conversar con modelos de IA via Cloudflare Workers AI
- **MCP Dashboard** - Panel para gestionar servidores MCP (Model Context Protocol)
- **Cloudflare Worker** - Deployment serverless con Wrangler

## 📁 Estructura

```
├── worker.js              # Cloudflare Worker principal (Chat AI + MCPs)
├── mcp-dashboard.html      # Panel de control MCP
├── mcp-dashboard-server.js # Servidor del dashboard
├── mcp-proxy-server.js    # Proxy para MCP
├── playground.html        # Playground de pruebas
├── wrangler.jsonc         # Configuración de Wrangler
├── config/                # Archivos de configuración
├── skills/                # Skills de OpenClaw
├── memory/                # Notas y memoria
└── .openclaw/             # Configuración de OpenClaw
```

## 🛠️ Cloudflare Worker

El worker (`worker.js`) proporciona:

### Chat AI
- Interfaz de chat responsive con Tailwind CSS
- Selección de modelos de IA (Llama, Gemma, DeepSeek, Qwen, Mistral)
- Soporte para múltiples servidores MCP
- Diseño oscuro moderno

### Modelos Disponibles
- **Meta**: Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout
- **Google**: Gemma 3 4B, Gemma 3 12B
- **DeepSeek**: DeepSeek R1
- **Qwen**: Qwen 2.5 7B, Qwen 2.5 Coder
- **Mistral**: Mistral 7B, Mistral Small 3.1

### MCPs Soportados (sin credenciales)
- Filesystem - Acceso a archivos
- Memory - Almacenamiento de memoria
- Sequential Thinking - Pensamiento secuencial
- Fetch - Obtener URLs
- Time - Fecha y hora
- SQLite - Base de datos
- Git - Control de versiones
- Puppeteer - Automación de navegador
- Everything - Búsqueda de archivos
- Context7 - Contexto de embeddings
- HTTP - Solicitudes HTTP
- Brave Search - Búsqueda web

## 📦 Deployment

### Requisitos
- Node.js 18+
- Cuenta de Cloudflare
- Wrangler CLI (`npm install -g wrangler`)

### Variables de Entorno
```bash
# Copiar ejemplo
cp .env.example .env

# Editar con tus credenciales
CF_API_TOKEN=your_token
CF_ACCOUNT_ID=your_account_id
```

### Deploy
```bash
# Development
wrangler dev

# Production
wrangler deploy
```

## 🎨 Características

- **UI Moderna** - Diseño oscuro con Tailwind CSS
- **Responsive** - Funciona en móvil y desktop
- **CORS enabled** - API accesible desde cualquier origen
- **Streaming** - Respuestas en tiempo real (próximamente)

## 📄 Licencia

MIT

---

🤖 Powered by [OpenClaw](https://github.com/openclaw/openclaw)
