// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat input
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Wrench, X } from 'lucide-react';

interface Props {
  onSend: (text: string, tools?: string[]) => void;
  disabled: boolean;
  initialValue?: string;
}

// MCP tools available by default in Workers AI
const AVAILABLE_TOOLS = [
  { id: 'get_current_time', name: 'Hora actual', description: 'Obtiene la fecha y hora actual', icon: '🕐' },
  { id: 'get_weather', name: 'Clima', description: 'Obtiene el clima de una ciudad', icon: '🌤️' },
  { id: 'joke', name: 'Chiste', description: 'Chiste aleatorio', icon: '😂' },
  { id: 'cat_fact', name: 'Dato gato', description: 'Dato curioso de gatos', icon: '🐱' },
  { id: 'hackernews', name: 'HN News', description: 'Top noticias de Hacker News', icon: '📰' },
  // Native agent tools
  { id: 'web_search', name: 'Web Search', description: 'Búsqueda web (herramienta nativa)', icon: '🔍' },
  { id: 'fetch_url', name: 'Fetch URL', description: 'Obtener contenido de URL (herramienta nativa)', icon: '📄' },
];

function ToolsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-base-100 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-purple-200">Herramientas Disponibles</span>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-purple-300 border-b border-purple-500/20">
                <th className="pb-2 font-medium">Tool</th>
                <th className="pb-2 font-medium">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {AVAILABLE_TOOLS.map((tool) => (
                <tr key={tool.id} className="border-b border-purple-500/10">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span>{tool.icon}</span>
                      <span className="font-mono text-purple-300">{tool.id}</span>
                    </div>
                  </td>
                  <td className="py-2 text-base-content/70">{tool.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 bg-base-200/50 text-center text-xs text-base-content/50">
          Estas herramientas están disponibles por defecto en Workers AI
        </div>
      </div>
    </div>
  );
}

export function ChatInput({ onSend, disabled, initialValue }: Props) {
  const [text, setText] = useState('');
  const [showToolsModal, setShowToolsModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set initial value from prop
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [initialValue]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 p-4 pb-2">
        {/* MCP Tools available - clickable display */}
        <button
          onClick={() => setShowToolsModal(true)}
          className="flex items-center gap-2 px-2 py-1 bg-base-200 rounded-lg text-xs hover:bg-base-300 transition-colors cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-base-content/60">Disponibles:</span>
          {AVAILABLE_TOOLS.map((tool) => (
            <span key={tool.id} className="flex items-center gap-0.5 text-purple-300" title={tool.name}>
              {tool.icon}
            </span>
          ))}
        </button>
        
        {/* Input row */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              className="textarea textarea-bordered w-full chat-textarea text-base leading-snug"
              placeholder="Escribe tu mensaje..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
            />
          </div>
          <button
            className="btn btn-primary btn-circle"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Tools Modal */}
      {showToolsModal && <ToolsModal onClose={() => setShowToolsModal(false)} />}
    </>
  );
}
