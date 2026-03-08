// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat input
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Wrench, X, Bot, Check, Plug, ChevronDown } from 'lucide-react';
import { MODELS, CONFIG_KEYS } from '../../config.js';
import { getConfig } from '../../db.js';
import { getOrchestrator } from '../../stores/orchestrator-store.js';
import { useMCPStore, getEnabledMCPServers, type MCPServer, type MCPTool } from '../../stores/mcp-store.js';
import type { LucideIcon } from 'lucide-react';

interface Props {
  onSend: (text: string, tools?: string[], mcpTools?: MCPTool[]) => void;
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
  const [showToast, setShowToast] = useState(false);
  const [toastModelName, setToastModelName] = useState('');
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
    const modelLabel = MODELS.find(m => m.value === model)?.label || model;
    setSelectedModel(model);
    await getOrchestrator().setModel(model);
    setShowDropdown(false);
    // Show toast
    setToastModelName(modelLabel);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const currentLabel = MODELS.find(m => m.value === selectedModel)?.label || selectedModel;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-success/90 to-primary/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
            <Check className="w-4 h-4" />
            <span>Modelo: <strong>{toastModelName}</strong></span>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors border border-zinc-700 text-zinc-200"
        title="Seleccionar modelo"
      >
        <Bot className="w-3.5 h-3.5 text-zinc-400" />
        <span className="hidden sm:inline max-w-[80px] truncate">{currentLabel}</span>
        <span className="sm:hidden">Modelo</span>
      </button>
      
      {/* Desktop dropdown */}
      {showDropdown && (
        <div className="hidden sm:block absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto w-48">
          {MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => !model.premium && selectModel(model.value)}
              disabled={model.premium}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors flex items-center justify-between gap-2 ${
                selectedModel === model.value ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-300'
              } ${model.premium ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="truncate">{model.label}</span>
              {model.premium && <span className="badge badge-xs badge-warning shrink-0">Premium</span>}
            </button>
          ))}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {showDropdown && (
        <div className="sm:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDropdown(false)}
          />
          {/* Bottom sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden animate-slide-in-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-base-300 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
              <span className="font-bold">Seleccionar Modelo</span>
              <button 
                onClick={() => setShowDropdown(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Options */}
            <div className="overflow-y-auto max-h-[50vh] p-2">
              {MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => !model.premium && selectModel(model.value)}
                  disabled={model.premium}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center justify-between gap-2 ${
                    selectedModel === model.value 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'hover:bg-base-200'
                  } ${model.premium ? 'opacity-40' : ''}`}
                >
                  <span className="font-medium">{model.label}</span>
                  {model.premium && <span className="badge badge-warning badge-sm">Premium</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// MCP Server selector component
export function MCPSelector() {
  const servers = useMCPStore((s) => s.servers);
  const activeTools = useMCPStore((s) => s.activeTools);
  const enabledServers = servers.filter((s) => s.enabled);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (enabledServers.length === 0) {
    return (
      <button
        onClick={() => setShowDropdown(true)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-xs transition-colors border border-zinc-700/50 text-zinc-500 cursor-pointer"
        title="Sin MCP activos - Click para gestionar"
      >
        <Plug className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">MCP</span>
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-xs transition-colors border border-green-500/30 text-green-400 cursor-pointer"
        title={`${enabledServers.length} MCP(s) activo(s), ${activeTools.length} tools`}
      >
        <Plug className="w-3.5 h-3.5" />
        <span className="hidden sm:inline max-w-[100px] truncate">
          {enabledServers.map(s => s.name).join(', ')}
          {activeTools.length > 0 && <span className="text-green-300"> ({activeTools.length} tools)</span>}
        </span>
        <span className="sm:hidden">{enabledServers.length}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {showDropdown && (
        <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto w-56">
          <div className="px-3 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-400">Servidores MCP</span>
          </div>
          {servers.map((server) => (
            <div
              key={server.id}
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer ${
                server.enabled 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span>{server.icon || '🔌'}</span>
              <span className="flex-1 truncate">{server.name}</span>
              {server.enabled && <span className="text-green-500">●</span>}
            </div>
          ))}
          <a
            href="/mcp"
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-t border-zinc-800"
          >
            <Wrench className="w-3 h-3" />
            <span>Gestionar MCP</span>
          </a>
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
      <div className="relative bg-zinc-900 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-w-lg w-full mx-4 overflow-hidden max-h-[80vh] flex flex-col">
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
            <p className="text-xs text-zinc-500 mb-3">
              Herramientas nativas disponibles para todas las conversaciones
            </p>
            <div className="space-y-2">
              {NATIVE_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-start gap-3 p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-lg">{tool.icon}</span>
                  <div>
                    <div className="font-mono text-xs text-cyan-300">{tool.name}</div>
                    <div className="text-xs text-zinc-500">{tool.description}</div>
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
            <p className="text-xs text-zinc-500 mb-3">
              Herramientas adicionales disponibles a través de Workers AI
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WORKERS_AI_TOOLS.map((tool) => (
                <div key={tool.id} className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg">
                  <span>{tool.icon}</span>
                  <div>
                    <div className="font-medium text-xs text-zinc-200">{tool.name}</div>
                    <div className="text-[10px] text-zinc-600">{tool.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-800/50 text-center text-xs text-zinc-500 shrink-0 border-t border-zinc-800">
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
    
    // Get active MCP tools
    const mcpTools = useMCPStore.getState().activeTools;
    
    // Pass both regular tools and MCP tools
    const toolIds = ALL_TOOLS.map(t => t.id);
    onSend(trimmed, toolIds, mcpTools);
    
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
      <div className="flex flex-col gap-2 p-2 sm:p-4 pb-2">
        {/* Tools row - MCP + Native */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* MCP Selector */}
          <MCPSelector />
          
          {/* Native Tools indicator - clickable to see all */}
          <button
            onClick={() => setShowToolsModal(true)}
            className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg text-xs transition-colors cursor-pointer border border-zinc-700/50"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-zinc-500 shrink-0">Herramientas:</span>
            <span className="flex flex-wrap gap-0.5">
              {ALL_TOOLS.slice(0, 6).map((tool) => (
                <span key={tool.id} className="text-lg leading-none" title={tool.name}>
                  {tool.icon}
                </span>
              ))}
              {ALL_TOOLS.length > 6 && (
                <span className="text-xs text-zinc-500">+{ALL_TOOLS.length - 6}</span>
              )}
            </span>
          </button>
        </div>
        
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
            className="btn btn-primary btn-circle shrink-0"
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
