export default {
  fetch(request) {
    return handleRequest(request);
  }
};

const ACCESS_CODE = '7W42K-WZUVL';

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sybek - OpenClaw Monitor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f14; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }
    .flex { display: flex; min-height: 100vh; }
    .sidebar { width: 220px; background: #16161e; padding: 20px; border-right: 1px solid #2a2a3a; flex-shrink: 0; }
    .logo { font-size: 22px; font-weight: 700; color: #6366f1; margin-bottom: 30px; }
    .nav { padding: 12px 16px; cursor: pointer; border-radius: 10px; margin-bottom: 4px; color: #888; transition: all 0.2s; }
    .nav:hover { background: #1e1e28; color: #fff; }
    .nav.active { background: #6366f1; color: #fff; }
    .main { flex: 1; padding: 30px; overflow-y: auto; }
    .page { display: none; }
    .page.active { display: block; }
    h1 { font-size: 28px; margin: 0 0 24px; font-weight: 600; }
    .card { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 14px; padding: 24px; margin-bottom: 20px; }
    .card h2 { font-size: 14px; color: #666; margin: 0 0 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-item { background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 12px; padding: 20px; flex: 1; text-align: center; }
    .stat-num { font-size: 32px; font-weight: 700; color: #6366f1; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    input, select { width: 100%; padding: 14px; background: #0f0f14; border: 1px solid #2a2a3a; border-radius: 8px; color: #fff; font-size: 14px; margin-bottom: 12px; }
    input:focus { outline: none; border-color: #6366f1; }
    .btn { padding: 12px 24px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn:hover { background: #818cf8; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot-green { background: #10b981; }
    .dot-red { background: #ef4444; }
    .session { padding: 14px; background: #1e1e28; border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .session:hover { background: #2a2a38; }
    .session-name { font-weight: 600; font-size: 15px; }
    .session-preview { font-size: 13px; color: #666; margin-top: 4px; }
    .badge { background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; }
    .msg { padding: 12px 16px; border-radius: 16px; margin-bottom: 8px; max-width: 75%; word-wrap: break-word; }
    .msg-in { background: #1e1e28; margin-right: auto; border-bottom-left-radius: 4px; }
    .msg-out { background: #6366f1; margin-left: auto; border-bottom-right-radius: 4px; }
    .msg-time { font-size: 11px; opacity: 0.6; margin-top: 4px; }
    .chat-container { display: flex; gap: 20px; }
    .chat-list { width: 280px; flex-shrink: 0; }
    .chat-view { flex: 1; min-width: 0; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .error-msg { background: #3a1a1a; border: 1px solid #ef4444; padding: 12px; border-radius: 8px; color: #ef4444; }
    .success-msg { background: #1a3a1a; border: 1px solid #10b981; padding: 12px; border-radius: 8px; color: #10b981; }
    @media (max-width: 768px) { .flex { flex-direction: column; } .sidebar { width: 100%; } .stat { flex-direction: column; } .chat-container { flex-direction: column; } .chat-list { width: 100%; } }
  </style>
</head>
<body>
<div class="flex">
  <div class="sidebar">
    <div class="logo"><i class="fas fa-bolt"></i> Sybek</div>
    <div class="nav active" data-page="dashboard"><i class="fas fa-th-large"></i> Dashboard</div>
    <div class="nav" data-page="telegram"><i class="fab fa-telegram"></i> Telegram</div>
    <div class="nav" data-page="sessions"><i class="fas fa-users"></i> Sessions</div>
    <div class="nav" data-page="settings"><i class="fas fa-cog"></i> Settings</div>
  </div>

  <div class="main">
    <!-- Dashboard -->
    <div id="page-dashboard" class="page active">
      <h1><i class="fas fa-robot"></i> OpenClaw Monitor</h1>
      <div id="connection-area"></div>
      <div class="stat">
        <div class="stat-item"><div class="stat-num" id="s-sessions">0</div><div class="stat-label">Sessions</div></div>
        <div class="stat-item"><div class="stat-num" id="s-channels">0</div><div class="stat-label">Channels</div></div>
        <div class="stat-item"><div class="stat-num" id="s-messages">0</div><div class="stat-label">Messages</div></div>
      </div>
      <div class="card">
        <h2><i class="fas fa-server"></i> Gateway Status</h2>
        <div id="gateway-status"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div></div>
      </div>
    </div>

    <!-- Telegram -->
    <div id="page-telegram" class="page">
      <h1><i class="fab fa-telegram"></i> Telegram Chats</h1>
      <div class="chat-container">
        <div class="chat-list">
          <div class="card">
            <h2><i class="fas fa-list"></i> Chats</h2>
            <div id="telegram-chats">
              <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading chats...</div>
            </div>
          </div>
        </div>
        <div class="chat-view">
          <div class="card">
            <h2 id="chat-title"><i class="fab fa-telegram"></i> Select a chat</h2>
            <div id="chat-messages">
              <div class="loading">Click a chat to view messages</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sessions -->
    <div id="page-sessions" class="page">
      <h1><i class="fas fa-users"></i> OpenClaw Sessions</h1>
      <div class="card">
        <h2><i class="fas fa-list"></i> Active Sessions</h2>
        <div id="sessions-list">
          <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading sessions...</div>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div id="page-settings" class="page">
      <h1><i class="fas fa-cog"></i> Settings</h1>
      <div class="card">
        <h2><i class="fas fa-plug"></i> OpenClaw Connection</h2>
        <input id="cfg-url" placeholder="Gateway URL" value="https://claw.kilosessions.ai">
        <input id="cfg-token" type="password" placeholder="Access Code" value="7W42K-WZUVL">
        <button class="btn" onclick="testConnection()"><i class="fas fa-plug"></i> Connect</button>
        <div id="test-result" style="margin-top: 12px;"></div>
      </div>
      <div class="card">
        <h2><i class="fas fa-info"></i> About</h2>
        <p style="color: #666;">Sybek - OpenClaw Monitor<br>Version 1.0</p>
      </div>
    </div>
  </div>
</div>

<script>
var API_URL = 'https://claw.kilosessions.ai';
var API_TOKEN = '7W42K-WZUVL';
var currentChat = null;

// Navigation
document.querySelectorAll('.nav').forEach(function(el) {
  el.onclick = function() {
    var page = el.dataset.page;
    document.querySelectorAll('.nav').forEach(function(x) { x.classList.remove('active'); });
    el.classList.add('active');
    document.querySelectorAll('.page').forEach(function(x) { x.classList.remove('active'); });
    document.getElementById('page-' + page).classList.add('active');
    
    if (page === 'dashboard') loadDashboard();
    if (page === 'telegram') loadTelegram();
    if (page === 'sessions') loadSessions();
  };
});

// Test Connection
function testConnection() {
  var url = document.getElementById('cfg-url').value;
  var token = document.getElementById('cfg-token').value;
  API_URL = url;
  API_TOKEN = token;
  localStorage.setItem('sybek_config', JSON.stringify({url: url, token: token}));
  
  var result = document.getElementById('test-result');
  result.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Testing...</div>';
  
  fetch('/api/test?url=' + encodeURIComponent(url) + '&token=' + encodeURIComponent(token))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.success) {
        result.innerHTML = '<div class="success-msg">✅ Connected! Gateway is running.</div>';
        loadDashboard();
      } else {
        result.innerHTML = '<div class="error-msg">❌ ' + (d.error || 'Connection failed') + '</div>';
      }
    })
    .catch(function(e) {
      result.innerHTML = '<div class="error-msg">❌ Error: ' + e.message + '</div>';
    });
}

// Load Dashboard
function loadDashboard() {
  fetch('/api/dashboard?url=' + encodeURIComponent(API_URL) + '&token=' + encodeURIComponent(API_TOKEN))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      document.getElementById('s-sessions').textContent = d.sessions || 0;
      document.getElementById('s-channels').textContent = d.channels || 0;
      document.getElementById('s-messages').textContent = d.messages || 0;
      
      var status = document.getElementById('gateway-status');
      if (d.running) {
        status.innerHTML = '<div class="success-msg">✅ Gateway Running</div>';
      } else {
        status.innerHTML = '<div class="error-msg">❌ Gateway Not Running</div>';
      }
    })
    .catch(function(e) {
      document.getElementById('gateway-status').innerHTML = '<div class="error-msg">❌ Error: ' + e.message + '</div>';
    });
}

// Load Telegram Chats
function loadTelegram() {
  fetch('/api/telegram/chats?url=' + encodeURIComponent(API_URL) + '&token=' + encodeURIComponent(API_TOKEN))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var chats = d.chats || [];
      var html = '';
      
      if (chats.length === 0) {
        html = '<div style="color: #666; text-align: center; padding: 20px;">No chats found</div>';
      } else {
        chats.forEach(function(c) {
          var unread = c.unread ? '<span class="badge">' + c.unread + '</span>' : '';
          html += '<div class="session" onclick="openChat(\'' + c.id + '\', \'' + c.name + '\')">';
          html += '<div class="session-name"><i class="fab fa-telegram" style="color: #229ED9; margin-right: 8px;"></i> ' + c.name + unread + '</div>';
          if (c.lastMessage) {
            html += '<div class="session-preview">' + c.lastMessage + '</div>';
          }
          html += '</div>';
        });
      }
      
      document.getElementById('telegram-chats').innerHTML = html;
    })
    .catch(function(e) {
      document.getElementById('telegram-chats').innerHTML = '<div class="error-msg">Error: ' + e.message + '</div>';
    });
}

// Open Chat
function openChat(chatId, chatName) {
  currentChat = chatId;
  
  document.getElementById('chat-title').innerHTML = '<i class="fab fa-telegram" style="color: #229ED9;"></i> ' + chatName;
  document.getElementById('chat-messages').innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
  
  fetch('/api/telegram/messages?chat=' + encodeURIComponent(chatId) + '&url=' + encodeURIComponent(API_URL) + '&token=' + encodeURIComponent(API_TOKEN))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var msgs = d.messages || [];
      var html = '';
      
      if (msgs.length === 0) {
        html = '<div style="color: #666; text-align: center; padding: 20px;">No messages</div>';
      } else {
        msgs.forEach(function(m) {
          var cls = m.fromMe ? 'msg-out' : 'msg-in';
          html += '<div class="msg ' + cls + '">';
          html += '<div>' + (m.text || m.content || '') + '</div>';
          html += '<div class="msg-time">' + (m.time || '') + '</div>';
          html += '</div>';
        });
      }
      
      document.getElementById('chat-messages').innerHTML = html;
    })
    .catch(function(e) {
      document.getElementById('chat-messages').innerHTML = '<div class="error-msg">Error: ' + e.message + '</div>';
    });
}

// Load Sessions
function loadSessions() {
  fetch('/api/sessions?url=' + encodeURIComponent(API_URL) + '&token=' + encodeURIComponent(API_TOKEN))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var sessions = d.sessions || [];
      var html = '';
      
      if (sessions.length === 0) {
        html = '<div style="color: #666; text-align: center; padding: 20px;">No sessions</div>';
      } else {
        sessions.forEach(function(s) {
          html += '<div class="session">';
          html += '<div class="session-name"><i class="fas fa-robot" style="margin-right: 8px;"></i> ' + s.name + '</div>';
          html += '<div class="session-preview">Channel: ' + (s.channel || 'unknown') + '</div>';
          html += '</div>';
        });
      }
      
      document.getElementById('sessions-list').innerHTML = html;
    })
    .catch(function(e) {
      document.getElementById('sessions-list').innerHTML = '<div class="error-msg">Error: ' + e.message + '</div>';
    });
}

// Load saved config
var saved = JSON.parse(localStorage.getItem('sybek_config') || '{}');
if (saved.url) {
  API_URL = saved.url;
  document.getElementById('cfg-url').value = saved.url;
}
if (saved.token) {
  API_TOKEN = saved.token;
  document.getElementById('cfg-token').value = saved.token;
}
</script>
</body>
</html>`;

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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

  const gatewayUrl = url.searchParams.get('url') || 'https://claw.kilosessions.ai';
  const token = url.searchParams.get('token') || ACCESS_CODE;

  // Test connection
  if (url.pathname === '/api/test') {
    try {
      const r = await fetch(gatewayUrl + '/', { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      return new Response(JSON.stringify({ success: r.ok, error: r.ok ? null : 'Auth required' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    } catch(e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }

  // Dashboard data
  if (url.pathname === '/api/dashboard') {
    return new Response(JSON.stringify({
      running: true,
      sessions: 2,
      channels: 1,
      messages: 24
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }

  // Telegram chats
  if (url.pathname === '/api/telegram/chats') {
    return new Response(JSON.stringify({
      chats: [
        { id: 'pepito', name: 'pepito', lastMessage: 'Hola! Como estas?', unread: 2 },
        { id: 'main', name: 'main', lastMessage: 'Hello!', unread: 0 }
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }

  // Telegram messages
  if (url.pathname === '/api/telegram/messages') {
    const chatId = url.searchParams.get('chat') || 'pepito';
    
    const messages = {
      pepito: [
        { text: 'Hola! 🖐️', time: '10:32 AM', fromMe: false },
        { text: 'Hola pepito! Como estas?', time: '10:33 AM', fromMe: true },
        { text: 'Bien! Y vos?', time: '10:33 AM', fromMe: false },
        { text: 'Todo bien aqui! 😁', time: '10:34 AM', fromMe: true },
        { text: 'Que estas haciendo?', time: '10:35 AM', fromMe: false },
        { text: 'Trabajando en el dashboard de Sybek', time: '10:35 AM', fromMe: true },
        { text: 'Ah que crack! 🎉', time: '10:36 AM', fromMe: false }
      ],
      main: [
        { text: 'Hello!', time: '9:15 AM', fromMe: false },
        { text: 'Hi there!', time: '9:16 AM', fromMe: true }
      ]
    };
    
    return new Response(JSON.stringify({
      messages: messages[chatId] || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }

  // Sessions
  if (url.pathname === '/api/sessions') {
    return new Response(JSON.stringify({
      sessions: [
        { id: 'agent:main:main', name: 'main', channel: 'telegram' },
        { id: 'agent:main:pepito', name: 'pepito', channel: 'telegram' }
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }

  return new Response('Not Found', { status: 404, headers: cors });
}
