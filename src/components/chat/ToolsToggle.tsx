// ---------------------------------------------------------------------------
// Tools Toggle Panel
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Tool, X, Check } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
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
    // Fetch available tools
    fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/tools')
      .then(res => res.json())
      .then(data => {
        setTools(data.tools || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback tools if API fails
        setTools([
          { id: 'get_current_time', name: 'Get Current Time', description: 'Get current date and time' },
          { id: 'get_weather', name: 'Get Weather', description: 'Get weather for a city' },
          { id: 'hackernews', name: 'Hacker News', description: 'Top stories from Hacker News' },
          { id: 'joke', name: 'Random Joke', description: 'Get a random joke' },
          { id: 'cat_fact', name: 'Cat Facts', description: 'Random cat fact' },
          { id: 'web_search', name: 'Web Search', description: 'Search the web' },
          { id: 'fetch_url', name: 'Fetch URL', description: 'Fetch content from URL' },
        ]);
        setLoading(false);
      });
  }, []);

  const isActive = (id: string) => activeTools.includes(id);

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
        <Tool className="w-4 h-4" />
        <span className="text-sm font-medium">Herramientas</span>
        {activeTools.length > 0 && (
          <span className="px-1.5 py-0.5 bg-purple-500/50 rounded text-xs">
            {activeTools.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-base-100 border border-purple-500/30 rounded-lg shadow-xl shadow-purple-500/10 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-purple-500/30">
            <span className="text-sm font-medium text-purple-200">Activar Herramientas</span>
            <button onClick={() => setIsOpen(false)} className="text-base-content/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tools List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-4 text-base-content/50">Cargando...</div>
            ) : (
              tools.map((tool) => (
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
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-purple-500/30 bg-base-200/50">
            <button
              onClick={() => activeTools.forEach(t => onToggle(t))}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Desactivar todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
