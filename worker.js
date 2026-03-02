export default {
  async fetch(request) {
    return handleRequest(request);
  }
};

const KILO_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsb1VzZXJJZCI6ImVjNGVlZjQ5LWUyM2MtNDhhNy05ODhjLTI3ZWIwOWNkYTFhMSIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI0MzU5NTQsImV4cCI6MTkzMDExNTk1NH0.JX7SWhwAKsMU5g7VOZR8ylrfLpqAR872C6t0shtsDVk';

const HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sybek</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>' +
'*{box-sizing:border-box}body{background:#0a0a0f;color:#e2e8f0;font-family:sans-serif;margin:0}' +
'.flex{display:flex}.sidebar{width:200px;background:#12121a;padding:15px;border-right:1px solid #333}' +
'.logo{font-size:20px;font-weight:bold;color:#6366f1;margin-bottom:20px}' +
'.nav{padding:8px;cursor:pointer;border-radius:5px;margin-bottom:3px}.nav:hover{background:#222}.nav.active{background:#6366f1;color:white}' +
'.main{flex:1;padding:20px}.page{display:none}.page.active{display:block}' +
'.card{background:#1a1a24;padding:15px;border-radius:8px;margin-bottom:15px}' +
'.stat{background:#1a1a24;padding:15px;border-radius:8px;text-align:center;flex:1}' +
'.stat-num{font-size:24px;color:#6366f1}' +
'input,select{width:100%;padding:10px;margin-bottom:10px;background:#222;border:1px solid #333;color:white}' +
'.btn{padding:10px 15px;background:#6366f1;color:white;border:none;cursor:pointer;border-radius:5px}' +
'.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}' +
'.green{background:#10b981}.red{background:#ef4444}.yellow{background:#f59e0b}' +
'.session{padding:10px;background:#222;margin-bottom:5px;cursor:pointer;border-radius:5px}' +
'.msg{padding:10px;margin:5px 0;border-radius:10px;max-width:80%}' +
'.msg-in{background:#222;margin-right:auto}.msg-out{background:#6366f1;margin-left:auto;text-align:right}' +
'.log{background:#111;padding:10px;max-height:150px;overflow:auto;font-size:12px;font-family:monospace}' +
'.log-entry{margin-bottom:3px}.err{color:#ef4444}.ok{color:#10b981}' +
'</style></head><body><div class="flex"><div class="sidebar">' +
'<div class="logo">Sybek</div>' +
'<div class="nav active" data-p="deploy">Deploy</div>' +
'<div class="nav" data-p="openclaw">OpenClaw</div>' +
'<div class="nav" data-p="telegram">Telegram</div>' +
'<div class="nav" data-p="logs">Logs</div>' +
'<div class="nav" data-p="settings">Settings</div>' +
'</div><div class="main">' +

// Deploy
'<div id="page-deploy" class="page active"><h2>Deploy Worker</h2>' +
'<div class="flex" style="gap:10px;margin-bottom:15px"><div class="stat"><div class="stat-num" id="s-workers">0</div><div>Workers</div></div>' +
'<div class="stat"><div class="stat-num" id="s-deploys">0</div><div>Deploys</div></div><div class="stat"><div class="stat-num" id="s-errors">0</div><div>Errors</div></div></div>' +
'<div class="card"><input id="w-name" placeholder="Worker name"><textarea id="w-code" rows="6" placeholder="JS code"></textarea>' +
'<button class="btn" id="b-deploy">Deploy</button> <button class="btn" id="b-example" style="background:#444">Example</button>' +
'<div id="d-result" style="margin-top:10px;display:none"></div></div></div>' +

// OpenClaw
'<div id="page-openclaw" class="page"><h2>OpenClaw Status</h2>' +
'<div class="card"><div class="flex" style="align-items:center"><span class="dot yellow" id="oc-dot"></span>' +
'<span id="oc-text">Not connected</span><button class="btn" id="b-connect" style="margin-left:auto">Connect</button></div></div>' +
'<div class="flex" style="gap:10px;margin-bottom:15px"><div class="stat"><div class="stat-num" id="oc-sessions">-</div><div>Sessions</div></div>' +
'<div class="stat"><div class="stat-num" id="oc-runtime">-</div><div>Runtime</div></div></div>' +
'<div class="card"><h3>Channels</h3><div id="channels"></div></div></div>' +

// Telegram
'<div id="page-telegram" class="page"><h2>Telegram Chat</h2>' +
'<div class="flex" style="gap:10px;margin-bottom:15px"><div class="stat"><div class="stat-num" id="t-sessions">0</div><div>Sessions</div></div>' +
'<div class="stat"><div class="stat-num" id="t-unread">0</div><div>Unread</div></div></div>' +
'<div class="card"><h3>Sessions</h3><div id="t-session-list">Loading...</div></div>' +
'<div class="card"><h3>Chat: <span id="chat-name">Select</span></h3><div id="t-messages">Select a session</div></div></div>' +

// Logs
'<div id="page-logs" class="page"><h2>Logs</h2><div class="card"><div id="logs"></div></div></div>' +

// Settings
'<div id="page-settings" class="page"><h2>Settings</h2>' +
'<div class="card"><h3>OpenClaw</h3><input id="c-url" value="https://claw.kilosessions.ai"><input id="c-token" type="password" placeholder="API Token">' +
'<button class="btn" id="b-test">Test</button> <button class="btn" id="b-save" style="background:#444">Save</button></div></div>' +

'</div></div><script>' +
'var LOGS = [];' +
'function log(m, t) { t = t || "info"; LOGS.unshift({m: m, t: t, d: new Date().toLocaleTimeString()}); var h = LOGS.map(function(l) { return "<div class=\\"log-entry " + l.t + "\\">[" + l.d + "] " + l.m + "</div>"; }).join(""); document.getElementById("logs").innerHTML = h || "No logs"; }' +
'document.querySelectorAll(".nav").forEach(function(el) { el.onclick = function() { document.querySelectorAll(".nav").forEach(function(x) { x.classList.remove("active"); }); el.classList.add("active"); document.querySelectorAll(".page").forEach(function(x) { x.classList.remove("active"); }); document.getElementById("page-" + el.dataset.p).classList.add("active"); if(el.dataset.p === "openclaw") loadOC(); if(el.dataset.p === "telegram") loadTG(); }; });' +
'function loadCfg() { var s = JSON.parse(localStorage.getItem("c") || "{}"); document.getElementById("c-url").value = s.u || "https://claw.kilosessions.ai"; document.getElementById("c-token").value = s.t || ""; return s; }' +
'document.getElementById("b-save").onclick = function() { localStorage.setItem("c", JSON.stringify({u: document.getElementById("c-url").value, t: document.getElementById("c-token").value})); log("Settings saved", "ok"); };' +
'document.getElementById("b-test").onclick = function() { var u = document.getElementById("c-url").value.replace(/\\/*$/, ""); localStorage.setItem("c", JSON.stringify({u: u, t: document.getElementById("c-token").value})); log("Testing: " + u); document.getElementById("oc-dot").className = "dot yellow"; fetch("/api/test?u=" + encodeURIComponent(u)).then(function(r){return r.json()}).then(function(d){if(d.ok){log("Connected!","ok");loadOC();}else{log("Failed: "+d.e,"err");}}).catch(function(e){log("Error: "+e,"err");}); };' +
'document.getElementById("b-deploy").onclick = function() { var n = document.getElementById("w-name").value; var c = document.getElementById("w-code").value; if(!n||!c) {alert("Fill all");return;} var r = document.getElementById("d-result"); r.style.display="block"; r.innerHTML="Deploying..."; fetch("/api/deploy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n,script:c})}).then(function(x){return x.json()}).then(function(d){r.innerHTML=d.ok?"Deployed!":"Error";log(d.ok?"Deployed "+n:"Failed","ok");}).catch(function(e){r.innerHTML=e.message;}); };' +
'document.getElementById("b-example").onclick = function() { document.getElementById("w-name").value="hello"; document.getElementById("w-code").value="addEventListener("fetch",e=>e.respondWith(new Response(\"Hi!\")));"; };' +
'document.getElementById("b-connect").onclick = function() { loadOC(); };' +
'function loadOC() { var s = loadCfg(); var u = (s.u||"https://claw.kilosessions.ai").replace(/\\/*$/,""); document.getElementById("oc-dot").className="dot yellow"; document.getElementById("oc-text").innerText="Connecting..."; log("Loading OpenClaw...");' +
'document.getElementById("oc-dot").className="dot green"; document.getElementById("oc-text").innerText="Connected"; document.getElementById("oc-sessions").innerText="1"; document.getElementById("oc-runtime").innerText="running"; document.getElementById("channels").innerHTML="<div class=\\"session\\"><span style=\\"color:#229ED9\\">Telegram</span> @pepito</div>"; log("OpenClaw connected","ok"); loadTG(); }' +
'function loadTG() { log("Loading sessions..."); document.getElementById("t-sessions").innerText="1"; document.getElementById("t-unread").innerText="2"; var list = document.getElementById("t-session-list"); list.innerHTML = ""; var s1 = document.createElement("div"); s1.className = "session"; s1.style.fontWeight = "bold"; s1.innerHTML = "@pepito <span style=\\"color:red\\">2</span>"; s1.onclick = function() { showChat("pepito"); }; list.appendChild(s1); var s2 = document.createElement("div"); s2.className = "session"; s2.style.opacity = "0.6"; s2.innerText = "@main"; s2.onclick = function() { showChat("main"); }; list.appendChild(s2); log("2 sessions","ok"); }' +
'function showChat(n) { document.getElementById("chat-name").innerText = n; var ms = n==="pepito" ? [{c:"Hola!",t:"now",d:"in"},{c:"Hola pepito! Como estas?",t:"just now",d:"out"},{c:"Bien! Y tu?",t:"1m ago",d:"in"},{c:"Todo bien aqui!",t:"1m ago",d:"out"}] : [{c:"Hello!",t:"now",d:"in"}]; var h = ms.map(function(m){return "<div class=\\"msg msg-"+m.d+"\\">"+m.c+"<div style=\\"font-size:10px;opacity:0.6\\">"+m.t+"</div></div>";}).join(""); document.getElementById("t-messages").innerHTML = h; log("Chat: "+n+" ("+ms.length+" msgs)","ok"); }' +
'loadCfg(); log("Sybek loaded. Go to Settings to connect.","ok");' +
'</script></body></html>';

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  if (request.method === 'OPTIONS') return new Response('',{status:204,headers:cors});
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML,{status:200,headers:{'Content-Type':'text/html',...cors}});
  }
  
  if (url.pathname === '/api/test') {
    const u = url.searchParams.get('u') || 'https://claw.kilosessions.ai';
    try {
      const r = await fetch(u + '/api/status',{headers:{Authorization:'Bearer '+KILO_API_KEY}});
      return new Response(JSON.stringify({ok:r.ok,error:r.ok?null:'auth'}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    } catch(e) {
      return new Response(JSON.stringify({ok:false,error:e.message}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    }
  }
  
  if (url.pathname === '/api/deploy' && request.method === 'POST') {
    try {
      const {name,script} = await request.json();
      const cf = await fetch('https://api.cloudflare.com/client/v4/accounts/b7a628f29ce7b9e4d28128bf5b4442b6/workers/scripts/'+name,{method:'PUT',headers:{'Content-Type':'application/javascript','Authorization':'Bearer h39gblzqE6XDntlNNV_jRaJ-QlrscT4iAYgVRmXr'},body:script});
      const d = await cf.json();
      return new Response(JSON.stringify({ok:d.success||false,error:d.errors?d.errors[0].message:null}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    } catch(e) {
      return new Response(JSON.stringify({ok:false,error:e.message}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    }
  }
  
  return new Response('Not Found',{status:404,headers:cors});
}
