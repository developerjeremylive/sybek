export default {
  fetch(request) {
    return handleRequest(request);
  }
};

const KILO_URL = 'https://claw.kilosessions.ai';

const HTML = [
'<html><head><meta charset="UTF-8"><title>Sybek - OpenClaw Monitor</title>',
'<meta name="viewport" content="width=device-width,initial-scale=1">',
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
'<style>',
'*{box-sizing:border-box}body{background:#0f0f14;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;min-height:100vh}',
'.flex{display:flex;min-height:100vh}',
'.sidebar{width:220px;background:#16161e;padding:20px;border-right:1px solid #2a2a3a}',
'.logo{font-size:22px;font-weight:700;color:#6366f1;margin-bottom:30px;display:flex;align-items:center;gap:10px}',
'.nav{padding:12px 16px;cursor:pointer;border-radius:10px;margin-bottom:4px;color:#888;transition:all 0.2s}',
'.nav:hover{background:#1e1e28;color:#fff}',
'.nav.active{background:#6366f1;color:#fff}',
'.main{flex:1;padding:30px;overflow-y:auto}',
'.page{display:none}.page.active{display:block}',
'h1{font-size:28px;margin:0 0 24px;font-weight:600}',
'.card{background:#1a1a24;border:1px solid #2a2a3a;border-radius:14px;padding:24px;margin-bottom:20px}',
'.card h2{font-size:16px;color:#888;margin:0 0 16px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px}',
'.stat{display:flex;gap:16px;margin-bottom:24px}',
'.stat-item{background:#1a1a24;border:1px solid #2a2a3a;border-radius:12px;padding:20px;flex:1;text-align:center}',
'.stat-num{font-size:32px;font-weight:700;color:#6366f1}',
'.stat-label{font-size:12px;color:#666;margin-top:4px}',
'input,textarea{width:100%;padding:14px;background:#0f0f14;border:1px solid #2a2a3a;border-radius:8px;color:#fff;font-size:14px;margin-bottom:12px}',
'input:focus,textarea:focus{outline:none;border-color:#6366f1}',
'.btn{padding:12px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500}',
'.btn:hover{background:#818cf8}',
'.btn-secondary{background:#2a2a3a}',
'.dot{width:10px;height:10px;border-radius:50%;display:inline-block}',
'.dot-green{background:#10b981}.dot-red{background:#ef4444}.dot-yellow{background:#f59e0b}',
'.session{padding:14px;background:#1e1e28;border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all 0.2s}',
'.session:hover{background:#2a2a38}',
'.session-name{font-weight:600;font-size:15px}',
'.session-preview{font-size:13px;color:#666;margin-top:4px}',
'.badge{background:#ef4444;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:8px}',
'.msg{padding:12px 16px;border-radius:16px;margin-bottom:8px;max-width:75%}',
'.msg-in{background:#1e1e28;margin-right:auto;border-bottom-left-radius:4px}',
'.msg-out{background:#6366f1;margin-left:auto;border-bottom-right-radius:4px}',
'.msg-time{font-size:11px;opacity:0.6;margin-top:4px}',
'.log{background:#0a0a0f;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;max-height:200px;overflow:auto}',
'.log-entry{margin-bottom:4px}',
'.log-err{color:#ef4444}.log-ok{color:#10b981}.log-info{color:#888}',
'.telegram-icon{width:32px;height:32px;background:linear-gradient(135deg,#229ED9,#2AABEE);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff}',
'.oc-icon{width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff}',
'@media(max-width:768px){.flex{flex-direction:column}.sidebar{width:100%}.stat{flex-direction:column}}',
'</style></head><body>',
'<div class="flex"><div class="sidebar">',
'<div class="logo"><i class="fas fa-bolt"></i> Sybek</div>',
'<div class="nav active" data-p="dashboard"><i class="fas fa-th-large"></i> Dashboard</div>',
'<div class="nav" data-p="telegram"><i class="fab fa-telegram"></i> Telegram</div>',
'<div class="nav" data-p="settings"><i class="fas fa-cog"></i> Settings</div>',
'</div><div class="main">',

// Dashboard
'<div id="page-dashboard" class="page active">',
'<h1><i class="fas fa-robot"></i> OpenClaw Monitor</h1>',
'<div class="stat">',
'<div class="stat-item"><div class="stat-num" id="s-sessions">1</div><div class="stat-label">Active Sessions</div></div>',
'<div class="stat-item"><div class="stat-num" id="s-messages">24</div><div class="stat-label">Messages Today</div></div>',
'<div class="stat-item"><div class="stat-num"><span class="dot dot-green"></span></div><div class="stat-label">Status</div></div>',
'</div>',
'<div class="card"><h2><i class="fas fa-plug"></i> Connection</h2>',
'<div style="display:flex;align-items:center;gap:16px"><div class="oc-icon"><i class="fas fa-robot"></i></div>',
'<div><div style="font-weight:600">OpenClaw Gateway</div><div style="font-size:13px;color:#666">claw.kilosessions.ai</div></div>',
'<span class="dot dot-green" id="conn-dot"></span><span id="conn-status" style="color:#10b981">Connected</span></div>',
'</div>',
'<div class="card"><h2><i class="fab fa-telegram"></i> Telegram</h2>',
'<div style="display:flex;align-items:center;gap:16px"><div class="telegram-icon"><i class="fab fa-telegram"></i></div>',
'<div><div style="font-weight:600">Telegram Channel</div><div style="font-size:13px;color:#666">2 active chats</div></div>',
'<span class="dot dot-green"></span><span style="color:#10b981">Active</span></div>',
'</div>',
'</div>',

// Telegram
'<div id="page-telegram" class="page">',
'<h1><i class="fab fa-telegram"></i> Telegram Chats</h1>',
'<div class="stat">',
'<div class="stat-item"><div class="stat-num" id="t-sessions">2</div><div class="stat-label">Chats</div></div>',
'<div class="stat-item"><div class="stat-num" id="t-unread">3</div><div class="stat-label">Unread</div></div>',
'<div class="stat-item"><div class="stat-num" id="t-today">18</div><div class="stat-label">Today</div></div>',
'</div>',
'<div class="card"><h2>Recent Chats</h2>',
'<div id="chat-list">',
'<div class="session" onclick="openChat(\'pepito\')"><div class="session-name"><i class="fab fa-telegram" style="color:#229ED9;margin-right:8px"></i>pepito<span class="badge">2</span></div><div class="session-preview">Last: Hola! como estas?</div></div>',
'<div class="session" onclick="openChat(\'main\')"><div class="session-name"><i class="fab fa-telegram" style="color:#229ED9;margin-right:8px"></i>main<span class="badge">1</span></div><div class="session-preview">Last: Hello!</div></div>',
'</div></div>',
'<div class="card" id="chat-view"><h2 id="chat-title">Select a chat</h2><div id="chat-messages"><div style="color:#666;text-align:center;padding:40px">Click a chat to view messages</div></div></div>',
'</div>',

// Settings
'<div id="page-settings" class="page">',
'<h1><i class="fas fa-cog"></i> Settings</h1>',
'<div class="card"><h2>OpenClaw Connection</h2>',
'<input id="cfg-url" value="https://claw.kilosessions.ai" placeholder="Gateway URL">',
'<input id="cfg-token" type="password" placeholder="Access Code">',
'<button class="btn" onclick="saveSettings()"><i class="fas fa-save"></i> Save</button></div>',
'<div class="card"><h2>About</h2><p style="color:#666">Sybek - OpenClaw Monitor Dashboard<br>Version 1.0</p></div>',
'</div>',
'</div></div>',

'<script>',
'var currentChat = null;',
'function log(m,t){t=t||"info";var d=new Date().toLocaleTimeString();var el=document.getElementById("log-area");if(el)el.innerHTML="<div class=\\"log-entry log-"+t+"\\">["+d+"] "+m+"</div>"+el.innerHTML;}',
'document.querySelectorAll(".nav").forEach(function(e){e.onclick=function(){document.querySelectorAll(".nav").forEach(function(x){x.classList.remove("active")});e.classList.add("active");document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});document.getElementById("page-"+e.dataset.p).classList.add("active");};});',
'function openChat(name){currentChat=name;document.getElementById("chat-title").innerHTML="<i class=\\"fab fa-telegram\\" style=\\"color:#229ED9\\"></i> @"+name;',
'var msgs=name==="pepito"?[',
'{c:"Hola! 🖐️",t:"10:32 AM",d:"in"},',
'{c:"Hola pepito! Como estas?",t:"10:33 AM",d:"out"},',
'{c:"Bien! Y vos?",t:"10:33 AM",d:"in"},',
'{c:"Todo bien aqui! 😁",t:"10:34 AM",d:"out"},',
'{c:"Que estas haciendo?",t:"10:35 AM",d:"in"},',
'{c:"Trabajando en el dashboard de Sybek",t:"10:35 AM",d:"out"},',
'{c:"Ah que crack! 🎉",t:"10:36 AM",d:"in"},',
']:[',
'{c:"Hello!",t:"9:15 AM",d:"in"},',
'{c:"Hi there!",t:"9:16 AM",d:"out"},',
'];',
'var h="";msgs.forEach(function(m){var cls=m.d==="out"?"msg-out":"msg-in";h=h+"<div class=\\"msg "+cls+"\\"><div>"+m.c+"</div><div class=\\"msg-time\\">"+m.t+"</div></div>"});',
'document.getElementById("chat-messages").innerHTML=h;',
'document.getElementById("chat-messages").scrollTop=document.getElementById("chat-messages").scrollHeight;',
'log("Opened chat: "+name);',
'}',
'function saveSettings(){localStorage.setItem("sybek_cfg",JSON.stringify({url:document.getElementById("cfg-url").value,token:document.getElementById("cfg-token").value}));alert("Settings saved!");log("Settings saved");}',
'log("Sybek loaded - Click Telegram to view chats");',
'</script></body></html>'
].join('');

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  if (request.method === 'OPTIONS') return new Response('',{status:204,headers:cors});
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML,{status:200,headers:{'Content-Type':'text/html',...cors}});
  }
  
  return new Response('Not Found',{status:404,headers:cors});
}
