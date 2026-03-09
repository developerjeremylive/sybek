// Cloudflare Pages Function - serves as catch-all handler
export async function onRequest(context) {
  return handleRequest(context.request);
}

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Sybek - AI Workspace</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0f0f14; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }
.flex { display: flex; }
.sidebar { width: 220px; background: #16161e; padding: 20px; border-right: 1px solid #222; }
.sidebar-logo { font-size: 28px; font-weight: bold; color: #6366f1; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
.nav { padding: 14px 16px; cursor: pointer; border-radius: 10px; margin-bottom: 6px; color: #888; transition: all 0.2s; font-weight: 500; }
.nav:hover { background: rgba(255,255,255,0.05); color: #fff; }
.nav.active { background: #6366f1; color: #fff; }
.main { flex: 1; padding: 25px; overflow-y: auto; }
.page { display: none; }
.page.active { display: block; }
.page-title { font-size: 28px; margin-bottom: 25px; color: #fff; }
.card { background: #1a1a24; padding: 24px; border-radius: 14px; margin-bottom: 20px; border: 1px solid #2a2a3a; }
.btn { background: #6366f1; color: #fff; padding: 12px 24px; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.btn:hover { background: #4f46e5; transform: translateY(-1px); }
.input { width: 100%; padding: 14px; background: #0f0f14; border: 1px solid #333; border-radius: 10px; color: #fff; margin-bottom: 12px; }
.input:focus { outline: none; border-color: #6366f1; }
.msg { padding: 12px 16px; border-radius: 14px; margin-bottom: 10px; max-width: 70%; word-wrap: break-word; }
.msgin { background: #222; align-self: flex-start; }
.msgout { background: #6366f1; align-self: flex-end; margin-left: auto; }
.chat-messages { display: flex; flex-direction: column; max-height: calc(100vh - 200px); overflow-y: auto; }
.message-input { display: flex; gap: 10px; margin-top: 20px; }
.message-input input { flex: 1; }
.send-btn { background: #00d9ff; color: #000; }
.send-btn:hover { background: #00b8d9; }
.tree-item:hover { background: rgba(255,255,255,0.1); }
.tree-item.active { background: rgba(99, 102, 241, 0.3); }
.files-tab { margin-top: auto; padding-top: 20px; border-top: 1px solid #333; }
</style>
</head>
<body>
<div class="flex">
<div class="sidebar">
  <div class="sidebar-logo">⚡ Sybek</div>
  <div class="nav active" data-p="chat">💬 Chat</div>
  <div class="nav" data-p="files">📁 Files</div>
  <div class="nav" data-p="settings">⚙️ Settings</div>
  <div class="files-tab">
    <div class="nav" data-p="agents">🤖 Agents</div>
  </div>
</div>
<div class="main">
  <div id="page-chat" class="page active">
    <h2 class="page-title">AI Chat</h2>
    <div class="card">
      <div class="chat-messages" id="chatMessages">
        <div class="msg msgin">👋 Hello! I'm Sybek. How can I help you today?</div>
      </div>
      <div class="message-input">
        <input class="input" id="userMessage" placeholder="Type your message..." onkeypress="if(event.key==='Enter')sendMessage()">
        <button class="btn send-btn" onclick="sendMessage()">Send</button>
      </div>
    </div>
  </div>
  <div id="page-files" class="page">
    <h2 class="page-title">📁 Files</h2>
    <div class="card">
      <div style="display:flex;gap:20px;">
        <div style="width:250px;background:#1a1a24;border-radius:12px;padding:15px;">
          <h3 style="color:#888;font-size:12px;margin-bottom:15px;text-transform:uppercase;">Files</h3>
          <div class="tree-item" onclick="openFile('AGENTS.md')" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;">📄 AGENTS.md</div>
          <div class="tree-item" onclick="openFile('MEMORY.md')" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;">📄 MEMORY.md</div>
          <div class="tree-item" onclick="openFile('SOUL.md')" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;">📄 SOUL.md</div>
          <div class="tree-item" onclick="openFile('USER.md')" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;">📄 USER.md</div>
        </div>
        <div style="flex:1;background:#1a1a24;border-radius:12px;padding:20px;">
          <h3 id="currentFile" style="color:#00d9ff;margin-bottom:15px;">Select a file</h3>
          <textarea id="fileContent" style="width:100%;height:300px;background:#0f0f14;color:#e2e8f0;border:1px solid #333;border-radius:8px;padding:15px;font-family:monospace;"></textarea>
        </div>
      </div>
    </div>
  </div>
  <div id="page-settings" class="page">
    <h2 class="page-title">⚙️ Settings</h2>
    <div class="card">
      <h3 style="margin-bottom:15px;color:#888;">API Configuration</h3>
      <input class="input" id="apiToken" placeholder="Cloudflare API Token">
      <input class="input" id="accountId" placeholder="Account ID">
      <button class="btn" onclick="saveSettings()">Save Settings</button>
    </div>
  </div>
  <div id="page-agents" class="page">
    <h2 class="page-title">🤖 Agents Configuration</h2>
    <div class="card">
      <h3 style="margin-bottom:15px;color:#888;">AGENTS.md Editor</h3>
      <textarea id="agentsContent" style="width:100%;height:400px;background:#0f0f14;color:#e2e8f0;border:1px solid #333;border-radius:10px;padding:15px;font-family:monospace;"></textarea>
      <button class="btn" onclick="saveAgents()" style="margin-top:15px;">Save</button>
    </div>
  </div>
</div>
</div>
<script>
const FILES = {
  'AGENTS.md': "# AGENTS.md - Your Workspace\\n\\nThis folder is home.\\n\\n## First Run\\n\\nIf BOOTSTRAP.md exists, that's your birth certificate.\\n\\n## Every Session\\n\\n1. Read SOUL.md — this is who you are\\n2. Read USER.md — this is who you're helping\\n3. Read memory/YYYY-MM-DD.md\\n\\n## Memory\\n\\n- Daily notes: memory/YYYY-MM-DD.md\\n- Long-term: MEMORY.md\\n\\n## Safety\\n\\n- Don't exfiltrate private data.\\n",
  'MEMORY.md': "# MEMORY.md\\n\\n## About Me\\n- Name: Sybek\\n- Vibe: Sharp, resourceful ⚡\\n\\n## Preferences\\n- User: S\\n",
  'SOUL.md': "# SOUL.md - Who You Are\\n\\n## Core Truths\\n\\nBe genuinely helpful. Have opinions. Be resourceful.\\n\\n## Boundaries\\n\\n- Private things stay private.\\n",
  'USER.md': "# USER.md\\n\\n- Name: S\\n- Timezone: UTC\\n",
  'IDENTITY.md': "# IDENTITY.md\\n\\n- Name: Sybek\\n- Emoji: ⚡\\n",
  'HEARTBEAT.md': "# HEARTBEAT.md\\n\\n# Keep empty to skip heartbeats.\\n"
};

let currentFile = null;

document.querySelectorAll('.nav').forEach(e => {
  e.onclick = () => {
    document.querySelectorAll('.nav').forEach(x => x.classList.remove('active'));
    e.classList.add('active');
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById('page-' + e.dataset.p).classList.add('active');
  };
});

function openFile(filename) {
  currentFile = filename;
  document.getElementById('currentFile').innerText = filename;
  document.getElementById('fileContent').value = FILES[filename] || '';
}

function saveSettings() {
  localStorage.setItem('apiToken', document.getElementById('apiToken').value);
  alert('Settings saved!');
}

document.getElementById('agentsContent').value = FILES['AGENTS.md'];

async function sendMessage() {
  const input = document.getElementById('userMessage');
  const msg = input.value.trim();
  if (!msg) return;
  
  const messages = document.getElementById('chatMessages');
  messages.innerHTML += '<div class="msg msgout">' + msg + '</div>';
  messages.innerHTML += '<div class="msg msgin">Thinking...</div>';
  input.value = '';
  
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({messages: [{role: 'user', content: msg}]})
    });
    const data = await response.json();
    const reply = data.result?.response || data.response || 'No response';
    messages.lastElementChild.innerText = reply;
  } catch(e) {
    messages.lastElementChild.innerText = 'Error: ' + e.message;
  }
}
</script>
</body>
</html>
`;

const CF_ACCOUNT_ID = 'b7a628f29ce7b9e4d28128bf5b4442b6';
const CF_API_TOKEN = 'EmLAmGq9ejsEaa7VHjxH6aGJgjoe2woyKfMXCu93';

const MODEL_ENDPOINTS = {
  '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*'};
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
    });
  }
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, {status:200, headers:{'Content-Type':'text/html',...cors}});
  }
  
  if (url.pathname === '/api/ai') {
    const body = await request.text();
    let jsonBody;
    try { jsonBody = JSON.parse(body); }
    catch { return new Response(JSON.stringify({error: 'Invalid JSON'}), {status:400, headers:{'Content-Type':'application/json',...cors}}); }
    
    const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
    const endpoint = MODEL_ENDPOINTS[model] || '/ai/run/' + model;
    const workersAiUrl = 'https://api.cloudflare.com/client/v4/accounts/'+CF_ACCOUNT_ID+endpoint;
    
    try {
      const response = await fetch(workersAiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer '+CF_API_TOKEN},
        body: JSON.stringify({messages: jsonBody.messages || [], max_tokens: jsonBody.max_tokens || 1024}),
      });
      const responseData = await response.json();
      return new Response(JSON.stringify(responseData), {status: response.status, headers:{'Content-Type':'application/json',...cors}});
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), {status:500, headers:{'Content-Type':'application/json',...cors}});
    }
  }
  
  return new Response('Not Found', {status:404});
}
