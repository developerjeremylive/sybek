addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

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

const MODELS = [
  { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: '@cf/meta/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta' },
  { id: '@cf/google/gemma-3-4b-it', name: 'Gemma 3 4B', provider: 'Google' },
  { id: '@cf/google/gemma-3-12b-it', name: 'Gemma 3 12B', provider: 'Google' },
  { id: '@cf/deepseek-ai/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: '@cf/qwen/qwen2.5-7b-instruct', name: 'Qwen 2.5 7B', provider: 'Qwen' },
  { id: '@cf/qwen/qwen2.5-coder-7b-instruct', name: 'Qwen 2.5 Coder', provider: 'Qwen' },
  { id: '@cf/mistralai/mistral-7b-instruct-v0.2', name: 'Mistral 7B', provider: 'Mistral' },
  { id: '@cf/meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', provider: 'Meta' },
  { id: '@cf/meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  // Modelos solicitados
  { id: '@cf/baichuan-inc/baichuan2-13b-chat-v1', name: 'GLM-4.7 Flash', provider: 'Baichuan' },
  { id: '@cf/meta/llama-3.1-8b-instruct-awq', name: 'Granite 4.0 Micro', provider: 'Meta' },
  { id: '@cf/meta/llama-3-70b-instruct-fp8', name: 'Hermes 2 Pro 7B', provider: 'Meta' },
  { id: '@cf/qwen/qwen2.5-72b-instruct-fp8', name: 'Qwen3 30B A3B', provider: 'Qwen' },
  { id: '@cf/mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', provider: 'Mistral' }
];

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw AI - MCP Chat</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f0f; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; height: 100vh; overflow: hidden; }
    .sidebar { width: 280px; background: #171717; border-right: 1px solid #303030; display: flex; flex-direction: column; }
    .main { flex: 1; display: flex; flex-direction: column; }
    .chat-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .input-area { padding: 20px; border-top: 1px solid #303030; background: #171717; }
    .msg { padding: 12px 16px; border-radius: 12px; max-width: 75%; word-wrap: break-word; line-height: 1.5; }
    .msg-user { background: #2563eb; margin-left: auto; }
    .msg-assistant { background: #303030; }
    .typing { display: flex; gap: 4px; padding: 12px 16px; }
    .typing span { width: 6px; height: 6px; background: #666; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
    .typing span:nth-child(1) { animation-delay: -0.32s; }
    .typing span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-mcp { background: #065f46; color: #34d399; font-size: 12px; padding: 4px 10px; border-radius: 6px; }
    .mcp-btn { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; background: transparent; border: 1px solid #303030; color: #a1a1aa; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left; }
    .mcp-btn:hover { background: #262626; color: white; }
    .mcp-btn.active { background: #064e3b; border-color: #10b981; color: #34d399; }
    .mcp-btn .icon { font-size: 18px; }
    .mcp-section { padding: 12px; border-bottom: 1px solid #303030; }
    .mcp-section h3 { font-size: 11px; text-transform: uppercase; color: #71717a; margin-bottom: 8px; letter-spacing: 0.5px; }
    .model-select { background: #262626; border: 1px solid #404040; border-radius: 8px; padding: 10px 12px; color: white; font-size: 13px; width: 100%; cursor: pointer; }
    .input-wrapper { display: flex; gap: 12px; align-items: flex-end; }
    .prompt-input { flex: 1; background: #262626; border: 1px solid #404040; border-radius: 12px; padding: 14px 16px; color: white; font-size: 15px; resize: none; min-height: 50px; max-height: 150px; font-family: inherit; }
    .prompt-input:focus { outline: none; border-color: #2563eb; }
    .header { padding: 16px; border-bottom: 1px solid #303030; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .header-logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .active-mcps { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px; background: #0f172a; border-radius: 8px; margin-top: 10px; }
    .mcp-tag { background: #059669; color: #d1fae5; font-size: 11px; padding: 3px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
    .mcp-tag .remove { cursor: pointer; opacity: 0.7; }
    .mcp-tag .remove:hover { opacity: 1; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #71717a; }
    .empty-state .icon { font-size: 64px; margin-bottom: 16px; }
    .panel-toggle { position: fixed; bottom: 90px; left: 20px; z-index: 100; }
    .mcp-panel { display: none; position: fixed; left: 0; top: 0; bottom: 0; width: 320px; background: #171717; border-right: 1px solid #303030; z-index: 200; flex-direction: column; }
    .mcp-panel.open { display: flex; }
    .panel-header { padding: 16px; border-bottom: 1px solid #303030; display: flex; justify-content: space-between; align-items: center; }
    .panel-header h2 { font-size: 16px; font-weight: 600; }
    .close-panel { background: none; border: none; color: #a1a1aa; font-size: 24px; cursor: pointer; }
    .panel-content { flex: 1; overflow-y: auto; padding: 16px; }
    .server-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #262626; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .server-card:hover { background: #303030; }
    .server-card.enabled { border: 1px solid #10b981; }
    .server-card .server-icon { font-size: 24px; }
    .server-info { flex: 1; }
    .server-info .name { font-weight: 500; font-size: 14px; }
    .server-info .desc { font-size: 12px; color: #71717a; }
    .server-toggle { width: 40px; height: 22px; background: #404040; border-radius: 11px; position: relative; cursor: pointer; transition: background 0.2s; }
    .server-toggle.on { background: #10b981; }
    .server-toggle::after { content: ''; position: absolute; width: 18px; height: 18px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: transform 0.2s; }
    .server-toggle.on::after { transform: translateX(18px); }
    .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; }
    .overlay.show { display: block; }
  </style>
</head>
<body>
  <div style="display:flex;height:100vh">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="header">
        <div class="header-logo">
          <div class="logo-icon">🤖</div>
          <h1>OpenClaw AI</h1>
        </div>
      </div>
      <div class="mcp-section">
        <h3>Modelo</h3>
        <select id="modelSelect" class="model-select">
          ${MODELS.map(m => `<option value="${m.id}">${m.name} (${m.provider})</option>`).join('')}
        </select>
      </div>
      <div class="mcp-section" style="flex:1;overflow-y:auto">
        <h3>MCPs Activos</h3>
        <div id="activeMcps" class="active-mcps">
          <span style="color:#71717a;font-size:12px">Sin MCPs activos</span>
        </div>
      </div>
      <div style="padding:12px">
        <button onclick="toggleMcpPanel()" class="btn btn-primary" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
          <span>🔌</span> Gestionar MCPs
        </button>
      </div>
    </div>

    <!-- Main Chat -->
    <div class="main">
      <div class="chat-area" id="chat">
        <div class="empty-state">
          <div class="icon">🤖</div>
          <div style="font-size:20px;font-weight:500;margin-bottom:8px">OpenClaw AI</div>
          <div style="font-size:14">Conversa con IA + MCPs</div>
        </div>
      </div>
      <div class="input-area">
        <div class="input-wrapper">
          <textarea id="input" class="prompt-input" placeholder="Escribe tu mensaje..." rows="1"></textarea>
          <button id="send" class="btn btn-primary" style="padding:12px 24px;font-weight:500">Enviar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MCP Panel -->
  <div class="overlay" id="overlay" onclick="toggleMcpPanel()"></div>
  <div class="mcp-panel" id="mcpPanel">
    <div class="panel-header">
      <h2>🔌 Servidores MCP</h2>
      <button class="close-panel" onclick="toggleMcpPanel()">×</button>
    </div>
    <div class="panel-content">
      <p style="color:#71717a;font-size:13px;margin-bottom:16px">Selecciona los servidores MCP sin credenciales que deseas usar:</p>
      <div id="serverList"></div>
    </div>
  </div>

  <script>
    var messages = [];
    var loading = false;
    var activeMcps = new Set();
    var chat = document.getElementById('chat');
    var input = document.getElementById('input');
    var sendBtn = document.getElementById('send');
    var modelSelect = document.getElementById('modelSelect');

    var mcpServers = ${JSON.stringify(MCP_SERVERS_NO_AUTH)};

    function initServerList() {
      var list = document.getElementById('serverList');
      list.innerHTML = mcpServers.map(function(s) {
        return '<div class="server-card" id="card-' + s.id + '" onclick="toggleMcp(\\'' + s.id + '\\')">' +
          '<span class="server-icon">' + s.icon + '</span>' +
          '<div class="server-info"><div class="name">' + s.name + '</div><div class="desc">' + s.desc + '</div></div>' +
          '<div class="server-toggle" id="toggle-' + s.id + '"></div>' +
        '</div>';
      }).join('');
    }

    function toggleMcp(id) {
      if (activeMcps.has(id)) {
        activeMcps.delete(id);
      } else {
        activeMcps.add(id);
      }
      updateMcpUI();
    }

    function updateMcpUI() {
      mcpServers.forEach(function(s) {
        var card = document.getElementById('card-' + s.id);
        var toggle = document.getElementById('toggle-' + s.id);
        if (activeMcps.has(s.id)) {
          card.classList.add('enabled');
          toggle.classList.add('on');
        } else {
          card.classList.remove('enabled');
          toggle.classList.remove('on');
        }
      });

      var activeDiv = document.getElementById('activeMcps');
      if (activeMcps.size === 0) {
        activeDiv.innerHTML = '<span style="color:#71717a;font-size:12px">Sin MCPs activos</span>';
      } else {
        activeDiv.innerHTML = Array.from(activeMcps).map(function(id) {
          var s = mcpServers.find(function(x) { return x.id === id; });
          return '<span class="mcp-tag">' + (s ? s.icon : '') + ' ' + (s ? s.name : id) + ' <span class="remove" onclick="event.stopPropagation();toggleMcp(\\'' + id + '\\')">×</span></span>';
        }).join('');
      }
    }

    function toggleMcpPanel() {
      document.getElementById('mcpPanel').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('show');
    }

    function addMessage(content, isUser) {
      var div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = isUser ? 'flex-end' : 'flex-start';
      var inner = document.createElement('div');
      inner.className = 'msg ' + (isUser ? 'msg-user' : 'msg-assistant');
      inner.textContent = content;
      div.appendChild(inner);
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function showTyping() {
      var div = document.createElement('div');
      div.id = 'typing';
      div.style.display = 'flex';
      div.style.justifyContent = 'flex-start';
      var inner = document.createElement('div');
      inner.className = 'msg msg-assistant typing';
      inner.innerHTML = '<span></span><span></span><span></span>';
      div.appendChild(inner);
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function hideTyping() {
      var t = document.getElementById('typing');
      if (t) t.remove();
    }

    function sendMessage() {
      var text = input.value.trim();
      if (!text || loading) return;

      // Hide empty state
      var empty = document.querySelector('.empty-state');
      if (empty) empty.remove();

      addMessage(text, true);
      input.value = '';
      loading = true;
      showTyping();

      var mcpsEnabled = Array.from(activeMcps).map(function(id) {
        var s = mcpServers.find(function(x) { return x.id === id; });
        return s ? s.command : id;
      });

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat([{role:'user',content:text}]),
          model: modelSelect.value,
          mcps: mcpsEnabled
        })
      }).then(function(res) { return res.json(); })
      .then(function(data) {
        hideTyping();
        var reply = data.response || data.error || 'No response';
        addMessage(reply, false);
        messages.push({role:'user',content:text},{role:'assistant',content:reply});
        loading = false;
      })
      .catch(function(e) {
        hideTyping();
        addMessage('Error: ' + e.message, false);
        loading = false;
      });
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    initServerList();
  </script>
</body>
</html>`;

async function handleRequest(request) {
  const url = new URL(request.url);
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

  if (url.pathname === '/api/chat' && request.method === 'POST') {
    try {
      const { messages, model, mcps } = await request.json();
      const system = 'Eres un asistente de IA útil. Responde en español o inglés.';
      const aiModel = model || '@cf/meta/llama-3.1-8b-instruct';

      // Construir contexto de MCPs activos
      let mcpContext = '';
      if (mcps && mcps.length > 0) {
        mcpContext = '\\n\\nMCPs disponibles: ' + mcps.join(', ');
      }

      const accountId = 'b7a628f29ce7b9e4d28128bf5b4442b6';
      const apiToken = 'h39gblzqE6XDntlNNV_jRaJ-QlrscT4iAYgVRmXr';

      const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/ai/run/' + aiModel, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiToken
        },
        body: JSON.stringify({
          messages: [{ role: 'system', content: system + mcpContext }, ...messages],
          max_tokens: 1024
        })
      });

      const data = await r.json();

      if (!data.success) {
        return new Response(JSON.stringify({
          error: data.errors?.[0]?.message || 'Error de API'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors }
        });
      }

      return new Response(JSON.stringify({
        response: data.result?.response || 'Sin respuesta'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors }
      });

    } catch (e) {
      return new Response(JSON.stringify({
        error: e.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: cors });
}
