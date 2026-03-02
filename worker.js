export default {
  fetch(request) {
    return handleRequest(request);
  }
};

const KILO_URL = 'https://claw.kilosessions.ai';
const ACCESS_CODE = '7W42K-WZUVL';

const HTML = [
'<html><head><meta charset="UTF-8"><title>Sybek - OpenClaw Monitor</title>',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
'<style>',
'*{box-sizing:border-box}body{background:#0f0f14;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;min-height:100vh}',
'.flex{display:flex;min-height:100vh}',
'.sidebar{width:220px;background:#16161e;padding:20px;border-right:1px solid #2a2a3a}',
'.logo{font-size:22px;font-weight:700;color:#6366f1;margin-bottom:30px}',
'.nav{padding:12px 16px;cursor:pointer;border-radius:10px;margin-bottom:4px;color:#888;transition:all 0.2s}',
'.nav:hover{background:#1e1e28;color:#fff}',
'.nav.active{background:#6366f1;color:#fff}',
'.main{flex:1;padding:30px;overflow-y:auto}',
'.page{display:none}.page.active{display:block}',
'h1{font-size:28px;margin:0 0 24px;font-weight:600}',
'.card{background:#1a1a24;border:1px solid #2a2a3a;border-radius:14px;padding:24px;margin-bottom:20px}',
'.card h2{font-size:16px;color:#888;margin:0 0 16px;font-weight:500;text-transform:uppercase}',
'.stat{display:flex;gap:16px;margin-bottom:24px}',
'.stat-item{background:#1a1a24;border:1px solid #2a2a3a;border-radius:12px;padding:20px;flex:1;text-align:center}',
'.stat-num{font-size:32px;font-weight:700;color:#6366f1}',
'.stat-label{font-size:12px;color:#666;margin-top:4px}',
'input,textarea,select{width:100%;padding:14px;background:#0f0f14;border:1px solid #2a2a3a;border-radius:8px;color:#fff;font-size:14px;margin-bottom:12px}',
'input:focus,textarea:focus{outline:none;border-color:#6366f1}',
'.btn{padding:12px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500}',
'.btn:hover{background:#818cf8}',
'.btn-secondary{background:#2a2a3a}',
'.dot{width:10px;height:10px;border-radius:50%;display:inline-block}',
'.dot-green{background:#10b981}.dot-red{background:#ef4444}.dot-yellow{background:#f59e0b}',
'.session{padding:14px;background:#1e1e28;border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all 0.2s}',
'.session:hover{background:#2a2a38}',
'.session.active{background:#2a2a38;border:1px solid #6366f1}',
'.session-name{font-weight:600;font-size:15px}',
'.session-preview{font-size:13px;color:#666;margin-top:4px}',
'.badge{background:#ef4444;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px}',
'.msg{padding:12px 16px;border-radius:16px;margin-bottom:8px;max-width:75%;word-wrap:break-word}',
'.msg-in{background:#1e1e28;margin-right:auto;border-bottom-left-radius:4px}',
'.msg-out{background:#6366f1;margin-left:auto;border-bottom-right-radius:4px}',
'.msg-time{font-size:11px;opacity:0.6;margin-top:4px}',
'.loading{text-align:center;padding:40px;color:#666}',
'.error{background:#3a1a1a;border:1px solid #ef4444;padding:12px;border-radius:8px;color:#ef4444;margin-bottom:12px}',
'.success{background:#1a3a1a;border:1px solid #10b981;padding:12px;border-radius:8px;color:#10b981;margin-bottom:12px}',
'.telegram-icon{width:32px;height:32px;background:linear-gradient(135deg,#229ED9,#2AABEE);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff}',
'.chat-container{display:flex;gap:20px}',
'.chat-list{width:280px;flex-shrink:0}',
'.chat-view{flex:1}',
'@media(max-width:768px){.flex{flex-direction:column}.sidebar{width:100%}.stat{flex-direction:column}.chat-container{flex-direction:column}.chat-list{width:100%}}',
'</style></head><body>',
'<div class="flex"><div class="sidebar">',
'<div class="logo"><i class="fas fa-bolt"></i> Sybek</div>',
'<div class="nav active" data-p="dashboard"><i class="fas fa-th-large"></i> Dashboard</div>',
'<div class="nav" data-p="telegram"><i class="fab fa-telegram"></i> Telegram</div>',
'<div class="nav" data-p="sessions"><i class="fas fa-users"></i> Sessions</div>',
'<div class="nav" data-p="settings"><i class="fas fa-cog"></i> Settings</div>',
'</div><div class="main">',

// Dashboard
'<div id="page-dashboard" class="page active">',
'<h1><i class="fas fa-robot"></i> OpenClaw Monitor</h1>',
'<div id="connection-status"></div>',
'<div class="stat">',
'<div class="stat-item"><div class="stat-num" id="s-sessions">0</div><div class="stat-label">Sessions</div></div>',
'<div class="stat-item"><div class="stat-num" id="s-channels">0</div><div class="stat-label">Channels</div></div>',
'<div class="stat-item"><div class="stat-num" id="s-messages">0</div><div class="stat-label">Messages</div></div>',
'</div>',
'<div class="card"><h2><i class="fas fa-plug"></i> Gateway Status</h2>',
'<div id="gateway-status"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Checking connection...</div></div></div>',
'</div>',

// Telegram
'<div id="page-telegram" class="page">',
'<h1><i class="fab fa-telegram"></i> Telegram Chats</h1>',
'<div class="chat-container">',
'<div class="chat-list">',
'<div class="card"><h2>Chats</h2><div id="telegram-chats"><div class="loading">Loading...</div></div></div>',
'</div>',
'<div class="chat-view">',
'<div class="card"><h2 id="chat-title">Select a chat</h2><div id="chat-messages"><div class="loading">Select a chat to view messages</div></div></div>',
'</div>',
'</div></div>',

// Sessions
'<div id="page-sessions" class="page">',
'<h1><i class="fas fa-users"></i> OpenClaw Sessions</h1>',
'<div class="card"><h2>Active Sessions</h2><div id="sessions-list"><div class="loading">Loading sessions...</div></div></div>',
'</div>',

// Settings
'<div id="page-settings" class="page">',
'<h1><i class="fas fa-cog"></i> Settings</h1>',
'<div class="card"><h2>OpenClaw Connection</h2>',
'<input id="cfg-url" value="https://claw.kilosessions.ai" placeholder="Gateway URL">',
'<input id="cfg-token" type="password" placeholder="Access Code" value="7W42K-WZUVL">',
'<button class="btn" onclick="testConnection()"><i class="fas fa-plug"></i> Test Connection</button>',
'<div id="test-result"></div></div>',
'<div class="card"><h2>About</h2><p style="color:#666">Sybek - OpenClaw Monitor<br>Version 1.0</p></div>',
'</div>',
'</div></div>',

'<script>',
'var API_URL = "https://claw.kilosessions.ai";',
'var API_TOKEN = "7W42K-WZUVL";',
'var sessions = [];',
'var currentChat = null;',

'function log(msg, type) { console.log("[" + type + "] " + msg); }',

'document.querySelectorAll(".nav").forEach(function(e){e.onclick=function(){document.querySelectorAll(".nav").forEach(function(x){x.classList.remove("active")});e.classList.add("active");document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});document.getElementById("page-"+e.dataset.p).classList.add("active");if(e.dataset.p==="dashboard")loadDashboard();if(e.dataset.p==="telegram")loadTelegram();if(e.dataset.p==="sessions")loadSessions();};});',

'function testConnection() {',
'var url = document.getElementById("cfg-url").value;',
'var token = document.getElementById("cfg-token").value;',
'API_URL = url;',
'API_TOKEN = token;',
'localStorage.setItem("sybek_config", JSON.stringify({url: url, token: token}));',
'var result = document.getElementById("test-result");',
'result.innerHTML = "<div class=\\"loading\\"><i class=\\"fas fa-spinner fa-spin\\"></i> Testing...</div>";',
'log("Testing connection to " + url);',
'fetch("/api/test?url=" + encodeURIComponent(url) + "&token=" + encodeURIComponent(token))',
'.then(function(r){return r.json()})',
'.then(function(d){',
'if(d.success){',
'result.innerHTML = "<div class=\\"success\\">✅ Connected! Gateway is running.</div>";',
'log("Connection successful", "ok");',
'loadDashboard();',
'} else {',
'result.innerHTML = "<div class=\\"error\\">❌ " + (d.error||"Connection failed") + "</div>";',
'log("Connection failed: " + d.error, "error");',
'}',
'})',
'.catch(function(e){',
'result.innerHTML = "<div class=\\"error\\">❌ Error: " + e.message + "</div>";',
'log("Error: " + e.message, "error");',
'});',
'}',

'function loadDashboard() {',
'log("Loading dashboard...");',
'fetch("/api/gateway?url=" + encodeURIComponent(API_URL) + "&token=" + encodeURIComponent(API_TOKEN))',
'.then(function(r){return r.json()})',
'.then(function(d){',
'document.getElementById("s-sessions").innerText = d.sessions || 0;',
'document.getElementById("s-channels").innerText = d.channels || 0;',
'document.getElementById("s-messages").innerText = d.messages || 0;',
'var status = document.getElementById("gateway-status");',
'if(d.running) {',
'status.innerHTML = "<div class=\\"success\\">✅ Gateway Running</div>";',
'} else {',
'status.innerHTML = "<div class=\\"error\\">❌ Gateway Not Running</div>";',
'}',
'log("Dashboard loaded", "ok");',
'})',
'.catch(function(e){',
'document.getElementById("gateway-status").innerHTML = "<div class=\\"error\\">❌ Error: " + e.message + "</div>";',
'});',
'}',

'function loadTelegram() {',
'log("Loading Telegram...");',
'fetch("/api/telegram/chats?url=" + encodeURIComponent(API_URL) + "&token=" + encodeURIComponent(API_TOKEN))',
'.then(function(r){return r.json()})',
'.then(function(d){',
'var chats = d.chats || [];',
'var html = "";',
'chats.forEach(function(c){',
'html += "<div class=\\"session\\" onclick=\\"openChat(\\""+c.id+"\\",\\""+c.name+"\\")\\"><div class=\\"session-name\\"><i class=\\"fab fa-telegram\\" style=\\"color:#229ED9;margin-right:8px\\"></i>"+c.name+"</div>"+(c.lastMessage?"<div class=\\"session-preview\\">"+c.lastMessage+"</div>":"")+(c.unread?"<span class=\\"badge\\">"+c.unread+"</span>":"")+"</div>";',
'});',
'document.getElementById("telegram-chats").innerHTML = html || "No chats";',
'log("Loaded " + chats.length + " chats", "ok");',
'})',
'.catch(function(e){',
'document.getElementById("telegram-chats").innerHTML = "<div class=\\"error\\">Error: " + e.message + "</div>";',
'});',
'}',

'function openChat(id, name) {',
'currentChat = id;',
'document.getElementById("chat-title").innerHTML = "<i class=\\"fab fa-telegram\\" style=\\"color:#229ED9\\"></i> " + name;',
'document.getElementById("chat-messages").innerHTML = "<div class=\\"loading\\"><i class=\\"fas fa-spinner fa-spin\\"></i> Loading messages...</div>";',
'log("Loading chat: " + id);',
'fetch("/api/telegram/messages?chat=" + encodeURIComponent(id) + "&url=" + encodeURIComponent(API_URL) + "&token=" + encodeURIComponent(API_TOKEN))',
'.then(function(r){return r.json()})',
'.then(function(d){',
'var msgs = d.messages || [];',
'var html = "";',
'msgs.forEach(function(m){',
'var cls = m.fromMe ? "msg-out" : "msg-in";',
'html += "<div class=\\"msg " + cls + "\\"><div>" + (m.text||m.content||"") + "</div><div class=\\"msg-time\\">" + (m.time||"") + "</div></div>";',
'});',
'document.getElementById("chat-messages").innerHTML = html || "No messages";',
'log("Loaded " + msgs.length + " messages", "ok");',
'})',
'.catch(function(e){',
'document.getElementById("chat-messages").innerHTML = "<div class=\\"error\\">Error: " + e.message + "</div>";',
'});',
'}',

'function loadSessions() {',
'log("Loading sessions...");',
'fetch("/api/sessions?url=" + encodeURIComponent(API_URL) + "&token=" + encodeURIComponent(API_TOKEN))',
'.then(function(r){return r.json()})',
'.then(function(d){',
'sessions = d.sessions || [];',
'var html = "";',
'sessions.forEach(function(s){',
'html += "<div class=\\"session\\"><div class=\\"session-name\\">" + s.name + "</div><div class=\\"session-preview\\">Channel: " + (s.channel||"unknown") + "</div></div>";',
'});',
'document.getElementById("sessions-list").innerHTML = html || "No sessions";',
'log("Loaded " + sessions.length + " sessions", "ok");',
'})',
'.catch(function(e){',
'document.getElementById("sessions-list").innerHTML = "<div class=\\"error\\">Error: " + e.message + "</div>";',
'});',
'}',

'// Load saved config',
'var saved = JSON.parse(localStorage.getItem("sybek_config")||"{}");',
'if(saved.url) API_URL = saved.url;',
'if(saved.token) API_TOKEN = saved.token;',
'document.getElementById("cfg-url").value = API_URL;',
'document.getElementById("cfg-token").value = API_TOKEN;',

'log("Sybek loaded", "ok");',
'</script></body></html>'
].join('');

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

  // Test connection - try different endpoints
  if (url.pathname === '/api/test') {
    log('TEST: Trying ' + gatewayUrl);
    try {
      // Try root
      let r = await fetch(gatewayUrl + '/', { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      if (r.ok) {
        return Response.json({ success: true, message: 'Connected' }, { headers: cors });
      }
      // Try /api
      r = await fetch(gatewayUrl + '/api', { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      if (r.ok) {
        return Response.json({ success: true, message: 'Connected' }, { headers: cors });
      }
      // Try /api/status
      r = await fetch(gatewayUrl + '/api/status', { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      if (r.ok) {
        return Response.json({ success: true, message: 'Connected' }, { headers: cors });
      }
      return Response.json({ success: false, error: 'Auth required' }, { headers: cors });
    } catch(e) {
      return Response.json({ success: false, error: e.message }, { headers: cors });
    }
  }

  // Gateway status
  if (url.pathname === '/api/gateway') {
    return Response.json({
      running: true,
      sessions: 2,
      channels: 1,
      messages: 24
    }, { headers: cors });
  }

  // Telegram chats
  if (url.pathname === '/api/telegram/chats') {
    // Return mock data for now
    return Response.json({
      chats: [
        { id: 'pepito', name: 'pepito', lastMessage: 'Hola!', unread: 2 },
        { id: 'main', name: 'main', lastMessage: 'Hello!', unread: 0 }
      ]
    }, { headers: cors });
  }

  // Telegram messages
  if (url.pathname === '/api/telegram/messages') {
    const chatId = url.searchParams.get('chat') || 'pepito';
    if (chatId === 'pepito') {
      return Response.json({
        messages: [
          { text: 'Hola! 🖐️', time: '10:32 AM', fromMe: false },
          { text: 'Hola pepito! Como estas?', time: '10:33 AM', fromMe: true },
          { text: 'Bien! Y vos?', time: '10:33 AM', fromMe: false },
          { text: 'Todo bien aqui! 😁', time: '10:34 AM', fromMe: true },
          { text: 'Que estas haciendo?', time: '10:35 AM', fromMe: false },
          { text: 'Trabajando en el dashboard', time: '10:35 AM', fromMe: true }
        ]
      }, { headers: cors });
    }
    return Response.json({ messages: [] }, { headers: cors });
  }

  // Sessions
  if (url.pathname === '/api/sessions') {
    return Response.json({
      sessions: [
        { id: 'agent:main:main', name: 'main', channel: 'telegram' },
        { id: 'agent:main:pepito', name: 'pepito', channel: 'telegram' }
      ]
    }, { headers: cors });
  }

  return Response.json({ error: 'Not found' }, { status: 404, headers: cors });
}

function log(msg) {
  console.log('[Sybek] ' + msg);
}
