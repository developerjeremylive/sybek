// ---------------------------------------------------------------------------
// MCP Page - Manage MCP servers and marketplace
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { 
  Server, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Check, 
  X, 
  Loader2,
  Search,
  Zap,
  Plug,
  Unplug
} from 'lucide-react';
import { useMCPStore, PUBLIC_MCP_SERVERS, type MCPServer } from '../../stores/mcp-store';

export function MCPPage() {
  const { servers, addServer, removeServer, toggleServer, isConnecting } = useMCPStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace');
  
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

  function handleAddFromMarketplace(pubServer: typeof PUBLIC_MCP_SERVERS[0]) {
    addServer({
      ...pubServer,
      enabled: false,
    });
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

  return (
    <div className="h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
            <Server className="w-7 h-7" />
            MCP Servers
          </h1>
          <p className="text-zinc-500 mt-2">
            Conecta servidores MCP para expandir las capacidades del agente
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'marketplace'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'installed'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plug className="w-4 h-4 inline mr-2" />
            Instalados ({servers.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar servidores..."
            className="input input-bordered w-full pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
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
              className="btn btn-outline border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir servidor personalizado
            </button>

            {/* Custom Server Form */}
            {showAddForm && (
              <form onSubmit={handleAddCustomServer} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-zinc-200">Nuevo servidor MCP</h3>
                <div className="grid gap-3">
                  <input
                    type="text"
                    placeholder="Nombre del servidor"
                    className="input input-bordered bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    required
                  />
                  <input
                    type="url"
                    placeholder="URL del servidor (https://...)"
                    className="input input-bordered bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    className="input input-bordered bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    value={newServerDescription}
                    onChange={(e) => setNewServerDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-ghost btn-sm text-zinc-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Añadir
                  </button>
                </div>
              </form>
            )}

            {/* Marketplace Servers */}
            <div className="grid gap-3">
              {filteredMarketplace.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Todos los servidores del marketplace están instalados</p>
                </div>
              ) : (
                filteredMarketplace.map((server, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl">
                          {server.icon || '🔌'}
                        </div>
                        <div>
                          <h3 className="font-medium text-zinc-100">{server.name}</h3>
                          <p className="text-sm text-zinc-500 mt-0.5">{server.description}</p>
                          <p className="text-xs text-zinc-600 mt-1 font-mono">{server.url}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromMarketplace(server)}
                        className="btn btn-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-none shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        Instalar
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
              <div className="text-center py-12 text-zinc-500">
                <Plug className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay servidores instalados</p>
                <p className="text-sm mt-1">Instala desde el marketplace</p>
              </div>
            ) : (
              filteredInstalled.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onToggle={() => toggleServer(server.id)}
                  onRemove={() => removeServer(server.id)}
                  isConnecting={isConnecting}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Server Card Component
function ServerCard({ 
  server, 
  onToggle, 
  onRemove,
  isConnecting 
}: { 
  server: MCPServer;
  onToggle: () => void;
  onRemove: () => void;
  isConnecting: boolean;
}) {
  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 transition-colors ${
      server.enabled ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            server.enabled ? 'bg-green-500/20' : 'bg-zinc-800'
          }`}>
            {server.icon || '🔌'}
          </div>
          <div>
            <h3 className="font-medium text-zinc-100 flex items-center gap-2">
              {server.name}
              {server.enabled && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">{server.description}</p>
            <p className="text-xs text-zinc-600 mt-1 font-mono flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {server.url}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle Button */}
          <button
            onClick={onToggle}
            disabled={isConnecting}
            className={`btn btn-sm ${
              server.enabled 
                ? 'btn-error/20 text-red-400 hover:bg-red-500/20 border-red-500/30' 
                : 'btn-success/20 text-green-400 hover:bg-green-500/20 border-green-500/30'
            }`}
            title={server.enabled ? 'Desactivar' : 'Activar'}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : server.enabled ? (
              <Unplug className="w-4 h-4" />
            ) : (
              <Plug className="w-4 h-4" />
            )}
          </button>
          
          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="btn btn-sm btn-ghost text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
            title="Desinstalar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
