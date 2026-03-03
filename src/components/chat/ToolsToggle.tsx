// ---------------------------------------------------------------------------
// Tools Toggle Panel - with MCP and Native tools
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Wrench, X, Check, Zap } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'mcp' | 'native';
}

interface Props {
  activeTools: string[];
  onToggle: (toolId: string) => void;
}

export function ToolsToggle({ activeTools, onToggle }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available tools from API
    fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/tools')
      .then(res => res.json())
      .then(data => {
        setTools(data.tools || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback tools
        setTools([
          { id: 'get_current_time', name: 'Get Current Time', description: 'Get current date and time', type: 'mcp' },
          { id: 'get_weather', name: 'Get Weather', description: 'Get weather for a city', type: 'mcp' },
          { id: 'hackernews', name: 'Hacker News', description: 'Top stories from Hacker News', type: 'mcp' },
          { id: 'joke', name: 'Random Joke', description: 'Get a random joke', type: 'mcp' },
          { id: 'cat_fact', name: 'Cat Facts', description: 'Random cat fact', type: 'mcp' },
          { id: 'web_search', name: 'Web Search', description: 'Search the web', type: 'mcp' },
          { id: 'fetch_url', name: 'Fetch URL', description: 'Native Workers AI tool', type: 'native' },
        ]);
        setLoading(false);
      });
  }, []);

  const isActive = (id: string) => activeTools.includes(id);

  const mcpTools = tools.filter(t => t.type === 'mcp');
  const nativeTools = tools.filter(t => t.type === 'native');

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          activeTools.length > 0
            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
            : 'bg-base-200 border-base-300 text-base-content/70 hover:border-purple-500/30'
        }`}
      >
        <Wrench className="w-4 h-4" />
        <span className="text-sm font-medium">Herramientas</span>
        {activeTools.length > 0 && (
          <span className="px-1.5 py-0.5 bg-purple-500/50 rounded text-xs">
            {activeTools.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-base-100 border border-purple-500/30 rounded-lg shadow-xl shadow-purple-500/10 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-purple-500/30">
            <span className="text-sm font-medium text-purple-200">Activar Herramientas</span>
            <button onClick={() => setIsOpen(false)} className="text-base-content/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tools List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-4 text-base-content/50">Cargando...</div>
            ) : (
              <>
                {/* MCP Tools Section */}
                {mcpTools.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-cyan-400 uppercase">
                      <Zap className="w-3 h-3" />
                      MCP Tools
                    </div>
                    {mcpTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onToggle(tool.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all ${
                          isActive(tool.id)
                            ? 'bg-purple-500/30 border border-purple-500/50'
                            : 'bg-base-200/50 border border-transparent hover:bg-base-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          isActive(tool.id) ? 'bg-purple-500 text-white' : 'bg-base-300 text-base-content/50'
                        }`}>
                          {isActive(tool.id) ? <Check className="w-3 h-3" /> : null}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-base-content">{tool.name}</div>
                          <div className="text-xs text-base-content/50">{tool.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Native Tools Section */}
                {nativeTools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-emerald-400 uppercase">
                      <Zap className="w-3 h-3" />
                      Herramientas Nativas
                    </div>
                    {nativeTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onToggle(tool.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all ${
                          isActive(tool.id)
                            ? 'bg-emerald-500/30 border border-emerald-500/50'
                            : 'bg-base-200/50 border border-transparent hover:bg-base-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          isActive(tool.id) ? 'bg-emerald-500 text-white' : 'bg-base-300 text-base-content/50'
                        }`}>
                          {isActive(tool.id) ? <Check className="w-3 h-3" /> : null}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-base-content">{tool.name}</div>
                          <div className="text-xs text-base-content/50">{tool.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-purple-500/30 bg-base-200/50 flex justify-between">
            <button
              onClick={() => activeTools.forEach(t => onToggle(t))}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Desactivar todas
            </button>
            <span className="text-xs text-base-content/50">
              {activeTools.length} activa(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
