// ---------------------------------------------------------------------------
// MCP Store - Manage MCP servers and connections
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cloudflare Worker URL for MCP server management
const MCPORTER_WORKER_URL = 'https://sybek-mcporter-worker.developerjeremylive.workers.dev';

// Debug: log the actual URL being used
console.log('[MCP] Worker URL:', MCPORTER_WORKER_URL);

// Check we're using the right API
const _MCPORTER_WORKER_URL = MCPORTER_WORKER_URL;

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

// Default MCP servers - Only Puppeteer for now
export const PUBLIC_MCP_SERVERS: Omit<MCPServer, 'id' | 'createdAt'>[] = [
  {
    name: 'Puppeteer',
    url: 'mcporter:puppeteer',
    type: 'stdio',
    enabled: false,
    description: '🌐 Automatización del navegador (browser.tools)',
    icon: '🌐',
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
        
        // If it's a mcporter server, use the API
        if (server.url.startsWith('mcporter:')) {
          const serverName = server.url.replace('mcporter:', '');
          try {
            const response = await fetch(`${MCPORTER_WORKER_URL}/${serverName}/tools`);
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
          const response = await fetch(`${MCPORTER_WORKER_URL}/install`, {
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
