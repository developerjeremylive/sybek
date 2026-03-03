export default {
  async fetch(request) {
    return handleRequest(request);
  }
};

const HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sybek</title><style>body{background:#0f0f14;color:#e2e8f0;font-family:sans-serif;margin:0}.flex{display:flex}.sidebar{width:200px;background:#16161e;padding:20px}.main{flex:1;padding:20px}.nav{padding:12px;cursor:pointer;border-radius:8px;margin-bottom:4px}.nav.active{background:#6366f1;color:#fff}.page{display:none}.page.active{display:block}.card{background:#1a1a24;padding:20px;border-radius:12px;margin-bottom:16px}.btn{background:#6366f1;color:#fff;padding:12px 20px;border:none;border-radius:8px;cursor:pointer}.session{padding:12px;background:#222;border-radius:8px;margin-bottom:8px;cursor:pointer}.msg{padding:10px 14px;border-radius:12px;margin-bottom:6px;max-width:70%}.msgin{background:#222}.msgout{background:#6366f1}.input{width:100%;padding:12px;background:#222;border:1px solid #333;border-radius:8px;color:#fff;margin-bottom:12px}</style></head><body><div class="flex"><div class="sidebar"><div style="font-size:24px;font-weight:bold;color:#6366f1;margin-bottom:20px">Sybek</div><div class="nav active" data-p="telegram">Telegram</div><div class="nav" data-p="settings">Settings</div></div><div class="main"><div id="page-telegram" class="page active"><h2>Telegram Chats</h2><div class="card"><input class="input" id="apiKey" placeholder="API Key" value="7W42K-WZUVL"><button class="btn" onclick="loadChats()">Load Chats</button></div><div class="card"><div id="chatlist">Click Load to get chats</div></div><div class="card"><h3 id="chattitle">Select chat</h3><div id="chatmsg">Click a chat</div></div></div><div id="page-settings" class="page"><h2>Settings</h2><div class="card"><input class="input" id="token" value="7W42K-WZUVL"><button class="btn" onclick="saveToken()">Save</button></div></div></div></div><script>var chats=[];document.querySelectorAll(".nav").forEach(function(e){e.onclick=function(){document.querySelectorAll(".nav").forEach(function(x){x.classList.remove("active")});e.classList.add("active");document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});document.getElementById("page-"+e.dataset.p).classList.add("active")}});function saveToken(){localStorage.setItem("token",document.getElementById("token").value);alert("Saved!")}function loadChats(){var key=document.getElementById("apiKey").value;localStorage.setItem("token",key);document.getElementById("chatlist").innerHTML="Loading...";fetch("/api/chats?key="+key).then(function(r){return r.json()}).then(function(d){chats=d.chats||[];var h="";chats.forEach(function(c){h+="<div class=\"session\" onclick=\"showChat('"+c.id+"')\">"+c.name+"</div>"});document.getElementById("chatlist").innerHTML=h||"No chats"}).catch(function(e){document.getElementBy").innerHTML="Id("chatlistError: "+e}})}function showChat(id){var c=chats.find(function(x){return x.id===id});if(!c)return;document.getElementById("chattitle").innerText=c.name;fetch("/api/messages?chat="+id).then(function(r){return r.json()}).then(function(d){var msgs=d.messages||[];var h="";msgs.forEach(function(m){h+="<div class=\"msg "+(m.fromMe?"msgout":"msgin")+"\">"+m.text+"</div>"});document.getElementById("chatmsg").innerHTML=h||"No messages"}).catch(function(e){document.getElementById("chatmsg").innerHTML="Error: "+e})}</script></body></html>';

// Cloudflare Workers AI configuration
const CF_ACCOUNT_ID = 'b7a628f29ce7b9e4d28128bf5b4442b6';
const CF_API_TOKEN = 'EmLAmGq9ejsEaa7VHjxH6aGJgjoe2woyKfMXCu93';

const MODEL_ENDPOINTS = {
  '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
  '@cf/google/gemma-2-2b': '/ai/run/@cf/google/gemma-2-2b',
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const cors = {'Access-Control-Allow-Origin':'*'};
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, {status:200, headers:{'Content-Type':'text/html',...cors}});
  }
  
  // Workers AI endpoint
  if (url.pathname === '/api/ai') {
    const body = await request.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({error: 'Invalid JSON'}), {status:400, headers:{'Content-Type':'application/json',...cors}});
    }
    
    const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
    const endpoint = MODEL_ENDPOINTS[model] || '/ai/run/' + model;
    const workersAiUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}${endpoint}`;
    
    try {
      const response = await fetch(workersAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CF_API_TOKEN}`,
        },
        body: JSON.stringify({
          messages: jsonBody.messages || [],
          max_tokens: jsonBody.max_tokens || 1024,
        }),
      });
      
      const responseData = await response.json();
      
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {'Content-Type':'application/json',...cors},
      });
    } catch (e) {
      return new Response(JSON.stringify({error: e.message}), {status:500, headers:{'Content-Type':'application/json',...cors}});
    }
  }
  
  const key = url.searchParams.get('key') || '7W42K-WZUVL';
  
  // Get chats
  if (url.pathname === '/api/chats') {
    try {
      const res = await fetch('https://claw.kilosessions.ai/api/chats', {
        headers: {'Authorization': 'Bearer ' + key}
      });
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({chats: data.chats || data.sessions || []}), {status:200, headers:{'Content-Type':'application/json',...cors}});
      }
    } catch(e) {}
    return new Response(JSON.stringify({chats:[{id:'pepito',name:'pepito'},{id:'main',name:'main'}]}), {status:200, headers:{'Content-Type':'application/json',...cors}});
  }
  
  // Get messages
  if (url.pathname === '/api/messages') {
    const chat = url.searchParams.get('chat') || 'pepito';
    try {
      const res = await fetch('https://claw.kilosessions.ai/api/chats/'+chat+'/messages', {
        headers: {'Authorization': 'Bearer ' + key}
      });
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({messages: data.messages || []}), {status:200, headers:{'Content-Type':'application/json',...cors}});
      }
    } catch(e) {}
    const mock = {
      pepito: [{text:'Hola!',fromMe:false},{text:'Hola!',fromMe:true},{text:'Como estas?',fromMe:false},{text:'Bien!',fromMe:true}],
      main: [{text:'Hello',fromMe:false},{text:'Hi!',fromMe:true}]
    };
    return new Response(JSON.stringify({messages: mock[chat] || []}), {status:200, headers:{'Content-Type':'application/json',...cors}});
  }
  
  return new Response('Not Found', {status:404});
}
