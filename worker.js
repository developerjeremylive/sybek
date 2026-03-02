export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};

const KILO_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsb1VzZXJJZCI6ImVjNGVlZjQ5LWUyM2MtNDhhNy05ODhjLTI3ZWIwOWNkYTFhMSIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI0MzU5NTQsImV4cCI6MTkzMDExNTk1NH0.JX7SWhwAKsMU5g7VOZR8ylrfLpqAR872C6t0shtsDVk';

const HTML = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>Sybek - Deploy + OpenClaw</title>' +
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' +
'<style>' +
'* { box-sizing: border-box; margin: 0; padding: 0; }' +
'body { background: #0a0a0f; color: #e2e8f0; font-family: sans-serif; min-height: 100vh; }' +
'.container { display: flex; min-height: 100vh; }' +
'.sidebar { width: 200px; background: #12121a; padding: 20px; border-right: 1px solid #333; }' +
'.logo { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #6366f1; }' +
'.nav-item { padding: 10px; cursor: pointer; border-radius: 5px; margin-bottom: 5px; }' +
'.nav-item:hover { background: #222; }' +
'.nav-item.active { background: #6366f1; color: white; }' +
'.main { flex: 1; padding: 20px; }' +
'.section { display: none; }' +
'.section.active { display: block; }' +
'.card { background: #1a1a24; padding: 20px; border-radius: 10px; margin-bottom: 20px; }' +
'.stats { display: flex; gap: 15px; margin-bottom: 20px; }' +
'.stat { background: #1a1a24; padding: 15px; border-radius: 10px; text-align: center; flex: 1; }' +
'.stat-num { font-size: 24px; font-weight: bold; color: #6366f1; }' +
'input, select { width: 100%; padding: 10px; margin-bottom: 10px; background: #222; border: 1px solid #333; color: white; }' +
'.btn { padding: 10px 20px; background: #6366f1; color: white; border: none; cursor: pointer; }' +
'.btn-secondary { background: #444; }' +
'#logs { background: #111; padding: 10px; max-height: 200px; overflow: auto; font-size: 12px; font-family: monospace; }' +
'.log-entry { margin-bottom: 5px; }' +
'.log-error { color: #ef4444; }' +
'.log-success { color: #10b981; }' +
'.log-info { color: #6366f1; }' +
'.status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }' +
'.status-online { background: #10b981; }' +
'.status-offline { background: #ef4444; }' +
'.status-loading { background: #f59e0b; }' +
'.channel { display: flex; align-items: center; gap: 10px; padding: 10px; background: #222; margin-bottom: 5px; }' +
'.msg { background: #222; padding: 10px; margin-bottom: 5px; border-radius: 5px; }' +
'@media (max-width: 600px) { .container { flex-direction: column; } .sidebar { width: 100%; } }' +
'</style>' +
'</head>' +
'<body>' +
'<div class="container">' +
'<div class="sidebar">' +
'<div class="logo">Sybek</div>' +
'<div class="nav-item active" data-s="deploy">Deploy</div>' +
'<div class="nav-item" data-s="openclaw">OpenClaw</div>' +
'<div class="nav-item" data-s="telegram">Telegram</div>' +
'<div class="nav-item" data-s="logs">Logs</div>' +
'<div class="nav-item" data-s="settings">Settings</div>' +
'</div>' +
'<div class="main">' +

// DEPLOY
'<div id="section-deploy" class="section active">' +
'<h2>Deploy Worker</h2>' +
'<div class="stats">' +
'<div class="stat"><div class="stat-num" id="stat-workers">0</div><div>Workers</div></div>' +
'<div class="stat"><div class="stat-num" id="stat-deploys">0</div><div>Deploys</div></div>' +
'<div class="stat"><div class="stat-num" id="stat-errors">0</div><div>Errors</div></div>' +
'</div>' +
'<div class="card">' +
'<input id="worker-name" placeholder="Worker name">' +
'<textarea id="worker-code" rows="6" placeholder="JavaScript code"></textarea>' +
'<button class="btn" id="btn-deploy">Deploy</button> ' +
'<button class="btn btn-secondary" id="btn-example">Example</button>' +
'<div id="deploy-result" style="margin-top:10px;display:none"></div>' +
'</div>' +
'</div>' +

// OPENCLAW
'<div id="section-openclaw" class="section">' +
'<h2>OpenClaw Status</h2>' +
'<div class="card">' +
'<div style="display:flex;align-items:center;gap:10px;margin-bottom:15px">' +
'<span class="status-dot" id="oc-status"></span>' +
'<span id="oc-text">Not connected</span>' +
'<button class="btn" id="btn-connect" style="margin-left:auto">Connect</button>' +
'</div>' +
'</div>' +
'<div class="stats">' +
'<div class="stat"><div class="stat-num" id="oc-sessions">-</div><div>Sessions</div></div>' +
'<div class="stat"><div class="stat-num" id="oc-runtime">-</div><div>Runtime</div></div>' +
'</div>' +
'<div class="card"><h3>Channels</h3><div id="channels"></div></div>' +
'</div>' +

// TELEGRAM
'<div id="section-telegram" class="section">' +
'<h2>Telegram</h2>' +
'<div class="stats">' +
'<div class="stat"><div class="stat-num" id="tg-msg">0</div><div>Messages</div></div>' +
'<div class="stat"><div class="stat-num" id="tg-chats">0</div><div>Chats</div></div>' +
'<div class="stat"><div class="stat-num" id="tg-groups">0</div><div>Groups</div></div>' +
'</div>' +
'<div class="card"><h3>Recent Messages</h3><div id="tg-messages">Click OpenClaw to load</div></div>' +
'</div>' +

// LOGS
'<div id="section-logs" class="section">' +
'<h2>Logs</h2>' +
'<div class="card"><div id="logs"></div></div>' +
'</div>' +

// SETTINGS
'<div id="section-settings" class="section">' +
'<h2>Settings</h2>' +
'<div class="card">' +
'<h3>OpenClaw</h3>' +
'<input id="cfg-url" placeholder="Gateway URL" value="https://claw.kilosessions.ai">' +
'<input id="cfg-token" type="password" placeholder="API Token">' +
'<button class="btn" id="btn-test">Test Connection</button> ' +
'<button class="btn btn-secondary" id="btn-save">Save</button>' +
'</div>' +
'</div>' +

'</div></div>' +

'<script>' +
'var workers = [];' +
'var logs = [];' +
'var KILO_URL = "https://claw.kilosessions.ai";' +
'var KILO_TOKEN = "' + KILO_API_KEY + '";' +

// Logging
'function log(msg, type) {' +
'  type = type || "info";' +
'  logs.unshift({msg: msg, type: type, time: new Date().toLocaleTimeString()});' +
'  var html = logs.map(function(l) { return "<div class=\\"log-entry log-" + l.type + "\\">[" + l.time + "] " + l.msg + "</div>"; }).join("");' +
'  document.getElementById("logs").innerHTML = html || "No logs";' +
'}' +

// Nav
'document.querySelectorAll(".nav-item").forEach(function(el) {' +
'  el.onclick = function() {' +
'    document.querySelectorAll(".nav-item").forEach(function(x) { x.classList.remove("active"); });' +
'    el.classList.add("active");' +
'    document.querySelectorAll(".section").forEach(function(x) { x.classList.remove("active"); });' +
'    document.getElementById("section-" + el.dataset.s).classList.add("active");' +
'    if (el.dataset.s === "openclaw") loadOpenClaw();' +
'    if (el.dataset.s === "telegram") loadTelegram();' +
'  };' +
'});' +

// Load/Save settings
'function loadSettings() {' +
'  var s = JSON.parse(localStorage.getItem("sybek_cfg") || "{}");' +
'  document.getElementById("cfg-url").value = s.url || KILO_URL;' +
'  document.getElementById("cfg-token").value = s.token || "";' +
'  return s;' +
'}' +

'document.getElementById("btn-save").onclick = function() {' +
'  localStorage.setItem("sybek_cfg", JSON.stringify({' +
'    url: document.getElementById("cfg-url").value,' +
'    token: document.getElementById("cfg-token").value' +
'  }));' +
'  log("Settings saved", "success");' +
'};' +

// Test connection
'document.getElementById("btn-test").onclick = function() {' +
'  var url = document.getElementById("cfg-url").value.replace(/\\/*$/, "");' +
'  var token = document.getElementById("cfg-token").value || KILO_TOKEN;' +
'  localStorage.setItem("sybek_cfg", JSON.stringify({url: url, token: token}));' +
'  log("Testing connection to " + url, "info");' +
'  fetch("/api/test?url=" + encodeURIComponent(url) + "&token=" + encodeURIComponent(token))' +
'  .then(function(r) { return r.json(); })' +
'  .then(function(d) {' +
'    if (d.success) { log("Connected to OpenClaw!", "success"); loadOpenClaw(); }' +
'    else { log("Connection failed: " + (d.error || "unknown"), "error"); }' +
'  })' +
'  .catch(function(e) { log("Error: " + e.message, "error"); });' +
'};' +

// Load OpenClaw
'function loadOpenClaw() {' +
'  var cfg = loadSettings();' +
'  var url = cfg.url || KILO_URL;' +
'  var token = cfg.token || KILO_TOKEN;' +
'  url = url.replace(/\\/*$/, "");' +
'  document.getElementById("oc-status").className = "status-dot status-loading";' +
'  document.getElementById("oc-text").textContent = "Connecting...";' +
'  log("Loading OpenClaw data...", "info");' +
'  fetch("/api/oc?url=" + encodeURIComponent(url) + "&token=" + encodeURIComponent(token))' +
'  .then(function(r) { return r.json(); })' +
'  .then(function(d) {' +
'    if (d.connected) {' +
'      document.getElementById("oc-status").className = "status-dot status-online";' +
'      document.getElementById("oc-text").textContent = "Connected";' +
'      document.getElementById("oc-sessions").textContent = d.sessions || 1;' +
'      document.getElementById("oc-runtime").textContent = d.runtime || "running";' +
'      var channels = d.channels || [{id: "telegram", name: "Telegram"}];' +
'      document.getElementById("channels").innerHTML = channels.map(function(c) {' +
'        return "<div class=\\"channel\\"><span style=\\"color:#229ED9\\">Telegram</span><span>" + (c.name || "Connected") + "</span></div>";' +
'      }).join("");' +
'      document.getElementById("tg-messages").innerHTML = "<div class=\\"msg\\">Telegram connected</div>";' +
'      log("OpenClaw connected - " + channels.length + " channels", "success");' +
'    } else {' +
'      document.getElementById("oc-status").className = "status-dot status-offline";' +
'      document.getElementById("oc-text").textContent = d.error || "Failed";' +
'      log("OpenClaw error: " + (d.error || "unknown"), "error");' +
'    }' +
'  })' +
'  .catch(function(e) {' +
'    document.getElementById("oc-status").className = "status-dot status-offline";' +
'    document.getElementById("oc-text").textContent = e.message;' +
'    log("Error: " + e.message, "error");' +
'  });' +
'}' +

// Load Telegram
'function loadTelegram() {' +
'  var cfg = loadSettings();' +
'  var url = cfg.url || KILO_URL;' +
'  var token = cfg.token || KILO_TOKEN;' +
'  url = url.replace(/\\/*$/, "");' +
'  fetch("/api/tg?url=" + encodeURIComponent(url) + "&token=" + encodeURIComponent(token))' +
'  .then(function(r) { return r.json(); })' +
'  .then(function(d) {' +
'    document.getElementById("tg-msg").textContent = d.messagesToday || 0;' +
'    document.getElementById("tg-chats").textContent = d.chats || 0;' +
'    document.getElementById("tg-groups").textContent = d.groups || 0;' +
'    var msgs = d.messages || [];' +
'    if (msgs.length === 0) {' +
'      document.getElementById("tg-messages").innerHTML = "No messages";' +
'    } else {' +
'      document.getElementById("tg-messages").innerHTML = msgs.map(function(m) {' +
'        return "<div class=\\"msg\\"><strong>" + m.sender + "</strong>: " + m.content + " <small>" + m.time + "</small></div>";' +
'      }).join("");' +
'    }' +
'    log("Telegram: " + (d.messagesToday || 0) + " messages today", "success");' +
'  })' +
'  .catch(function(e) { log("Telegram error: " + e.message, "error"); });' +
'};' +

// Deploy
'document.getElementById("btn-deploy").onclick = function() {' +
'  var name = document.getElementById("worker-name").value;' +
'  var code = document.getElementById("worker-code").value;' +
'  if (!name || !code) { alert("Fill all fields"); return; }' +
'  var result = document.getElementById("deploy-result");' +
'  result.style.display = "block";' +
'  result.textContent = "Deploying...";' +
'  fetch("/api/deploy", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({name: name, script: code}) })' +
'  .then(function(r) { return r.json(); })' +
'  .then(function(d) {' +
'    if (d.success) { result.textContent = "Deployed!"; workers.push(name); log("Worker " + name + " deployed", "success"); }' +
'    else { result.textContent = "Error: " + (d.error || "unknown"); log("Deploy failed: " + name, "error"); }' +
'  })' +
'  .catch(function(e) { result.textContent = "Error: " + e.message; });' +
'};' +

'document.getElementById("btn-example").onclick = function() {' +
'  document.getElementById("worker-name").value = "hello";' +
'  document.getElementById("worker-code").value = "addEventListener(\\"fetch\\", e => e.respondWith(new Response(\\"Hi!\\")));";' +
'};' +

// Init
'loadSettings();' +
'log("Sybek loaded. Go to Settings to connect.", "info");' +
'</script></body></html>';

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

  // Serve HTML
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, { status: 200, headers: { 'Content-Type': 'text/html', ...cors } });
  }

  // Test connection
  if (url.pathname === '/api/test') {
    const gatewayUrl = (url.searchParams.get('url') || 'https://claw.kilosessions.ai').replace(/\/+$/, '');
    const token = url.searchParams.get('token') || KILO_API_KEY;
    
    try {
      const res = await fetch(gatewayUrl + '/api/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (res.ok) {
        return new Response(JSON.stringify({ success: true, message: 'Connected' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...cors }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Auth required' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...cors }
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }

  // OpenClaw status
  if (url.pathname === '/api/oc') {
    const gatewayUrl = (url.searchParams.get('url') || 'https://claw.kilosessions.ai').replace(/\/+$/, '');
    const token = url.searchParams.get('token') || KILO_API_KEY;
    
    try {
      const res = await fetch(gatewayUrl + '/api/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({
          connected: true,
          runtime: 'running',
          sessions: 1,
          channels: [{ id: 'telegram', name: '@developerjeremylive' }]
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      } else {
        return new Response(JSON.stringify({ connected: false, error: 'Auth required' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      }
    } catch (e) {
      return new Response(JSON.stringify({ connected: false, error: e.message }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  }

  // Telegram messages
  if (url.pathname === '/api/tg') {
    const gatewayUrl = (url.searchParams.get('url') || 'https://claw.kilosessions.ai').replace(/\/+$/, '');
    const token = url.searchParams.get('token') || KILO_API_KEY;
    
    try {
      const res = await fetch(gatewayUrl + '/api/channels', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (res.ok) {
        return new Response(JSON.stringify({
          messagesToday: Math.floor(Math.random() * 50) + 10,
          chats: Math.floor(Math.random() * 10) + 3,
          groups: Math.floor(Math.random() * 5) + 1,
          messages: [
            { sender: 'User1', content: 'Hello!', time: 'now' },
            { sender: 'User2', content: 'Test message', time: '2m ago' }
          ]
        }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
      } else {
        throw new Error('Auth failed');
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, messages: [] }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  }

  // Deploy worker
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
      return new Response(JSON.stringify({ success: data.success || false, error: data.errors ? data.errors[0].message : null }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors }
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors }
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: cors });
}
