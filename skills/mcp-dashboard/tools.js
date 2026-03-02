import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';

export const mcp_dashboard = {
  description: 'Genera una página HTML con el dashboard de MCP servers',
  parameters: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    try {
      // Read MCP config
      const configPath = '/root/.openclaw/workspace/config/mcporter.json';
      let servers = {};
      
      try {
        const configContent = await readFile(configPath, 'utf-8');
        servers = JSON.parse(configContent).mcpServers || {};
      } catch (e) {
        // Config might not exist yet
      }

      // Categorize servers
      const noAuthServers = [
        'filesystem', 'sequentialthinking', 'memory', 'fetch', 
        'time', 'sqlite', 'git', 'puppeteer', 'everything'
      ];
      
      const serverList = Object.entries(servers).map(([name, config]) => {
        const command = config.command || '';
        const canRunWithoutAuth = noAuthServers.some(s => command.includes(s));
        
        return {
          name,
          command,
          type: canRunWithoutAuth ? 'Sin credenciales' : 'Requiere credenciales',
          canRunWithoutAuth,
          status: 'configurado'
        };
      });

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
      padding: 20px;
    }
    h1 { 
      color: #00d9ff; 
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #16213e;
      padding: 20px;
      border-radius: 12px;
      min-width: 150px;
    }
    .stat-card .number {
      font-size: 2em;
      font-weight: bold;
      color: #00d9ff;
    }
    .stat-card .label { color: #888; }
    .section { margin-bottom: 30px; }
    .section h2 { 
      color: #ff6b6b; 
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    .server-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
    }
    .server-card {
      background: #16213e;
      padding: 15px;
      border-radius: 10px;
      border: 1px solid #333;
      transition: transform 0.2s, border-color 0.2s;
    }
    .server-card:hover {
      transform: translateY(-2px);
      border-color: #00d9ff;
    }
    .server-card.no-auth { border-left: 3px solid #00ff88; }
    .server-card.needs-auth { border-left: 3px solid #ffaa00; }
    .server-name {
      font-weight: bold;
      font-size: 1.1em;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .badge {
      font-size: 0.7em;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: normal;
    }
    .badge.no-auth { background: #00ff8833; color: #00ff88; }
    .badge.needs-auth { background: #ffaa0033; color: #ffaa00; }
    .server-command {
      font-size: 0.75em;
      color: #888;
      background: #0f0f23;
      padding: 8px;
      border-radius: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .actions {
      margin-top: 10px;
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8em;
      transition: background 0.2s;
    }
    .btn-enable { background: #00ff88; color: #000; }
    .btn-disable { background: #ff4757; color: #fff; }
    .btn-info { background: #00d9ff; color: #000; }
    .btn:hover { opacity: 0.8; }
    .empty { text-align: center; padding: 40px; color: #666; }
  </style>
</head>
<body>
  <h1>🔌 MCP Dashboard</h1>
  
  <div class="stats">
    <div class="stat-card">
      <div class="number">${serverList.length}</div>
      <div class="label">Total Servidores</div>
    </div>
    <div class="stat-card">
      <div class="number" style="color: #00ff88">${serverList.filter(s => s.canRunWithoutAuth).length}</div>
      <div class="label">Sin Credenciales</div>
    </div>
    <div class="stat-card">
      <div class="number" style="color: #ffaa00">${serverList.filter(s => !s.canRunWithoutAuth).length}</div>
      <div class="label">Requieren Credenciales</div>
    </div>
  </div>

  <div class="section">
    <h2>✅ Sin Credenciales</h2>
    <div class="server-grid">
      ${serverList.filter(s => s.canRunWithoutAuth).map(s => \`
        <div class="server-card no-auth">
          <div class="server-name">
            ${s.name}
            <span class="badge no-auth">✓ Listo</span>
          </div>
          <div class="server-command">${s.command}</div>
          <div class="actions">
            <button class="btn btn-info" onclick="alert('Herramientas: usa mcporter list ${s.name}')">Info</button>
          </div>
        </div>
      \`).join('')}
      ${serverList.filter(s => s.canRunWithoutAuth).length === 0 ? '<div class="empty">No hay servidores sin credenciales configurados</div>' : ''}
    </div>
  </div>

  <div class="section">
    <h2>🔐 Requieren Credenciales</h2>
    <div class="server-grid">
      ${serverList.filter(s => !s.canRunWithoutAuth).map(s => \`
        <div class="server-card needs-auth">
          <div class="server-name">
            ${s.name}
            <span class="badge needs-auth">⚠ Configurar</span>
          </div>
          <div class="server-command">${s.command}</div>
          <div class="actions">
            <button class="btn btn-info" onclick="alert('Configura las credenciales y luego usa: mcporter auth ${s.name}')">Configurar</button>
          </div>
        </div>
      \`).join('')}
      ${serverList.filter(s => !s.canRunWithoutAuth).length === 0 ? '<div class="empty">No hay servidores que requieran credenciales</div>' : ''}
    </div>
  </div>

  <div class="section">
    <h2>➕ Añadir Nuevo Servidor MCP</h2>
    <div style="background: #16213e; padding: 20px; border-radius: 10px;">
      <p style="margin-bottom: 15px; color: #888;">Usa estos comandos para añadir nuevos servidores:</p>
      <code style="display: block; background: #0f0f23; padding: 10px; border-radius: 6px; margin-bottom: 10px; font-size: 0.85em;">
        mcporter config add filesystem "npx -y @modelcontextprotocol/server-filesystem /root"
      </code>
      <code style="display: block; background: #0f0f23; padding: 10px; border-radius: 6px; margin-bottom: 10px; font-size: 0.85em;">
        mcporter config add sequentialthinking "npx -y @modelcontextprotocol/server-sequential-thinking"
      </code>
      <code style="display: block; background: #0f0f23; padding: 10px; border-radius: 6px; margin-bottom: 10px; font-size: 0.85em;">
        mcporter config add memory "npx -y @modelcontextprotocol/server-memory"
      </code>
      <code style="display: block; background: #0f0f23; padding: 10px; border-radius: 6px; font-size: 0.85em;">
        mcporter config add time "npx -y time-mcp-pypi"
      </code>
    </div>
  </div>
</body>
</html>`;

      return { 
        success: true, 
        html,
        serverCount: serverList.length,
        noAuthCount: serverList.filter(s => s.canRunWithoutAuth).length,
        needsAuthCount: serverList.filter(s => !s.canRunWithoutAuth).length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
