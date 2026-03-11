// ---------------------------------------------------------------------------
// MCP Page - Manage MCP servers and marketplace
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { 
  Server, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2,
  Search,
  Zap,
  Plug,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings2,
  Puzzle
} from 'lucide-react';
import { useMCPStore, PUBLIC_MCP_SERVERS, type MCPServer, type MCPTool } from '../../stores/mcp-store';

export function MCPPage() {
  const { 
    servers, 
    addServer, 
    removeServer, 
    toggleServer, 
    isConnecting,
    isInstalling,
    isLoadingTools,
    installAndAddServer,
    getToolsForServer,
    activeTools,
    refreshAllTools,
    fetchServerTools
  } = useMCPStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('installed');
  const [refreshingServer, setRefreshingServer] = useState<string | null>(null);
  
  // Form state
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerDescription, setNewServerDescription] = useState('');

  // Get marketplace servers (not installed)
  const marketplaceServers = PUBLIC_MCP_SERVERS.filter(
    (pub) => !servers.some((s) => s.url === pub.url)
  );

  // Filter by search
  const filteredMarketplace = marketplaceServers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstalled = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledServers = servers.filter(s => s.enabled);

  async function handleAddFromMarketplace(pubServer: typeof PUBLIC_MCP_SERVERS[0]) {
    await installAndAddServer(pubServer);
  }

  function handleAddCustomServer(e: React.FormEvent) {
    e.preventDefault();
    if (!newServerName || !newServerUrl) return;
    
    addServer({
      name: newServerName,
      url: newServerUrl,
      type: 'sse',
      enabled: false,
      description: newServerDescription || 'Custom MCP server',
    });
    
    setNewServerName('');
    setNewServerUrl('');
    setNewServerDescription('');
    setShowAddForm(false);
  }

  async function handleRefreshServer(server: MCPServer) {
    setRefreshingServer(server.id);
    try {
      const tools = await fetchServerTools(server);
      // Update tools in store
      const currentTools = useMCPStore.getState().activeTools;
      const filteredTools = currentTools.filter(t => t.serverId !== server.id);
      useMCPStore.setState({ activeTools: [...filteredTools, ...tools] });
    } catch (error) {
      console.error('Error refreshing tools:', error);
    }
    setRefreshingServer(null);
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100">
                  MCP Servers
                </h1>
                <p className="text-zinc-500 text-sm">
                  Expande las capacidades del agente con servidores MCP
                </p>
              </div>
            </div>
            
            {/* Refresh All Button */}
            {enabledServers.length > 0 && (
              <button
                onClick={() => refreshAllTools()}
                disabled={isLoadingTools}
                className="btn btn-sm btn-outline border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTools ? 'animate-spin' : ''}`} />
                Actualizar todo
              </button>
            )}
          </div>

          {/* Connection Status - Show only when servers are enabled */}
          {enabledServers.length > 0 && (
            <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-green-400">Conectado</span>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="flex gap-3 mt-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Plug className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-zinc-100">{servers.length}</div>
                <div className="text-xs text-zinc-500">Instalados</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/5 border border-green-500/20 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-green-400">{enabledServers.length}</div>
                <div className="text-xs text-green-400/60">Activos</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-400">{activeTools.length}</div>
                <div className="text-xs text-blue-400/60">Tools</div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {enabledServers.length > 0 && (
            <div className="mt-4 p-3.5 bg-green-500/5 border border-green-500/15 rounded-xl flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-300/90">
                  {enabledServers.length} servidor(es) MCP activo(s) con {activeTools.length} tools disponibles
                </p>
                <p className="text-xs text-green-400/50 mt-1">
                  Los tools están disponibles en el siguiente prompt del chat
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/50 w-fit">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'installed'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Plug className="w-4 h-4" />
            Instalados
            {servers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-700 rounded-full">
                {servers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'marketplace'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            Marketplace
            {marketplaceServers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                {marketplaceServers.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={activeTab === 'marketplace' ? "Buscar en marketplace..." : "Buscar servidores instalados..."}
            className="input input-bordered w-full pl-11 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:bg-zinc-900 transition-all h-11 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="space-y-4">
            {/* Add Custom Server Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-outline border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 w-full justify-start h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Añadir servidor personalizado
            </button>

            {/* Custom Server Form */}
            {showAddForm && (
              <form onSubmit={handleAddCustomServer} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-5 h-5 text-zinc-400" />
                  <h3 className="font-medium text-zinc-200">Nuevo servidor MCP</h3>
                </div>
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del servidor"
                    className="input input-bordered bg-zinc-950/80 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none h-11 rounded-xl"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    required
                  />
                  <input
                    type="url"
                    placeholder="URL del servidor MCP (https://... o mcporter:...)"
                    className="input input-bordered bg-zinc-950/80 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none h-11 rounded-xl"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    className="input input-bordered bg-zinc-950/80 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none h-11 rounded-xl"
                    value={newServerDescription}
                    onChange={(e) => setNewServerDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-ghost btn-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir servidor
                  </button>
                </div>
              </form>
            )}

            {/* Marketplace Servers */}
            <div className="grid gap-3">
              {filteredMarketplace.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 font-medium">Todos los servidores del marketplace están instalados</p>
                  <p className="text-sm text-zinc-600 mt-1">Añade un servidor personalizado arriba</p>
                </div>
              ) : (
                filteredMarketplace.map((server, idx) => (
                  <div
                    key={idx}
                    className="group bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl shadow-inner">
                          {server.icon || '🔌'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-100 text-lg">{server.name}</h3>
                          <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{server.description}</p>
                          <p className="text-xs text-zinc-600 mt-2 font-mono flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {server.url}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromMarketplace(server)}
                        disabled={isInstalling}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-500 border-none shrink-0 h-10 px-4"
                      >
                        {isInstalling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            Instalar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Installed Tab */}
        {activeTab === 'installed' && (
          <div className="space-y-3">
            {filteredInstalled.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                  <Plug className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 font-medium">No hay servidores instalados</p>
                <p className="text-sm text-zinc-600 mt-1">Explora el marketplace para añadir servidores</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="btn btn-outline border-zinc-700 text-zinc-400 hover:bg-zinc-800 mt-4"
                >
                  <Puzzle className="w-4 h-4 mr-2" />
                  Ver marketplace
                </button>
              </div>
            ) : (
              filteredInstalled.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  tools={getToolsForServer(server.id)}
                  onToggle={() => toggleServer(server.id)}
                  onRemove={() => removeServer(server.id)}
                  onRefresh={() => handleRefreshServer(server)}
                  isConnecting={isConnecting}
                  isRefreshing={refreshingServer === server.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Server Card Component with Tools
function ServerCard({ 
  server, 
  tools,
  onToggle, 
  onRemove,
  onRefresh,
  isConnecting,
  isRefreshing
}: { 
  server: MCPServer;
  tools: MCPTool[];
  onToggle: () => void;
  onRemove: () => void;
  onRefresh: () => void;
  isConnecting: boolean;
  isRefreshing: boolean;
}) {
  const [showTools, setShowTools] = useState(true);

  const isLoading = isConnecting || isRefreshing;

  return (
    <div className={`bg-zinc-900/60 border rounded-2xl transition-all overflow-hidden ${
      server.enabled 
        ? 'border-green-500/30 shadow-lg shadow-green-500/5' 
        : 'border-zinc-800/60 hover:border-zinc-700'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
              server.enabled ? 'bg-green-500/20' : 'bg-zinc-800'
            }`}>
              {server.icon || '🔌'}
            </div>
            
            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-zinc-100 text-lg">{server.name}</h3>
                {server.enabled && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Activo
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-1">{server.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-zinc-600 font-mono flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded">
                  <ExternalLink className="w-3 h-3" />
                  {server.url}
                </span>
                <span className="text-xs text-zinc-700">•</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wide bg-zinc-900/50 px-2 py-1 rounded">
                  {server.type}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh Button */}
            {server.enabled && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="btn btn-sm btn-ghost text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                title="Actualizar tools"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={onToggle}
              disabled={isLoading}
              className={`btn btn-sm h-10 ${
                server.enabled 
                  ? 'btn-error/20 text-red-400 hover:bg-red-500/30 border-red-500/30' 
                  : 'btn-success/20 text-green-400 hover:bg-green-500/30 border-green-500/30'
              }`}
              title={server.enabled ? 'Desactivar' : 'Activar'}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : server.enabled ? (
                <Plug className="w-4 h-4 rotate-12" />
              ) : (
                <Plug className="w-4 h-4" />
              )}
              <span className="ml-1.5">{server.enabled ? 'Desactivar' : 'Activar'}</span>
            </button>
            
            {/* Remove Button */}
            <button
              onClick={onRemove}
              className="btn btn-sm btn-ghost text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-10"
              title="Desinstalar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="border-t border-zinc-800/60">
        <button
          onClick={() => setShowTools(!showTools)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4" />
            {tools.length} tool{tools.length !== 1 ? 's' : ''} disponible{tools.length !== 1 ? 's' : ''}
          </span>
          {showTools ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {showTools && (
          <div className="px-4 pb-4 space-y-2">
            {tools.length === 0 ? (
              <div className="py-6 text-center">
                {server.enabled ? (
                  <div className="flex items-center justify-center gap-2 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando tools del servidor...</span>
                  </div>
                ) : (
                  <p className="text-zinc-600 text-sm">
                    Activa el servidor para cargar sus tools
                  </p>
                )}
              </div>
            ) : (
              tools.map((tool, idx) => (
                <ToolCard key={idx} tool={tool} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Tool Card with Input Schema Display
function ToolCard({ tool }: { tool: MCPTool }) {
  const [expanded, setExpanded] = useState(false);
  
  // Parse input schema to get parameters
  const inputSchema = tool.inputSchema as any;
  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];
  const paramCount = Object.keys(properties).length;

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/50 rounded-xl overflow-hidden hover:border-zinc-700/50 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <code className="text-sm text-blue-300 font-semibold font-mono">{tool.name}</code>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              {tool.description || 'Sin descripción'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {paramCount > 0 && (
            <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">
              {paramCount} parámetro{paramCount !== 1 ? 's' : ''}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>
      
      {/* Parameters Display */}
      {expanded && paramCount > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/50 mt-1">
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">Parámetros</p>
          <div className="space-y-2">
            {Object.entries(properties).map(([name, prop]: [string, any]) => (
              <div key={name} className="flex items-start gap-2 text-sm">
                <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  required.includes(name) 
                    ? 'bg-red-500/15 text-red-400' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {name}
                  {required.includes(name) && <span className="text-red-500/60 ml-0.5">*</span>}
                </span>
                <span className="text-zinc-500 text-xs">{prop.type}</span>
                {prop.description && (
                  <span className="text-zinc-600 text-xs">- {prop.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
