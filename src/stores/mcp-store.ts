// ---------------------------------------------------------------------------
// MCP Store - Manage MCP servers and connections
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Direct Worker URL - NO PROXY
const WORKER_URL = 'https://sybek-mcporter-worker.developerjeremylive.workers.dev';

// Debug
console.log('[MCP] Using Worker URL:', WORKER_URL);

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'sse' | 'http' | 'stdio';
  enabled: boolean;
  description?: string;
  icon?: string;
  createdAt: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
  serverName: string;
}

// Default MCP servers
export const PUBLIC_MCP_SERVERS: Omit<MCPServer, 'id' | 'createdAt'>[] = [
  {
    name: 'Puppeteer',
    url: 'mcporter:puppeteer',
    type: 'stdio',
    enabled: false,
    description: '🌐 Automatización del navegador (browser.tools)',
    icon: '🌐',
  },
  {
    name: 'Cloudflare Browser Rendering',
    url: 'cf-browser-rendering',
    type: 'http',
    enabled: false,
    description: '☁️ REST API para screenshots, HTML, PDF, crawling con Cloudflare',
    icon: '☁️',
  },
];

// Cloudflare Browser Rendering Worker URL
const CF_BROWSER_WORKER_URL = 'https://sybek-mcporter-worker.b7a628f29ce7b9e4d28128bf5b4442b6.workers.dev';

// Cloudflare Browser Rendering Tools
export const CF_BROWSER_TOOLS = [
  {
    name: 'cf_screenshot',
    description: 'Captura una screenshot de una página web',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página a capturar' },
        options: { type: 'object', description: 'Opciones: format, fullPage, quality' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_html',
    description: 'Obtiene el HTML de una página web',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_markdown',
    description: 'Extrae el contenido en Markdown de una página web',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_pdf',
    description: 'Renderiza una página web como PDF',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página' },
        options: { type: 'object', description: 'Opciones: format, landscape, printBackground' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_links',
    description: 'Obtiene todos los enlaces de una página web',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_json',
    description: 'Extrae datos estructurados usando IA (JSON)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página' },
        prompt: { type: 'string', description: 'Prompt para extracción' },
        response_format: { type: 'object', description: 'JSON schema' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_crawl',
    description: 'Inicia un trabajo de crawl (asíncrono)',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL inicial para crawling' },
        limit: { type: 'number', description: 'Máximo de páginas' },
        depth: { type: 'number', description: 'Profundidad máxima' },
      },
      required: ['url'],
    },
  },
  {
    name: 'cf_crawl_status',
    description: 'Obtiene el estado/resultados de un trabajo de crawl',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'ID del trabajo de crawl' },
        limit: { type: 'number', description: 'Límite de resultados' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'cf_crawl_cancel',
    description: 'Cancela un trabajo de crawl en progreso',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'ID del trabajo de crawl' },
      },
      required: ['jobId'],
    },
  },
];

interface MCPState {
  servers: MCPServer[];
  activeTools: MCPTool[];
  isConnecting: boolean;
  isLoadingTools: boolean;
  isInstalling: boolean;
  installationError: string | null;
  
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt'>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => Promise<void>;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
  fetchServerTools: (server: MCPServer) => Promise<MCPTool[]>;
  refreshAllTools: () => Promise<void>;
  installAndAddServer: (pubServer: typeof PUBLIC_MCP_SERVERS[0]) => Promise<void>;
  getToolsForServer: (serverId: string) => MCPTool[];
}

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeTools: [],
      isConnecting: false,
      isLoadingTools: false,
      isInstalling: false,
      installationError: null,

      addServer: (serverData) => {
        const server: MCPServer = {
          ...serverData,
          id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
        };
        set((state) => ({ servers: [...state.servers, server] }));
      },

      removeServer: (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (server?.enabled) {
          get().disconnectServer(id);
        }
        set((state) => ({ 
          servers: state.servers.filter((s) => s.id !== id),
          activeTools: state.activeTools.filter((t) => t.serverId !== id),
        }));
      },

      toggleServer: async (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (!server) return;
        if (server.enabled) {
          get().disconnectServer(id);
        } else {
          await get().connectServer(id);
        }
      },

      connectServer: async (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (!server) return;
        set({ isConnecting: true });
        console.log('[MCP] Connecting to', server.name);

        try {
          const tools = await get().fetchServerTools(server);
          console.log('[MCP] Tools fetched:', tools.length);
          
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === id ? { ...s, enabled: true } : s
            ),
            activeTools: [...state.activeTools.filter(t => t.serverId !== id), ...tools],
            isConnecting: false,
          }));
        } catch (error) {
          console.error('[MCP] Error:', error);
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === id ? { ...s, enabled: true } : s
            ),
            isConnecting: false,
          }));
        }
      },

      disconnectServer: (id) => {
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id ? { ...s, enabled: false } : s
          ),
          activeTools: state.activeTools.filter((t) => t.serverId !== id),
        }));
      },

      fetchServerTools: async (server: MCPServer): Promise<MCPTool[]> => {
        console.log('[MCP] fetchServerTools called for', server.name, 'URL:', server.url);
        
        // Cloudflare Browser Rendering - return built-in tools
        if (server.url === 'cf-browser-rendering') {
          return CF_BROWSER_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            serverId: server.id,
            serverName: server.name,
          }));
        }
        
        if (server.url.startsWith('mcporter:')) {
          const serverName = server.url.replace('mcporter:', '');
          const url = `${WORKER_URL}/${serverName}/tools`;
          console.log('[MCP] Fetching from:', url);
          
          try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('[MCP] Response:', data);
            
            if (data.tools && Array.isArray(data.tools)) {
              return data.tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description || '',
                inputSchema: tool.inputSchema || {},
                serverId: server.id,
                serverName: server.name,
              }));
            }
            return [];
          } catch (error) {
            console.error('[MCP] Fetch error:', error);
            return [];
          }
        }
        return [];
      },

      refreshAllTools: async () => {
        const enabledServers = get().servers.filter((s) => s.enabled);
        set({ isLoadingTools: true });
        
        const allTools: MCPTool[] = [];
        for (const server of enabledServers) {
          const tools = await get().fetchServerTools(server);
          allTools.push(...tools);
        }
        
        set({ activeTools: allTools, isLoadingTools: false });
      },

      installAndAddServer: async (pubServer) => {
        // Cloudflare Browser Rendering doesn't need installation - just add it
        if (pubServer.url === 'cf-browser-rendering') {
          get().addServer({
            ...pubServer,
            enabled: false,
          });
          return;
        }
        
        const serverName = pubServer.url.replace('mcporter:', '');
        set({ isInstalling: true, installationError: null });
        
        console.log('[MCP] Installing from:', WORKER_URL, '/install');
        
        try {
          const response = await fetch(`${WORKER_URL}/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server: serverName }),
          });
          
          const result = await response.json();
          console.log('[MCP] Install result:', result);
          
          if (!response.ok) {
            throw new Error(result.error || 'Error');
          }
          
          get().addServer({
            ...pubServer,
            enabled: false,
          });
          
          set({ isInstalling: false });
        } catch (error) {
          console.error('[MCP] Install error:', error);
          set({ 
            isInstalling: false, 
            installationError: error instanceof Error ? error.message : 'Error' 
          });
        }
      },

      getToolsForServer: (serverId: string): MCPTool[] => {
        return get().activeTools.filter(t => t.serverId === serverId);
      },
    }),
    { name: 'obc-mcp-servers' }
  )
);

// Helper functions
export function getEnabledMCPServers(): MCPServer[] {
  return useMCPStore.getState().servers.filter((s) => s.enabled);
}

export function getActiveMCPTools(): MCPTool[] {
  return useMCPStore.getState().activeTools;
}
