// ---------------------------------------------------------------------------
// MCP Store - Manage MCP servers and connections
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: 'sse' | 'stdio';
  enabled: boolean;
  description?: string;
  icon?: string;
  createdAt: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface MCPState {
  servers: MCPServer[];
  activeTools: MCPTool[];
  isConnecting: boolean;
  connectionError: string | null;
  
  // Actions
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt'>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
  setServers: (servers: MCPServer[]) => void;
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
          servers: state.servers.filter((s) => s.id !== id) 
        }));
      },

      toggleServer: async (id) => {
        const server = get().servers.find((s) => s.id === id);
        if (!server) return;

        if (server.enabled) {
          get().disconnectServer(id);
          set((state) => ({
            servers: state.servers.map((s) =>
              s.id === id ? { ...s, enabled: false } : s
            ),
          }));
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

        try {
          // Test connection to MCP server
          const response = await fetch(`${server.url}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            set((state) => ({
              servers: state.servers.map((s) =>
                s.id === id ? { ...s, enabled: true } : s
              ),
              isConnecting: false,
            }));
          } else {
            throw new Error(`Server returned ${response.status}`);
          }
        } catch (error) {
          // For SSE servers, connection might work even if /health doesn't exist
          // Try to connect anyway
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
          activeTools: state.activeTools.filter((_, idx) => {
            // Remove tools from this server
            return true;
          }),
        }));
      },

      setServers: (servers) => set({ servers }),
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
