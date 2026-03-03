# Sybek

> Tu asistente de IA personal en el navegador. Potenciado por Cloudflare Workers AI + Anthropic.

Un asistente de IA nativo del navegador, de código abierto y cero infraestructura. Funciona completamente en una pestaña del navegador.

## Características

- 🤖 **Asistente de IA** - Chat con tu propio asistente personal
- 🌐 **Workers AI** - Potenciado por modelos de Cloudflare (Llama, Gemma)
- 📁 **Archivos** - Gestión de archivos en almacenamiento del navegador (OPFS)
- 📋 **Agentes** - Editor de AGENTS.md integrado con soporte para protocolo agentic
- 📅 **Tareas** - Programación de tareas con expresiones cron
- 📱 **Telegram** - Bot opcional para recibir/mandar mensajes
- 🔒 **Seguro** - Datos locales, clave API encriptada

## Inicio Rápido

```bash
cd sybek
npm install
npm run dev
```

Abre `http://localhost:5173`, configura tu API key de Anthropic en Settings, y comienza a chatear.

## Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  Navegador (PWA)                                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Chat   │  │  Files   │  │  Agents  │  │  Tasks  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┼─────────────┼──────────────┘     │
│                      ▼                                   │
│              Orchestrator                               │
│              ├── Cola de mensajes                        │
│              ├── Máquina de estados                      │
│              └── Programador de tareas                  │
│                      │                                   │
│          ┌───────────┼───────────┐                       │
│          ▼           ▼           ▼                       │
│     IndexedDB      OPFS    Agent Worker                  │
│     (mensajes,   (archivos  (Claude API                 │
│      tareas,      por grupo)  tool-use loop)             │
│      config)                                               │
│                                                          │
│  Canales:                                                │
│  ├── Chat en navegador                                   │
│  └── Telegram Bot API                                    │
└──────────────────────────────────────────────────────────┘
```

## Pestañas

| Tab | Descripción |
|-----|-------------|
| **Chat** | Conversa con tu asistente de IA |
| **Files** | Gestiona archivos del workspace |
| **Agents** | Edita AGENTS.md y configura el system prompt |
| **Tasks** | Programa tareas recurrentes con cron |
| **Settings** | Configura API key, modelo, nombre del asistente |

## Protocolo Agentic

Sybek implementa el protocolo [AGENTS.md](https://agents.md/):

1. **Editor AGENTS.md** - En la pestaña "Agents" puedes editar instrucciones para el agente
2. **System Prompt Personalizado** - Configura un system promptoverride
3. **Integración con Cloudflare** - Compatible con [Cloudflare Agents](https://agents.cloudflare.com/)

El contenido de AGENTES.md se carga automáticamente en el system prompt del agente.

## Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `bash` | Ejecuta comandos en una VM Linux (Alpine WASM) |
| `javascript` | Ejecuta código JS en un entorno aislado |
| `read_file` / `write_file` / `list_files` | Gestiona archivos en OPFS |
| `fetch_url` | Peticiones HTTP (sujeto a CORS) |
| `update_memory` | Persiste contexto en CLAUDE.md |
| `create_task` | Programa tareas con expresiones cron |

## Modelos Disponibles

- Llama 3.1 8B (Workers AI) - recomendado
- Llama 3 8B (Workers AI)
- Gemma 2 2B (Workers AI)

También puedes usar tu propia API key de Anthropic en Settings.

## Telegram (Opcional)

1. Crea un bot con `@BotFather` en Telegram
2. En Settings, pega el token del bot
3. Envía `/chatid` a tu bot para obtener el chat ID
4. Añade el chat ID en Settings
5. Los mensajes de Telegram se procesan igual que el chat del navegador

## Desarrollo

```bash
npm run dev        # Servidor dev con HMR
npm run build      # Build de producción → dist/
npm run preview   # Previsualizar build de producción
```

## Despliegue

```bash
npm run build
# Sube dist/ a cualquier hosting estático:
# Cloudflare Pages, GitHub Pages, Netlify, Vercel, etc.
```

## Seguridad

- Las API keys se encriptan con AES-256-GCM
- Todo el almacenamiento es local (IndexedDB, OPFS)
- Nada se envía a servidores externos excepto la API de Anthropic

## Repositorio

- GitHub: [developerjeremylive/sybek](https://github.com/developerjeremylive/sybek/)
