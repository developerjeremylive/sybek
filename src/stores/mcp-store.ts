// ---------------------------------------------------------------------------
// MCP Store - Manage MCP servers and connections
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// MCP API base URL - uses external API for mcporter
const MCP_API_BASE = 'https://sybek.pages.dev';

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

// MCP Protocol types
interface MCPListToolsResponse {
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
  }>;
}

interface MCPState {
  servers: MCPServer[];
  activeTools: MCPTool[];
  isConnecting: boolean;
  isLoadingTools: boolean;
  isInstalling: boolean;
  installationError: string | null;
  
  // Actions
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt'>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => Promise<void>;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
  setServers: (servers: MCPServer[]) => void;
  fetchServerTools: (server: MCPServer) => Promise<MCPTool[]>;
  refreshAllTools: () => Promise<void>;
  installAndAddServer: (pubServer: typeof PUBLIC_MCP_SERVERS[0]) => Promise<void>;
  getToolsForServer: (serverId: string) => MCPTool[];
}

// Cloudflare Browser Rendering Worker URL - configurable
const CF_BROWSER_WORKER_URL = 'https://sybek-mcporter-worker.b7a628f29ce7b9e4d28128bf5b4442b6.workers.dev';

// Default MCP servers - Puppeteer + Cloudflare Browser Rendering
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

// Cloudflare Browser Rendering Tools - these are called directly via REST API
export const CF_BROWSER_TOOLS = [
  {
    name: 'cf_screenshot',
    description: 'Captura una screenshot de una página web',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL de la página a capturar' },
        options: { type: 'object', description: 'Opciones: format (png/jpeg), fullPage, quality' },
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
        options: { type: 'object', description: 'Opciones: js (bool), skipImages (bool)' },
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
        options: { type: 'object', description: 'Opciones: format, landscape, printBackground, margin' },
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
        response_format: { type: 'object', description: 'JSON schema para el formato de respuesta' },
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
        limit: { type: 'number', description: 'Máximo de páginas (default 10)' },
        depth: { type: 'number', description: 'Profundidad máxima (default 2)' },
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
        status: { type: 'string', description: 'Filtrar por status: queued, completed, errored' },
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
        jobId: { type: 'string', description: 'ID del trabajo de crawl a cancelar' },
      },
      required: ['jobId'],
    },
  },
];

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

      updateServer: (id, updates) => {
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      connectServer: async (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (!server) return;

        set({ isConnecting: true });
        console.log(`[MCP] Conectando a ${server.name} (${server.url})...`);

        try {
          // Try to fetch tools from MCP server using JSON-RPC
          const tools = await get().fetchServerTools(server);
          console.log(`[MCP] ${server.name} - Tools obtenidos:`, tools.length, tools.map(t => t.name));
          
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === id ? { ...s, enabled: true } : s
            ),
            activeTools: [...state.activeTools.filter(t => t.serverId !== id), ...tools],
            isConnecting: false,
          }));
        } catch (error) {
          console.error(`[MCP] Error conectando a ${server.name}:`, error);
          // Even if tools fail, mark as enabled
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

      setServers: (servers) => set({ servers }),

      fetchServerTools: async (server: MCPServer): Promise<MCPTool[]> => {
        console.log(`[MCP] Fetching tools from ${server.name} via mcporter`);
        
        // If it's a Cloudflare Browser Rendering server
        if (server.url === 'cf-browser-rendering') {
          console.log(`[MCP] Returning CF Browser Rendering tools:`, CF_BROWSER_TOOLS.length);
          return CF_BROWSER_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            serverId: server.id,
            serverName: server.name,
          }));
        }
        
        // If it's a mcporter server, use the API
        if (server.url.startsWith('mcporter:')) {
          const serverName = server.url.replace('mcporter:', '');
          try {
            const response = await fetch(`${MCP_API_BASE}/api/mcporter/${serverName}/tools`);
            const data = await response.json();
            
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
            console.error(`[MCP] Failed to fetch tools from mcporter ${server.name}:`, error);
            return [];
          }
        }
        
        // Fallback: try HTTP connection for non-mcporter servers
        try {
          // MCP protocol: POST to server with JSON-RPC request for tools
          const response = await fetch(server.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/list',
              params: {},
            }),
            signal: AbortSignal.timeout(10000),
          });

          console.log(`[MCP] ${server.name} response status:`, response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json() as MCPListToolsResponse;
          console.log(`[MCP] ${server.name} response data:`, data);
          
          if (data.tools && Array.isArray(data.tools)) {
            return data.tools.map((tool) => ({
              name: tool.name,
              description: tool.description || '',
              inputSchema: tool.inputSchema || {},
              serverId: server.id,
              serverName: server.name,
            }));
          }
          
          // Check for error response
          if ((data as any).error) {
            console.error(`[MCP] ${server.name} error:`, (data as any).error);
          }
          
          return [];
        } catch (error) {
          console.error(`[MCP] Failed to fetch tools from ${server.name}:`, error);
          return [];
        }
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
        const serverName = pubServer.url.replace('mcporter:', '');
        set({ isInstalling: true, installationError: null });
        
        console.log(`[MCP] Instalando ${serverName} con mcporter...`);
        
        try {
          // Call the mcporter API to install the server
          const response = await fetch(`${MCP_API_BASE}/api/mcporter/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server: serverName }),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Error al instalar');
          }
          
          console.log(`[MCP] ${serverName} instalado:`, result);
          
          // Add the server to installed list
          get().addServer({
            ...pubServer,
            enabled: false,
          });
          
          set({ isInstalling: false });
        } catch (error) {
          console.error(`[MCP] Error instalando ${serverName}:`, error);
          set({ 
            isInstalling: false, 
            installationError: error instanceof Error ? error.message : 'Error desconocido' 
          });
        }
      },

      getToolsForServer: (serverId: string): MCPTool[] => {
        return get().activeTools.filter(t => t.serverId === serverId);
      },
    }),
    {
      name: 'obc-mcp-servers',
    }
  )
);

// Helper to get enabled servers
export function getEnabledMCPServers(): MCPServer[] {
  return useMCPStore.getState().servers.filter((s) => s.enabled);
}

// Helper to get active MCP tools
export function getActiveMCPTools(): MCPTool[] {
  return useMCPStore.getState().activeTools;
}
