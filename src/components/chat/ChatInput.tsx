// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat input
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Wrench, X, Bot } from 'lucide-react';
import { MODELS, CONFIG_KEYS } from '../../config.js';
import { getConfig } from '../../db.js';
import { getOrchestrator } from '../../stores/orchestrator-store.js';
import type { LucideIcon } from 'lucide-react';

interface Props {
  onSend: (text: string, tools?: string[]) => void;
  disabled: boolean;
  initialValue?: string;
}

// Native agent tools available
const NATIVE_TOOLS = [
  { id: 'read_file', name: 'read_file', description: 'Lee archivos del sistema de archivos OPFS', icon: '📄' },
  { id: 'write_file', name: 'write_file', description: 'Crea o modifica archivos en OPFS', icon: '💾' },
  { id: 'list_files', name: 'list_files', description: 'Lista archivos y carpetas', icon: '📁' },
  { id: 'bash', name: 'bash', description: 'Ejecuta comandos en terminal Linux (Alpine WASM)', icon: '🖥️' },
  { id: 'javascript', name: 'javascript', description: 'Ejecuta código JavaScript en entorno aislado', icon: '⚡' },
  { id: 'fetch_url', name: 'fetch_url', description: 'Realiza peticiones HTTP (sujeto a CORS)', icon: '🌐' },
  { id: 'update_memory', name: 'update_memory', description: 'Guarda contexto en CLAUDE.md', icon: '🧠' },
  { id: 'create_task', name: 'create_task', description: 'Programa tareas con expresiones cron', icon: '⏰' },
];

// Workers AI tools
const WORKERS_AI_TOOLS = [
  { id: 'get_current_time', name: 'Hora actual', description: 'Obtiene la fecha y hora actual', icon: '🕐' },
  { id: 'get_weather', name: 'Clima', description: 'Obtiene el clima de una ciudad', icon: '🌤️' },
  { id: 'joke', name: 'Chiste', description: 'Chiste aleatorio', icon: '😂' },
  { id: 'cat_fact', name: 'Dato gato', description: 'Dato curioso de gatos', icon: '🐱' },
  { id: 'hackernews', name: 'HN News', description: 'Top noticias de Hacker News', icon: '📰' },
  { id: 'web_search', name: 'Web Search', description: 'Búsqueda web general', icon: '🔍' },
];

const ALL_TOOLS = [...NATIVE_TOOLS, ...WORKERS_AI_TOOLS];

// Model selector component
export function ModelSelector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadModel() {
      const saved = await getConfig(CONFIG_KEYS.MODEL);
      if (saved) setSelectedModel(saved);
    }
    loadModel();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function selectModel(model: string) {
    setSelectedModel(model);
    // Use orchestrator to set model (syncs with settings)
    await getOrchestrator().setModel(model);
    setShowDropdown(false);
  }

  const currentLabel = MODELS.find(m => m.value === selectedModel)?.label || selectedModel;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-base-200 hover:bg-base-300 rounded-lg text-xs transition-colors border border-base-300"
        title="Seleccionar modelo"
      >
        <Bot className="w-3.5 h-3.5 text-primary" />
        <span className="hidden sm:inline max-w-[80px] truncate">{currentLabel}</span>
      </button>
      
      {showDropdown && (
        <div className="absolute bottom-full mb-2 left-0 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto w-48">
          {MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => !model.premium && selectModel(model.value)}
              disabled={model.premium}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-base-200 transition-colors flex items-center justify-between gap-2 ${
                selectedModel === model.value ? 'bg-primary/20 text-primary' : ''
              } ${model.premium ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="truncate">{model.label}</span>
              {model.premium && <span className="badge badge-xs badge-warning shrink-0">Premium</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-base-100 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-w-lg w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-purple-500/30 shrink-0">
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
        <div className="p-4 overflow-y-auto">
          {/* Native Agent Tools */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
              ⚡ Herramientas del Agente
            </h3>
            <p className="text-xs text-base-content/60 mb-3">
              Herramientas nativas disponibles para todas las conversaciones
            </p>
            <div className="space-y-2">
              {NATIVE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-start gap-3 p-2 bg-base-200/50 rounded-lg">
                  <span className="text-lg">{tool.icon}</span>
                  <div>
                    <div className="font-mono text-xs text-cyan-300">{tool.name}</div>
                    <div className="text-xs text-base-content/60">{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Workers AI Tools */}
          <div>
            <h3 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
              ☁️ Workers AI Tools
            </h3>
            <p className="text-xs text-base-content/60 mb-3">
              Herramientas adicionales disponibles a través de Workers AI
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WORKERS_AI_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center gap-2 p-2 bg-base-200/30 rounded-lg">
                  <span>{tool.icon}</span>
                  <div>
                    <div className="font-medium text-xs">{tool.name}</div>
                    <div className="text-[10px] text-base-content/50">{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-base-200/50 text-center text-xs text-base-content/50 shrink-0 border-t border-base-300">
          Las herramientas del agente siempre están disponibles. Workers AI proporciona herramientas adicionales.
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
          {ALL_TOOLS.map((tool) => (
            <span key={tool.id} className="flex items-center gap-0.5 text-purple-300" title={tool.name}>
              {tool.icon}
            </span>
          ))}
        </button>
        
        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* Model selector */}
          <ModelSelector />
          
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
