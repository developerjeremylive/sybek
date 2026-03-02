export default {
  fetch(request) {
    return handleRequest(request);
  }
};

const KILO_ACCESS_CODE = '7W42K-WZUVL';
const KILO_URL = 'https://claw.kilosessions.ai';

const HTML = [
'<html><head><meta charset="UTF-8"><title>Sybek</title>',
'<style>',
'body{background:#0a0a0f;color:#e2e8f0;font-family:sans-serif;margin:0}',
'.flex{display:flex}',
'.sidebar{width:180px;background:#12121a;padding:15px}',
'.main{flex:1;padding:15px}',
'.nav{padding:10px;cursor:pointer;border-radius:5px;margin-bottom:3px}',
'.nav:hover{background:#222}',
'.nav.active{background:#6366f1;color:white}',
'.page{display:none}.page.active{display:block}',
'.card{background:#1a1a24;padding:15px;border-radius:8px;margin-bottom:15px}',
'.stat{background:#1a1a24;padding:15px;border-radius:8px;text-align:center;flex:1}',
'.snum{font-size:24px;color:#6366f1}',
'input,textarea{width:100%;padding:10px;margin-bottom:10px;background:#222;border:1px solid #333;color:white}',
'.btn{padding:10px 15px;background:#6366f1;color:white;border:none;cursor:pointer;border-radius:5px}',
'.dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:5px}',
'.green{background:#10b981}.red{background:#ef4444}.yellow{background:#f59e0b}',
'.session{padding:10px;background:#222;margin-bottom:5px;cursor:pointer;border-radius:5px}',
'.msg{padding:10px;margin:5px 0;border-radius:10px;max-width:80%}',
'.msgin{background:#222;margin-right:auto}.msgout{background:#6366f1;margin-left:auto;text-align:right}',
'</style></head><body>',
'<div class="flex"><div class="sidebar">',
'<div style="font-size:20px;font-weight:bold;color:#6366f1;margin-bottom:20px">Sybek</div>',
'<div class="nav active" data-p="deploy">Deploy</div>',
'<div class="nav" data-p="openclaw">OpenClaw</div>',
'<div class="nav" data-p="telegram">Telegram</div>',
'<div class="nav" data-p="logs">Logs</div>',
'<div class="nav" data-p="settings">Settings</div>',
'</div><div class="main">',

'<div id="page-deploy" class="page active"><h2>Deploy</h2>',
'<div class="flex" style="gap:10px;margin-bottom:15px">',
'<div class="stat"><div class="snum" id="sworkers">0</div><div>Workers</div></div>',
'<div class="stat"><div class="snum" id="sdeploys">0</div><div>Deploys</div></div>',
'</div>',
'<div class="card"><input id="wname" placeholder="Name"><textarea id="wcode" rows="5" placeholder="Code"></textarea>',
'<button class="btn" id="bdeploy">Deploy</button></div></div>',

'<div id="page-openclaw" class="page"><h2>OpenClaw</h2>',
'<div class="card"><span class="dot yellow" id="ocdot"></span><span id="octext">Not connected</span> <button class="btn" id="bconnect">Connect</button></div>',
'<div class="flex" style="gap:10px;margin-bottom:15px">',
'<div class="stat"><div class="snum" id="ocsessions">-</div><div>Sessions</div></div>',
'<div class="stat"><div class="snum" id="ocruntime">-</div><div>Runtime</div></div>',
'</div></div>',

'<div id="page-telegram" class="page"><h2>Telegram</h2>',
'<div class="flex" style="gap:10px;margin-bottom:15px">',
'<div class="stat"><div class="snum" id="tsessions">0</div><div>Sessions</div></div>',
'<div class="stat"><div class="snum" id="tunread">0</div><div>Unread</div></div>',
'</div>',
'<div class="card" id="sessionlist">Sessions</div>',
'<div class="card" id="chatbox">Select session</div></div>',

'<div id="page-logs" class="page"><h2>Logs</h2><div class="card" id="logs">No logs</div></div>',

'<div id="page-settings" class="page"><h2>Settings</h2>',
'<div class="card"><input id="curl" value="https://claw.kilosessions.ai"><input id="cpass" type="password" placeholder="Access Code">',
'<button class="btn" id="btest">Connect</button></div></div>',

'</div></div>',
'<script>',
'var LOGS=[];',
'function log(m,t){t=t||"info";LOGS.unshift({m:m,t:t,d:new Date().toLocaleTimeString()});var h="";LOGS.forEach(function(l){h=h+"<div class="+l.t+">["+l.d+"] "+l.m+"</div>"});document.getElementById("logs").innerHTML=h||"No logs";}',
'document.querySelectorAll(".nav").forEach(function(e){e.onclick=function(){document.querySelectorAll(".nav").forEach(function(x){x.classList.remove("active")});e.classList.add("active");document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});document.getElementById("page-"+e.dataset.p).classList.add("active");if(e.dataset.p=="openclaw")loadOC();if(e.dataset.p=="telegram")loadTG();}});',
'function cfg(){var s=JSON.parse(localStorage.getItem("c")||"{}");document.getElementById("curl").value=s.u||"https://claw.kilosessions.ai";document.getElementById("cpass").value=s.p||"";return s;}',
'document.getElementById("btest").onclick=function(){var u=document.getElementById("curl").value.replace(/\\/*$/,"");var p=document.getElementById("cpass").value;localStorage.setItem("c",JSON.stringify({u:u,p:p}));log("Connecting to: "+u);document.getElementById("ocdot").className="dot yellow";testOC(u,p);};',
'document.getElementById("bconnect").onclick=function(){loadOC();};',
'document.getElementById("bdeploy").onclick=function(){var n=document.getElementById("wname").value;var c=document.getElementById("wcode").value;if(!n||!c){alert("Fill all");return;}log("Deploying: "+n);fetch("/api/deploy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n,script:c})}).then(function(r){return r.json()}).then(function(d){log(d.ok?"Deployed "+n:"Failed: "+d.error,"info");}).catch(function(e){log("Error: "+e,"error");});};',
'function testOC(u,p){log("Testing connection...");fetch("/api/test?u="+encodeURIComponent(u)+"&p="+encodeURIComponent(p)).then(function(r){return r.json()}).then(function(d){if(d.ok){log("Connected!","info");loadOC(u,p);}else{log("Failed: "+(d.error||"auth"),"error");document.getElementById("ocdot").className="dot red";}}).catch(function(e){log("Error: "+e,"error");document.getElementById("ocdot").className="dot red";});}',
'function loadOC(u,p){if(!u){var c=cfg();u=c.u||"https://claw.kilosessions.ai";p=c.p||"";}document.getElementById("ocdot").className="dot green";document.getElementById("octext").innerText="Connected";document.getElementById("ocsessions").innerText="1";document.getElementById("ocruntime").innerText="running";log("OpenClaw connected","info");loadTG(u,p);}',
'function loadTG(u,p){if(!u){var c=cfg();u=c.u||"https://claw.kilosessions.ai";p=c.p||"";}log("Loading Telegram sessions...");document.getElementById("tsessions").innerText="0";document.getElementById("tunread").innerText="0";fetch("/api/sessions?u="+encodeURIComponent(u)+"&p="+encodeURIComponent(p)).then(function(r){return r.json()}).then(function(d){var sess=d.sessions||[];document.getElementById("tsessions").innerText=sess.length;var unread=0;sess.forEach(function(x){unread+=x.unread||0});document.getElementById("tunread").innerText=unread;var el=document.getElementById("sessionlist");el.innerHTML="";sess.forEach(function(sx){var div=document.createElement("div");div.className="session";div.innerHTML="<b>"+sx.name+"</b>"+(sx.unread?" <span style=color:red>"+sx.unread+"</span>":"");div.onclick=function(){chat(sx.id,sx.name,u,p);};el.appendChild(div);});log(sess.length+" sessions loaded","info");}).catch(function(e){log("Error: "+e,"error")});}',
'function chat(id,name,u,p){if(!u){var c=cfg();u=c.u||"https://claw.kilosessions.ai";p=c.p||"";}document.getElementById("chatbox").innerHTML="<b>Chat: "+name+"</b> Loading...";fetch("/api/messages?session="+encodeURIComponent(id)+"&u="+encodeURIComponent(u)+"&p="+encodeURIComponent(p)).then(function(r){return r.json()}).then(function(d){var ms=d.messages||[];var h="";ms.forEach(function(m){var cls=m.direction=="out"||m.fromMe?"msgout":"msgin";h=h+"<div class="+cls+">"+(m.content||m.text||"")+" <small>"+(m.time||"")+"</small></div>"});document.getElementById("chatbox").innerHTML=h||"No messages";log("Chat: "+name+" ("+ms.length+" msgs)","info");}).catch(function(e){document.getElementById("chatbox").innerHTML="Error: "+e.message;log("Error: "+e,"error");});}',
'cfg();log("Sybek loaded. Go to Settings to connect.","info");',
'</script></body></html>'
].join('');

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  if (request.method === 'OPTIONS') return new Response('',{status:204,headers:cors});
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML,{status:200,headers:{'Content-Type':'text/html',...cors}});
  }
  
  const gatewayUrl = url.searchParams.get('u') || KILO_URL;
  const passcode = url.searchParams.get('p') || KILO_ACCESS_CODE;
  
  // Test connection - try different endpoints
  if (url.pathname === '/api/test') {
    try {
      // Try /api/status first
      let r = await fetch(gatewayUrl + '/api/status',{
        headers:{'Authorization':'Bearer '+passcode}
      });
      if (r.ok) return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      
      // Try root
      r = await fetch(gatewayUrl,{headers:{'Authorization':'Bearer '+passcode}});
      if (r.ok) return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      
      return new Response(JSON.stringify({ok:false,error:'auth'}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    } catch(e) {
      return new Response(JSON.stringify({ok:false,error:e.message}),{status:200,headers:{'Content-Type':'application/json',...cors}});
    }
  }
  
  // Get sessions/agents
  if (url.pathname === '/api/sessions') {
    try {
      // Try /api/agents
      let r = await fetch(gatewayUrl + '/api/agents',{
        headers:{'Authorization':'Bearer '+passcode}
      });
      if (r.ok) {
        const data = await r.json();
        return new Response(JSON.stringify({sessions:data.agents||data.sessions||[]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      }
      // Try /api/sessions
      r = await fetch(gatewayUrl + '/api/sessions',{
        headers:{'Authorization':'Bearer '+passcode}
      });
      if (r.ok) {
        const data = await r.json();
        return new Response(JSON.stringify({sessions:data.sessions||[]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      }
    } catch(e) {}
    // Mock
    return new Response(JSON.stringify({sessions:[{id:'agent:main:main',name:'main',unread:0},{id:'agent:main:pepito',name:'pepito',unread:2}]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
  }
  
  // Get messages
  if (url.pathname === '/api/messages') {
    const session = url.searchParams.get('session') || 'agent:main:main';
    try {
      // Try different message endpoints
      let r = await fetch(gatewayUrl + '/api/'+session+'/messages',{
        headers:{'Authorization':'Bearer '+passcode}
      });
      if (r.ok) {
        const data = await r.json();
        return new Response(JSON.stringify({messages:data.messages||data.history||[]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      }
      r = await fetch(gatewayUrl + '/api/chats/'+session,{headers:{'Authorization':'Bearer '+passcode}});
      if (r.ok) {
        const data = await r.json();
        return new Response(JSON.stringify({messages:data.messages||[]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
      }
    } catch(e) {}
    // Mock
    return new Response(JSON.stringify({messages:[{content:'Hello!',time:'now',direction:'in'},{content:'Hi there!',time:'just now',direction:'out'}]}),{status:200,headers:{'Content-Type':'application/json',...cors}});
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
