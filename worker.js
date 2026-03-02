export default {
  fetch(request) {
    return handleRequest(request);
  }
};

const HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sybek</title><style>body{background:#0f0f14;color:#e2e8f0;font-family:sans-serif;margin:0}.flex{display:flex}.sidebar{width:200px;background:#16161e;padding:20px}.main{flex:1;padding:20px}.nav{padding:12px;cursor:pointer;border-radius:8px;margin-bottom:4px}.nav.active{background:#6366f1;color:#fff}.page{display:none}.page.active{display:block}.card{background:#1a1a24;padding:20px;border-radius:12px;margin-bottom:16px}.btn{background:#6366f1;color:#fff;padding:12px 20px;border:none;border-radius:8px;cursor:pointer}.session{padding:12px;background:#222;border-radius:8px;margin-bottom:8px;cursor:pointer}.msg{padding:10px 14px;border-radius:12px;margin-bottom:6px;max-width:70%}.msgin{background:#222}.msgout{background:#6366f1}</style></head><body><div class="flex"><div class="sidebar"><div style="font-size:24px;font-weight:bold;color:#6366f1;margin-bottom:20px">Sybek</div><div class="nav active" data-p="telegram">Telegram</div><div class="nav" data-p="settings">Settings</div></div><div class="main"><div id="page-telegram" class="page active"><h2>Telegram Chats</h2><div class="card"><div id="chatlist">Loading...</div></div><div class="card"><h3 id="chattitle">Select chat</h3><div id="chatmsg">Click a chat</div></div></div><div id="page-settings" class="page"><h2>Settings</h2><div class="card"><input id="token" value="7W42K-WZUVL"><button class="btn" onclick="connect()">Connect</button></div></div></div></div><script>var chats=[{id:"pepito",name:"pepito",msgs:[{t:"Hola!",m:false},{t:"Hola!",m:true},{t:"Como estas?",m:false},{t:"Bien!",m:true}]},{id:"main",name:"main",msgs:[{t:"Hello",m:false},{t:"Hi!",m:true}]}];document.querySelectorAll(".nav").forEach(function(e){e.onclick=function(){document.querySelectorAll(".nav").forEach(function(x){x.classList.remove("active")});e.classList.add("active");document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});document.getElementById("page-"+e.dataset.p).classList.add("active")}});function renderChats(){var h="";chats.forEach(function(c){h+="<div class=\"session\" onclick=\"showChat('"+c.id+"')\">"+c.name+"</div>"});document.getElementById("chatlist").innerHTML=h}function showChat(id){var c=chats.find(function(x){return x.id===id});if(!c)return;document.getElementById("chattitle").innerText=c.name;var h="";c.msgs.forEach(function(m){h+="<div class=\"msg "+(m.m?"msgout":"msgin")+"\">"+m.t+"</div>"});document.getElementById("chatmsg").innerHTML=h}function connect(){alert("Connected!");renderChats()}renderChats();</script></body></html>';

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*'};
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, {status:200, headers:{'Content-Type':'text/html',...cors}});
  }
  
  return new Response('Not Found', {status:404});
}
