const http = require('http');
const { exec } = require('child_process');

const PORT = 3456;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Dashboard - OpenClaw</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #eee; min-height: 100vh; padding: 20px; }
    h1 { color: #00d9ff; margin-bottom: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat-card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; min-width: 150px; }
    .stat-card .number { font-size: 2.5em; font-weight: bold; color: #00d9ff; }
    .stat-card .label { color: #888; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #ff6b6b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333; }
    .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
    .server-card { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); transition: all 0.3s; }
    .server-card:hover { transform: translateY(-2px); border-color: #00d9ff; }
    .server-card.no-auth { border-left: 4px solid #00ff88; }
    .server-card.needs-auth { border-left: 4px solid #ffaa00; }
    .server-name { font-weight: bold; font-size: 1.1em; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .badge { font-size: 0.7em; padding: 3px 8px; border-radius: 12px; }
    .badge.no-auth { background: rgba(0,255,136,0.15); color: #00ff88; }
    .badge.needs-auth { background: rgba(255,170,0,0.15); color: #ffaa00; }
    .server-command { font-size: 0.75em; color: #888; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; }
    .actions { margin-top: 10px; display: flex; gap: 8px; }
    .btn { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8em; }
    .btn-run { background: #00ff88; color: #000; }
    .btn-tools { background: #00d9ff; color: #000; }
    .btn:hover { opacity: 0.8; }
    .output { background: #0f0f23; padding: 15px; border-radius: 8px; margin-top: 20px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 0.85em; }
    .output pre { white-space: pre-wrap; word-wrap: break-word; }
    .loading { color: #00d9ff; }
    .error { color: #ff4757; }
    .success { color: #00ff88; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; color: #888; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #16213e; color: #eee; font-size: 1em; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔌 MCP Dashboard</h1>
    <div class="stats">
      <div class="stat-card"><div class="number">52</div><div class="label">Total</div></div>
      <div class="stat-card"><div class="number" style="color:#00ff88">11</div><div class="label">Sin Auth</div></div>
      <div class="stat-card"><div class="number" style="color:#ffaa00">41</div><div class="label">Con Auth</div></div>
    </div>
    <div class="section">
      <h2>✅ Sin Credenciales</h2>
      <div class="server-grid" id="noAuthGrid"></div>
    </div>
    <div class="section">
      <h2>🔐 Requieren Credenciales</h2>
      <div class="server-grid" id="authGrid"></div>
    </div>
    <div class="section">
      <h2>📝 Ejecutar Herramienta MCP</h2>
      <div class="form-group">
        <label>Servidor:</label>
        <select id="serverSelect"><option value="">Selecciona un servidor...</option></select>
      </div>
      <div class="form-group">
        <label>Herramienta:</label>
        <select id="toolSelect" disabled><option>Selecciona un servidor primero...</option></select>
      </div>
      <div class="form-group">
        <label>Argumentos (JSON):</label>
        <input type="text" id="argsInput" placeholder='{"key": "value"}' />
      </div>
      <button class="btn btn-run" onclick="executeTool()">▶ Ejecutar</button>
    </div>
    <div class="output" id="output"><pre>Selecciona un servidor y herramienta para ejecutar...</pre></div>
  </div>
  <script>
    const noAuthServers = [
      { name: 'filesystem', cmd: '@modelcontextprotocol/server-filesystem /root' },
      { name: 'sequentialthinking', cmd: '@modelcontextprotocol/server-sequential-thinking' },
      { name: 'memory', cmd: '@modelcontextprotocol/server-memory' },
      { name: 'fetch', cmd: '@modelcontextprotocol/server-fetch' },
      { name: 'time', cmd: 'time-mcp-pypi' },
      { name: 'sqlite', cmd: '@modelcontextprotocol/server-sqlite' },
      { name: 'git', cmd: '@modelcontextprotocol/server-git' },
      { name: 'puppeteer', cmd: '@modelcontextprotocol/server-puppeteer' },
      { name: 'everything', cmd: '@modelcontextprotocol/server-everything' },
      { name: 'context7', cmd: '@upstash/context7-mcp' },
      { name: 'http', cmd: '@modelcontextprotocol/server-http' }
    ];
    const authServers = ['github', 'notion', 'postgres', 'slack', 'gmail', 'google-drive', 'linear', 'confluence', 'jira', 'mongodb', 'redis', 'elasticsearch', 'supabase', 'neon', 'stripe', 'mysql', 's3', 'firecrawl', 'apify', 'tavily'];
    const noAuthGrid = document.getElementById('noAuthGrid');
    const authGrid = document.getElementById('authGrid');
    const serverSelect = document.getElementById('serverSelect');
    noAuthServers.forEach(s => {
      noAuthGrid.innerHTML += '<div class="server-card no-auth"><div class="server-name">' + s.name + ' <span class="badge no-auth">✓</span></div><div class="server-command">' + s.cmd + '</div></div>';
      serverSelect.innerHTML += '<option value="' + s.name + '">' + s.name + '</option>';
    });
    authServers.forEach(s => {
      authGrid.innerHTML += '<div class="server-card needs-auth"><div class="server-name">' + s + ' <span class="badge needs-auth">⚠</span></div></div>';
      serverSelect.innerHTML += '<option value="' + s + '">' + s + '</option>';
    });
    const tools = {
      filesystem: ['read_file', 'write_file', 'create_directory', 'list_directory', 'move_file', 'delete'],
      memory: ['append', 'create_collection', 'delete_collection', 'list_collections', 'query'],
      fetch: ['fetch'],
      time: ['get_current_time'],
      git: ['git_status', 'git_log', 'git_diff', 'git_branch'],
      sequentialthinking: ['think'],
      sqlite: ['execute', 'query'],
      puppeteer: ['navigate', 'screenshot', 'click', 'type']
    };
    serverSelect.addEventListener('change', function() {
      const server = this.value;
      const toolSelect = document.getElementById('toolSelect');
      toolSelect.innerHTML = '';
      if (tools[server]) {
        toolSelect.disabled = false;
        tools[server].forEach(t => { toolSelect.innerHTML += '<option value="' + t + '">' + t + '</option>'; });
      } else {
        toolSelect.innerHTML = '<option>Sin herramientas</option>';
        toolSelect.disabled = true;
      }
    });
    async function executeTool() {
      const server = document.getElementById('serverSelect').value;
      const tool = document.getElementById('toolSelect').value;
      const args = document.getElementById('argsInput').value;
      const output = document.getElementById('output');
      output.innerHTML = '<span class="loading">Ejecutando...</span>';
      try {
        const response = await fetch('/execute', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ server, tool, args: args ? JSON.parse(args) : {} }) });
        const result = await response.text();
        output.innerHTML = '<pre class="success">' + result + '</pre>';
      } catch(e) { output.innerHTML = '<pre class="error">Error: ' + e.message + '</pre>'; }
    }
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  } else if (req.method === 'POST' && req.url === '/execute') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const cmd = 'mcporter call ' + data.server + '.' + data.tool + ' 2>&1';
        exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(err ? 'Error: ' + err.message + '\n' + stderr : stdout);
        });
      } catch (e) {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('Error: ' + e.message);
      }
    });
  }
});

server.listen(PORT, () => {
  console.log('MCP Dashboard running at http://localhost:' + PORT);
});
