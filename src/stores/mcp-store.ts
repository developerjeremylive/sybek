// ---------------------------------------------------------------------------
// MCP Store - Manage MCP servers and connections
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'sse' | 'http';
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
  connectionError: string | null;
  
  // Actions
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt'>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
  setServers: (servers: MCPServer[]) => void;
  fetchServerTools: (server: MCPServer) => Promise<MCPTool[]>;
  refreshAllTools: () => Promise<void>;
}

// Default public MCP servers (no credentials needed)
export const PUBLIC_MCP_SERVERS: Omit<MCPServer, 'id' | 'createdAt'>[] = [
  {
    name: 'Filesystem',
    url: 'https://mcp.shyhi.com/filesystem',
    type: 'sse',
    enabled: false,
    description: 'Read, write and manage files on your system',
    icon: '📁',
  },
  {
    name: 'GitHub',
    url: 'https://mcp.shyhi.com/github',
    type: 'sse',
    enabled: false,
    description: 'Manage GitHub repositories, issues and PRs',
    icon: '🐙',
  },
  {
    name: 'Brave Search',
    url: 'https://mcp.shyhi.com/brave-search',
    type: 'sse',
    enabled: false,
    description: 'Web search using Brave Search API',
    icon: '🔍',
  },
  {
    name: 'Sequential Thinking',
    url: 'https://mcp.shyhi.com/sequential-thinking',
    type: 'sse',
    enabled: false,
    description: 'Tools for sequential thinking and reasoning',
    icon: '🧠',
  },
  {
    name: 'Time',
    url: 'https://mcp.shyhi.com/time',
    type: 'sse',
    enabled: false,
    description: 'Get current time and date information',
    icon: '⏰',
  },
  {
    name: 'Puppeteer',
    url: 'https://mcp.shyhi.com/puppeteer',
    type: 'sse',
    enabled: false,
    description: 'Browser automation with Puppeteer',
    icon: '🌐',
  },
  {
    name: 'SQLite',
    url: 'https://mcp.shyhi.com/sqlite',
    type: 'sse',
    enabled: false,
    description: 'Query and manage SQLite databases',
    icon: '🗄️',
  },
  {
    name: 'Every',
    url: 'https://mcp.shyhi.com/every',
    type: 'sse',
    enabled: false,
    description: 'Useful utilities and helpers',
    icon: '🛠️',
  },
];

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeTools: [],
      isConnecting: false,
      isLoadingTools: false,
      connectionError: null,

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

        set({ isConnecting: true, connectionError: null });
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
        console.log(`[MCP] Fetching tools from ${server.name} at ${server.url}`);
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
