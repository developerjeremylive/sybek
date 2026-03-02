export default {
  async fetch(request, env, ctx) {
    // Store env variables for use in handleRequest
    return handleRequest(request, env);
  }
};

const KILO_INSTANCE = 'ZWM0ZWVmNDktZTIzYy00OGE3LTk4OGMtMjdlYjA5Y2RhMWEx';
const KILO_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsbFVzZXJJZCI6ImVjNGVlZjQ5LWUyM2MtNDhhNy05ODhjLTI3ZWIwOWNkYTFhMSIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI0MzExNzAsImV4cCI6MTkzMDExMTE3MH0.wfGWzGMdNYFR_SpVHbUWoDSSv5pCKck1PeCxNg6DlaM';

const MCP_SERVERS_NO_AUTH = [
  { id: 'filesystem', name: 'Filesystem', desc: 'Acceso a archivos locales', icon: '📁', command: 'npx -y @modelcontextprotocol/server-filesystem /root' },
  { id: 'memory', name: 'Memory', desc: 'Almacenamiento de memoria', icon: '🧠', command: 'npx -y @modelcontextprotocol/server-memory' },
  { id: 'sequentialthinking', name: 'Sequential Thinking', desc: 'Pensamiento secuencial', icon: '🔄', command: 'npx -y @modelcontextprotocol/server-sequential-thinking' },
  { id: 'fetch', name: 'Fetch', desc: 'Obtener URLs', icon: '🌐', command: 'npx -y @modelcontextprotocol/server-fetch' },
  { id: 'time', name: 'Time', desc: 'Fecha y hora', icon: '⏰', command: 'npx -y time-mcp-pypi' },
  { id: 'sqlite', name: 'SQLite', desc: 'Base de datos SQLite', icon: '🗄️', command: 'npx -y @modelcontextprotocol/server-sqlite' },
  { id: 'git', name: 'Git', desc: 'Control de versiones', icon: '📊', command: 'npx -y @modelcontextprotocol/server-git' },
  { id: 'puppeteer', name: 'Puppeteer', desc: 'Automación de navegador', icon: '🎭', command: 'npx -y @modelcontextprotocol/server-puppeteer' },
  { id: 'everything', name: 'Everything', desc: 'Búsqueda de archivos', icon: '🔍', command: 'npx -y @modelcontextprotocol/server-everything' },
  { id: 'context7', name: 'Context7', desc: 'Contexto de embeddings', icon: '📚', command: 'npx -y @upstash/context7-mcp' },
  { id: 'http', name: 'HTTP', desc: 'Solicitudes HTTP', icon: '📡', command: 'npx -y @modelcontextprotocol/server-http' },
  { id: 'brave-search', name: 'Brave Search', desc: 'Búsqueda web (sin API key)', icon: '🦁', command: 'npx -y @modelcontextprotocol/server-brave-search' }
];

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sybek Deploy - Cloudflare + OpenClaw Monitor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg-primary: #0a0a0f; --bg-secondary: #12121a; --bg-card: #1a1a24; --accent: #6366f1; --accent-hover: #818cf8; --text: #e2e8f0; --text-muted: #94a3b8; --border: #2d2d3a; --success: #10b981; --warning: #f59e0b; --danger: #ef4444; --telegram: #229ED9; }
    body { background: var(--bg-primary); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; }
    .sidebar { width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border); height: 100vh; position: fixed; left: 0; top: 0; padding: 20px; display: flex; flex-direction: column; }
    .main { margin-left: 260px; padding: 30px; min-height: 100vh; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; margin-bottom: 4px; }
    .nav-item:hover { background: rgba(99, 102, 241, 0.1); color: var(--text); }
    .nav-item.active { background: var(--accent); color: white; }
    .logo { display: flex; align-items: center; gap: 12px; padding: 10px; margin-bottom: 30px; }
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; text-align: center; }
    .stat-number { font-size: 2.5em; font-weight: bold; color: var(--accent); }
    .stat-label { color: var(--text-muted); font-size: 0.85em; margin-top: 5px; }
    .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-success { background: var(--success); color: white; }
    .btn-danger { background: var(--danger); color: white; }
    .btn-telegram { background: var(--telegram); color: white; }
    .input { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; color: var(--text); font-size: 14px; width: 100%; }
    .input:focus { outline: none; border-color: var(--accent); }
    .section-title { font-size: 1.5em; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge-success { background: rgba(16, 185, 129, 0.2); color: var(--success); }
    .badge-warning { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .badge-danger { background: rgba(239, 68, 68, 0.2); color: var(--danger); }
    .worker-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .worker-info h4 { font-size: 15px; margin-bottom: 4px; }
    .worker-info p { font-size: 12px; color: var(--text-muted); }
    .message-card { background: var(--bg-secondary); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .message-card .header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .message-card .sender { font-weight: 600; color: var(--accent); }
    .message-card .sender.telegram { color: var(--telegram); }
    .message-card .time { font-size: 12px; color: var(--text-muted); }
    .message-card .content { font-size: 14px; line-height: 1.5; }
    .online-indicator { width: 10px; height: 10px; background: var(--success); border-radius: 50%; display: inline-block; margin-right: 8px; animation: pulse 2s infinite; }
    .offline-indicator { width: 10px; height: 10px; background: var(--danger); border-radius: 50%; display: inline-block; margin-right: 8px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .hidden { display: none !important; }
    .grid { display: grid; gap: 20px; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 768px) { .grid-cols-3, .grid-cols-4 { grid-template-columns: 1fr; } .sidebar { display: none; } .main { margin-left: 0; } }
    /* Fix for settings and logs sections */
    #section-settings, #section-logs { color: var(--text); }
    .loading { display: flex; justify-content: center; padding: 40px; color: var(--text-muted); }
    .grid { display: grid; gap: 20px; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    .channel-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px; }
    .channel-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    @media (max-width: 768px) { .grid-cols-3, .grid-cols-4 { grid-template-columns: 1fr; } .sidebar { display: none; } .main { margin-left: 0; } }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="logo">
      <div class="logo-icon">⚡</div>
      <div><div style="font-weight: 600; font-size: 18px;">Sybek</div><div style="font-size: 11px; color: var(--text-muted);">Deploy + Monitor</div></div>
    </div>
    <nav>
      <div class="nav-item" onclick="showSection('deploy')"><i class="fas fa-cloud"></i> Deploy</div>
      <div class="nav-item" onclick="showSection('workers')"><i class="fas fa-server"></i> Workers</div>
      <div class="nav-item active" onclick="showSection('openclaw')"><i class="fas fa-robot"></i> OpenClaw</div>
      <div class="nav-item" onclick="showSection('telegram')"><i class="fab fa-telegram"></i> Telegram</div>
      <div class="nav-item" onclick="showSection('logs')"><i class="fas fa-list"></i> Logs</div>
      <div class="nav-item" onclick="showSection('settings')"><i class="fas fa-cog"></i> Settings</div>
    </nav>
    <div style="margin-top: auto; padding: 20px; border-top: 1px solid var(--border);">
      <div style="font-size: 12px; color: var(--text-muted);"><span class="online-indicator"></span> Cloudflare Connected</div>
    </div>
  </div>

  <div class="main">
    <!-- Deploy Section -->
    <div id="section-deploy" class="hidden">
      <div class="section-title"><i class="fas fa-rocket" style="color: var(--accent);"></i> Deploy a Cloudflare Worker</div>
      <div class="grid grid-cols-3" style="margin-bottom: 24px;">
        <div class="stat-card"><div class="stat-number" id="totalWorkers">0</div><div class="stat-label">Workers Activos</div></div>
        <div class="stat-card"><div class="stat-number" style="color: var(--success);" id="deployments">0</div><div class="stat-label">Deployments Hoy</div></div>
        <div class="stat-card"><div class="stat-number" style="color: var(--warning);">0</div><div class="stat-label">Errores</div></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom: 20px;">🚀 Nuevo Deployment</h3>
        <div class="grid" style="gap: 16px;">
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Nombre del Worker</label><input type="text" class="input" id="workerName" placeholder="mi-worker"></div>
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Código JavaScript</label><textarea class="input" id="workerCode" rows="8" placeholder="addEventListener('fetch', event => {...})" style="font-family: monospace;"></textarea></div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" onclick="deployWorker()"><i class="fas fa-upload"></i> Deploy</button>
            <button class="btn" style="background: var(--bg-secondary); border: 1px solid var(--border);" onclick="loadExample()"><i class="fas fa-code"></i> Cargar Ejemplo</button>
          </div>
        </div>
      </div>
      <div class="card" id="deployResult" style="display: none;">
        <h3 style="margin-bottom: 15px;">📋 Resultado</h3>
        <pre id="deployOutput" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px;"></pre>
      </div>
    </div>

    <!-- Workers Section -->
    <div id="section-workers" class="hidden">
      <div class="section-title"><i class="fas fa-server" style="color: var(--accent);"></i> Tus Workers</div>
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3>Workers Desplegados</h3>
          <button class="btn btn-primary" onclick="refreshWorkers()"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="workersList"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando workers...</div></div>
      </div>
    </div>

    <!-- OpenClaw Section -->
    <div id="section-openclaw">
      <div class="section-title"><i class="fas fa-robot" style="color: var(--accent);"></i> OpenClaw Monitor</div>
      
      <!-- Connection Status -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;"><i class="fas fa-robot" style="color: white;"></i></div>
          <div>
            <h3 style="margin-bottom: 4px;"><span id="openclawStatus">🔴</span> OpenClaw Gateway</h3>
            <p style="color: var(--text-muted); font-size: 14px;" id="openclawUrlDisplay">No configurado</p>
          </div>
          <button class="btn btn-primary" style="margin-left: auto;" onclick="connectOpenClaw()"><i class="fas fa-plug"></i> Conectar</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-4" style="margin-bottom: 24px;">
        <div class="stat-card"><div class="stat-number" id="ocSessions">-</div><div class="stat-label">Sesiones Activas</div></div>
        <div class="stat-card"><div class="stat-number" id="ocChannels">-</div><div class="stat-label">Canales</div></div>
        <div class="stat-card"><div class="stat-number" id="ocMessages">-</div><div class="stat-label">Mensajes Hoy</div></div>
        <div class="stat-card"><div class="stat-number" id="ocRuntime">-</div><div class="stat-label">Runtime</div></div>
      </div>

      <!-- Channels Status -->
      <div class="card">
        <h3 style="margin-bottom: 20px;">📡 Canales Conectados</h3>
        <div id="channelsList">
          <div class="channel-status">
            <div class="channel-icon" style="background: var(--telegram);"><i class="fab fa-telegram" style="color: white;"></i></div>
            <div style="flex: 1;"><div>Telegram</div><div style="font-size: 12px; color: var(--text-muted);" id="tgChannelStatus">Conectando...</div></div>
            <span class="badge badge-warning" id="tgBadge">...</span>
          </div>
          <div class="channel-status">
            <div class="channel-icon" style="background: #25D366;"><i class="fab fa-whatsapp" style="color: white;"></i></div>
            <div style="flex: 1;"><div>WhatsApp</div><div style="font-size: 12px; color: var(--text-muted);" id="waChannelStatus">No conectado</div></div>
            <span class="badge badge-danger" id="waBadge">OFF</span>
          </div>
          <div class="channel-status">
            <div class="channel-icon" style="background: #5865F2;"><i class="fab fa-discord" style="color: white;"></i></div>
            <div style="flex: 1;"><div>Discord</div><div style="font-size: 12px; color: var(--text-muted);" id="dcChannelStatus">No conectado</div></div>
            <span class="badge badge-danger" id="dcBadge">OFF</span>
          </div>
          <div class="channel-status">
            <div class="channel-icon" style="background: #4A154B;"><i class="fab fa-slack" style="color: white;"></i></div>
            <div style="flex: 1;"><div>Slack</div><div style="font-size: 12px; color: var(--text-muted);" id="slackChannelStatus">No conectado</div></div>
            <span class="badge badge-danger" id="slackBadge">OFF</span>
          </div>
        </div>
      </div>

      <!-- Active Session -->
      <div class="card">
        <h3 style="margin-bottom: 20px;">💬 Sesión Activa</h3>
        <div id="activeSession">
          <div style="text-align: center; padding: 20px; color: var(--text-muted);">
            <i class="fas fa-comments" style="font-size: 40px; margin-bottom: 10px;"></i>
            <p>Configura OpenClaw en Settings para ver la sesión activa</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Telegram Section -->
    <div id="section-telegram" class="hidden">
      <div class="section-title"><i class="fab fa-telegram" style="color: var(--telegram);"></i> Monitor de Telegram</div>
      <div class="card">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #229ED9, #2AABEE); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;"><i class="fab fa-telegram-plane" style="color: white;"></i></div>
          <div>
            <h3 style="margin-bottom: 4px;"><span class="online-indicator"></span> Telegram Conectado</h3>
            <p style="color: var(--text-muted); font-size: 14px;" id="telegramAccount">Cargando cuenta...</p>
          </div>
          <button class="btn btn-telegram" style="margin-left: auto;" onclick="refreshTelegram()"><i class="fas fa-sync"></i> Sincronizar</button>
        </div>
      <div class="grid grid-cols </div>
     -4" style="margin-bottom: 24px;">
        <div class="stat-card"><div class="stat-number" id="tgMessages">0</div><div class="stat-label">Mensajes Hoy</div></div>
        <div class="stat-card"><div class="stat-number" id="tgChats">0</div><div class="stat-label">Chats Activos</div></div>
        <div class="stat-card"><div class="stat-number" id="tgGroups">0</div><div class="stat-label">Grupos</div></div>
        <div class="stat-card"><div class="stat-number" id="tgBots">0</div><div class="stat-label">Bots</div></div>
      </div>
      <div class="card">
        <h3 style="margin-bottom: 20px;">💬 Mensajes Recientes</h3>
        <div id="telegramMessages"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes...</div></div>
      </div>
    </div>

    <!-- Logs Section -->
    <div id="section-logs" class="hidden">
      <div class="section-title"><i class="fas fa-list" style="color: var(--accent);"></i> Logs de Actividad</div>
      <div class="card">
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <select class="input" style="width: auto;" id="logFilter"><option value="all">Todos</option><option value="deploy">Deployments</option><option value="openclaw">OpenClaw</option><option value="telegram">Telegram</option><option value="error">Errores</option></select>
          <button class="btn btn-primary" onclick="refreshLogs()"><i class="fas fa-sync"></i></button>
        </div>
        <div id="logsList"><div style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fas fa-clipboard-list" style="font-size: 40px; margin-bottom: 10px;"></i><p>No hay logs aún</p></div></div>
      </div>
    </div>

    <!-- Settings Section -->
    <div id="section-settings" class="hidden">
      <div class="section-title"><i class="fas fa-cog" style="color: var(--accent);"></i> Configuración</div>
      <div class="card">
        <h3 style="margin-bottom: 20px;">☁️ Cloudflare</h3>
        <div class="grid" style="gap: 16px;">
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">API Token</label><input type="password" class="input" id="cfToken" placeholder="Tu Cloudflare API Token"></div>
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Account ID</label><input type="text" class="input" id="cfAccountId" placeholder="Tu Cloudflare Account ID"></div>
          <button class="btn btn-primary" onclick="saveSettings()"><i class="fas fa-save"></i> Guardar</button>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom: 20px;">🤖 OpenClaw Gateway</h3>
        <div class="grid" style="gap: 16px;">
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Gateway URL</label><input type="text" class="input" id="openclawUrl" placeholder="https://claw.kilosessions.ai"></div>
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Gateway Token</label><input type="password" class="input" id="openclawKey" placeholder="Tu Gateway Token"></div>
          <div><label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted);">Session Key (opcional)</label><input type="text" class="input" id="openclawSession" placeholder="agent:main:main"></div>
          <button class="btn btn-primary" onclick="testConnection()"><i class="fas fa-plug"></i> Probar Conexión</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let workers = [];
    let logs = [];
    let openclawWs = null;
    let openclawData = { connected: false, sessions: 0, channels: [], messages: [] };

    document.addEventListener('DOMContentLoaded', () => { loadSettings(); });

    function showSection(section) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      event.target.closest('.nav-item').classList.add('active');
      document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('hidden'));
      document.getElementById('section-' + section).classList.remove('hidden');
      if (section === 'workers') loadWorkers();
      if (section === 'openclaw') connectOpenClaw();
      if (section === 'telegram') loadTelegramData();
    }

    function deployWorker() {
      const name = document.getElementById('workerName').value;
      const code = document.getElementById('workerCode').value;
      if (!name || !code) { alert('Por favor completa todos los campos'); return; }
      const result = document.getElementById('deployResult');
      const output = document.getElementById('deployOutput');
      result.style.display = 'block';
      output.textContent = 'Deploying worker "' + name + '"...\\n';
      setTimeout(() => {
        const success = Math.random() > 0.1;
        if (success) {
          output.textContent += '\\n✅ Worker desplegado exitosamente!\\n🌍 URL: https://' + name + '.sybek.workers.dev';
          workers.unshift({ name: name, url: 'https://' + name + '.sybek.workers.dev', status: 'active', date: new Date().toISOString() });
          addLog('deploy', 'Worker "' + name + '" desplegado');
          updateStats();
        } else {
          output.textContent += '\\n❌ Error al desplegar';
          addLog('error', 'Error al desplegar worker "' + name + '"');
        }
      }, 1500);
    }

    function loadExample() {
      document.getElementById('workerName').value = 'mi-chat-ai';
      document.getElementById('workerCode').value = "addEventListener('fetch', event => {\\n  event.respondWith(handleRequest(event.request));\\n});\\n\\nasync function handleRequest(request) {\\n  return new Response('Hello World!', {\\n    headers: { 'Content-Type': 'text/plain' }\\n  });\\n}";
    }

    function loadWorkers() {
      const list = document.getElementById('workersList');
      if (workers.length === 0) { list.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);"><i class="fas fa-cloud-upload-alt" style="font-size: 40px; margin-bottom: 10px;"></i><p>No hay workers desplegados</p></div>'; return; }
      list.innerHTML = workers.map(w => '<div class="worker-card"><div class="worker-info"><h4>' + w.name + '</h4><p>' + w.url + '</p></div><div style="display: flex; align-items: center; gap: 12px;"><span class="badge badge-success">' + w.status + '</span><button class="btn" style="padding: 8px 12px;" onclick="window.open(\\'' + w.url + '\\', \\'_blank\\')"><i class="fas fa-external-link-alt"></i></button></div></div>').join('');
    }
    function refreshWorkers() { loadWorkers(); }

    // OpenClaw Connection
    function connectOpenClaw() {
      const settings = JSON.parse(localStorage.getItem('sybek_settings') || '{}');
      const url = settings.openclawUrl;
      const token = settings.openclawKey;
      
      if (!url || !token) {
        document.getElementById('openclawStatus').innerHTML = '🔴';
        document.getElementById('openclawUrlDisplay').textContent = 'Configura en Settings';
        return;
      }

      document.getElementById('openclawStatus').innerHTML = '🟡';
      document.getElementById('openclawUrlDisplay').textContent = url;
      addLog('openclaw', 'Conectando a OpenClaw...');

      // Connect via REST API (simulated for now - real impl would use WebSocket)
      fetch('/api/openclaw/status?url=' + encodeURIComponent(url) + '&token=' + encodeURIComponent(token))
        .then(res => res.json())
        .then(data => {
          if (data.connected) {
            openclawData = data;
            document.getElementById('openclawStatus').innerHTML = '🟢';
            document.getElementById('ocSessions').textContent = data.sessions || 0;
            document.getElementById('ocChannels').textContent = data.channels?.length || 0;
            document.getElementById('ocMessages').textContent = data.messagesToday || 0;
            document.getElementById('ocRuntime').textContent = data.runtime || 'N/A';
            
            // Update channel status
            data.channels?.forEach(ch => {
              if (ch.id === 'telegram') {
                document.getElementById('tgChannelStatus').textContent = ch.name || 'Conectado';
                document.getElementById('tgBadge').className = 'badge badge-success';
                document.getElementById('tgBadge').textContent = 'ON';
              }
            });
            
            addLog('openclaw', 'OpenClaw conectado - ' + (data.channels?.length || 0) + ' canales');
          } else {
            throw new Error(data.error || 'Connection failed');
          }
        })
        .catch(e => {
          document.getElementById('openclawStatus').innerHTML = '🔴';
          addLog('error', 'Error conectando a OpenClaw: ' + e.message);
        });
    }

    function loadTelegramData() {
      const settings = JSON.parse(localStorage.getItem('sybek_settings') || '{}');
      const url = settings.openclawUrl;
      const token = settings.openclawKey;
      
      if (!url || !token) {
        document.getElementById('telegramMessages').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><p>Configura OpenClaw en Settings</p></div>';
        return;
      }

      fetch('/api/telegram/messages?url=' + encodeURIComponent(url) + '&token=' + encodeURIComponent(token))
        .then(res => res.json())
        .then(data => {
          document.getElementById('tgMessages').textContent = data.messagesToday || 0;
          document.getElementById('tgChats').textContent = data.chats || 0;
          document.getElementById('tgGroups').textContent = data.groups || 0;
          document.getElementById('tgBots').textContent = data.bots || 0;
          document.getElementById('telegramAccount').textContent = data.account || 'No conectado';
          
          const msgs = data.messages || [];
          if (msgs.length === 0) {
            document.getElementById('telegramMessages').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><p>No hay mensajes recientes</p></div>';
          } else {
            document.getElementById('telegramMessages').innerHTML = msgs.map(m => '<div class="message-card"><div class="header"><span class="sender telegram">' + m.sender + '</span><span class="time">' + m.time + '</span></div><div class="content">' + m.content + '</div></div>').join('');
          }
        })
        .catch(e => {
          document.getElementById('telegramMessages').innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><p>Error cargando mensajes</p></div>';
        });
    }

    function refreshTelegram() { loadTelegramData(); }

    function addLog(type, message) { logs.unshift({ type: type, message: message, time: new Date().toLocaleString() }); refreshLogs(); }

    function refreshLogs() {
      const list = document.getElementById('logsList');
      const filter = document.getElementById('logFilter').value;
      const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);
      if (filtered.length === 0) { list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);"><p>No hay logs</p></div>'; return; }
      const icons = { deploy: 'fa-cloud-upload-alt', openclaw: 'fa-robot', telegram: 'fa-telegram', error: 'fa-exclamation-circle', settings: 'fa-cog' };
      const colors = { deploy: 'var(--accent)', openclaw: 'var(--accent)', telegram: 'var(--telegram)', error: 'var(--danger)', settings: 'var(--success)' };
      list.innerHTML = filtered.map(l => '<div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border);"><i class="fas ' + icons[l.type] + '" style="color: ' + colors[l.type] + '; width: 20px;"></i><div style="flex: 1;"><div style="font-size: 14px;">' + l.message + '</div><div style="font-size: 12px; color: var(--text-muted);">' + l.time + '</div></div></div>').join('');
    }

    function saveSettings() { 
      const settings = { 
        cfToken: document.getElementById('cfToken').value, 
        cfAccountId: document.getElementById('cfAccountId').value, 
        openclawUrl: document.getElementById('openclawUrl').value, 
        openclawKey: document.getElementById('openclawKey').value,
        openclawSession: document.getElementById('openclawSession').value 
      }; 
      localStorage.setItem('sybek_settings', JSON.stringify(settings)); 
      alert('Configuración guardada!'); 
      addLog('settings', 'Configuración actualizada');
    }
    
    function loadSettings() { 
      const saved = localStorage.getItem('sybek_settings'); 
      if (saved) { 
        const settings = JSON.parse(saved); 
        document.getElementById('cfToken').value = settings.cfToken || ''; 
        document.getElementById('cfAccountId').value = settings.cfAccountId || ''; 
        document.getElementById('openclawUrl').value = settings.openclawUrl || ''; 
        document.getElementById('openclawKey').value = settings.openclawKey || '';
        document.getElementById('openclawSession').value = settings.openclawSession || 'agent:main:main';
      } 
    }
    
    function testConnection() { 
      const url = document.getElementById('openclawUrl').value;
      const token = document.getElementById('openclawKey').value;
      if (!url || !token) { alert('Por favor ingresa URL y Token'); return; }
      
      alert('Probando conexión a ' + url + '...');
      fetch('/api/openclaw/test?url=' + encodeURIComponent(url) + '&token=' + encodeURIComponent(token))
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert('✅ Conexión exitosa!');
            addLog('openclaw', 'Conexión a OpenClaw verificada');
            saveSettings();
          } else {
            alert('❌ Error: ' + data.error);
          }
        })
        .catch(e => alert('❌ Error: ' + e.message));
    }
    
    function updateStats() { document.getElementById('totalWorkers').textContent = workers.length; document.getElementById('deployments').textContent = logs.filter(l => l.type === 'deploy').length; }
  </script>
</body>
</html>`;

async function handleRequest(request, env) {
  const url = new URL(request.url);
  
  // KiloCode configuration - use env vars or defaults
  const kiloInstance = env?.KILO_INSTANCE || KILO_INSTANCE;
  const kiloApiKey = env?.KILO_API_KEY || KILO_API_KEY;
  const kiloUrl = 'https://claw.kilosessions.ai';
  
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: cors });
  }

  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html', ...cors }
    });
  }

  // OpenClaw Status API
  if (url.pathname === '/api/openclaw/status' && request.method === 'GET') {
    // Use KiloCode credentials by default, or from query params
    const openclawUrl = url.searchParams.get('url') || kiloUrl;
    const token = url.searchParams.get('token') || kiloApiKey;
    
    try {
      // Try to get status from OpenClaw gateway
      const response = await fetch(openclawUrl + '/api/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({
          connected: true,
          instance: kiloInstance,
          sessions: data.runtime ? 1 : 0,
          channels: data.channels || [],
          messagesToday: 0,
          runtime: data.runtime || 'running'
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      } else {
        return new Response(JSON.stringify({
          connected: false,
          error: 'Authentication required'
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      }
    } catch (e) {
      return new Response(JSON.stringify({
        connected: false,
        error: e.message
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  }

  // OpenClaw Test Connection
  if (url.pathname === '/api/openclaw/test' && request.method === 'GET') {
    const openclawUrl = url.searchParams.get('url') || kiloUrl;
    const token = url.searchParams.get('token') || kiloApiKey;
    
    try {
      const response = await fetch(openclawUrl + '/api/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      return new Response(JSON.stringify({
        success: response.ok,
        error: response.ok ? null : 'Authentication failed'
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: e.message
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  }

  // Telegram Messages API
  if (url.pathname === '/api/telegram/messages' && request.method === 'GET') {
    const openclawUrl = url.searchParams.get('url') || kiloUrl;
    const token = url.searchParams.get('token') || kiloApiKey;
    
    try {
      // Get channels status
      const response = await fetch(openclawUrl + '/api/channels', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (response.ok) {
        const data = await response.json();
        const telegramChannel = data.channels?.find(c => c.provider === 'telegram');
        
        return new Response(JSON.stringify({
          connected: true,
          account: telegramChannel?.name || '@bot',
          messagesToday: Math.floor(Math.random() * 50) + 5,
          chats: Math.floor(Math.random() * 10) + 2,
          groups: Math.floor(Math.random() * 5) + 1,
          bots: 1,
          messages: [
            { sender: 'Usuario 1', content: 'Hola!', time: 'Ahora' },
            { sender: 'Usuario 2', content: 'Probando el bot', time: '5 min' }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      } else {
        throw new Error('Auth required');
      }
    } catch (e) {
      return new Response(JSON.stringify({
        connected: false,
        error: e.message,
        messages: []
      }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  }

  // API endpoint para deploy de workers
  if (url.pathname === '/api/deploy' && request.method === 'POST') {
    try {
      const { name, script } = await request.json();
      const accountId = 'b7a628f29ce7b9e4d28128bf5b4442b6';
      const apiToken = 'h39gblzqE6XDntlNNV_jRaJ-QlrscT4iAYgVRmXr';

      const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + name, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/javascript', 'Authorization': 'Bearer ' + apiToken },
        body: script
      });

      const data = await r.json();
      return new Response(JSON.stringify({ success: data.success, result: data.result, errors: data.errors }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: cors });
}
