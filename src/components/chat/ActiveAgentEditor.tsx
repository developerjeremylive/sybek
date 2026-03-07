// ---------------------------------------------------------------------------
// OpenBrowserClaw — Active Agent Editor Component
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Save, HelpCircle, X } from 'lucide-react';
import { getConfig, setConfig } from '../../db.js';
import { CONFIG_KEYS } from '../../config.js';

// Default agents data (same as AgentsPage)
const DEFAULT_AGENTS = [
  { id: 'landing-page', name: 'Landing Page', description: 'Especialista en landing pages' },
  { id: 'pwa', name: 'PWA Developer', description: 'Progressive Web Apps' },
  { id: 'react', name: 'React Developer', description: 'React.js aplicaciones' },
  { id: 'vue', name: 'Vue Developer', description: 'Vue.js 3 aplicaciones' },
  { id: 'angular', name: 'Angular Developer', description: 'Angular aplicaciones' },
  { id: 'nextjs', name: 'Next.js Developer', description: 'Next.js full-stack' },
  { id: 'svelte', name: 'Svelte Developer', description: 'Svelte aplicaciones' },
  { id: 'fullstack', name: 'Full Stack', description: 'Desarrollador completo' },
  { id: 'ecommerce', name: 'E-Commerce', description: 'Tiendas online' },
];

export function ActiveAgentEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [agentSystemPrompt, setAgentSystemPrompt] = useState('');
  const [agentName, setAgentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load active agent data
  useEffect(() => {
    async function load() {
      const activeAgent = await getConfig(CONFIG_KEYS.USE_AGENTS_FILE);
      const systemPrompt = await getConfig(CONFIG_KEYS.SYSTEM_PROMPT);
      
      if (activeAgent) {
        setActiveAgentId(activeAgent);
        const agent = DEFAULT_AGENTS.find(a => a.id === activeAgent);
        setAgentName(agent?.name || activeAgent);
      }
      
      if (systemPrompt) {
        setAgentSystemPrompt(systemPrompt);
      }
    }
    load();
  }, []);

  // Save agent and system prompt
  async function handleSave() {
    if (!activeAgentId) return;
    
    setSaving(true);
    try {
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, activeAgentId);
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, agentSystemPrompt);
      
      // Update agent name display
      const agent = DEFAULT_AGENTS.find(a => a.id === activeAgentId);
      if (agent) setAgentName(agent.name);
      
      setTimeout(() => setSaving(false), 1000);
    } catch (err) {
      console.error('Error saving agent:', err);
      setSaving(false);
    }
  }

  // Select a different agent
  function selectAgent(agentId: string) {
    const agent = DEFAULT_AGENTS.find(a => a.id === agentId);
    if (agent) {
      setActiveAgentId(agentId);
      setAgentName(agent.name);
      setShowDropdown(false);
    }
  }

  // Toggle expand/collapse
  function toggleOpen() {
    setIsOpen(!isOpen);
  }

  const selectedAgent = DEFAULT_AGENTS.find(a => a.id === activeAgentId);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Floating button when collapsed */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="btn btn-secondary btn-circle shadow-lg"
          title="Editar Agente Activo"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-80 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-100 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-secondary" />
              <span className="font-medium text-sm">Agente Activo</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="btn btn-ghost btn-xs"
                title="Ayuda"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="btn btn-ghost btn-xs"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Help tooltip */}
          {showHelp && (
            <div className="p-3 bg-base-100 border-b border-base-300 text-xs">
              <p className="font-medium mb-1">¿Qué es el Agente Activo?</p>
              <p className="opacity-70 mb-2">
                El agente define la personalidad y capacidades del asistente. 
                Cada agente tiene un system prompt específico.
              </p>
              <p className="opacity-70">
                Puedes seleccionar un agente diferente o editar su system prompt 
                para personalizar cómo responde el asistente.
              </p>
            </div>
          )}

          {/* Agent selector */}
          <div className="p-3 border-b border-base-300">
            <label className="text-xs font-medium mb-1 block">Seleccionar Agente</label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn btn-sm btn-outline w-full justify-between"
              >
                <span>{selectedAgent?.name || 'Seleccionar...'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {DEFAULT_AGENTS.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-base-200 ${
                        activeAgentId === agent.id ? 'bg-primary/20 text-primary' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs opacity-50">{agent.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System prompt editor */}
          <div className="p-3">
            <label className="text-xs font-medium mb-1 block">System Prompt</label>
            <textarea
              className="textarea textarea-bordered w-full h-32 text-xs font-mono resize-none"
              value={agentSystemPrompt}
              onChange={(e) => setAgentSystemPrompt(e.target.value)}
              placeholder="Instructions for the agent..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 p-3 border-t border-base-300 bg-base-100 rounded-b-lg">
            <button
              onClick={toggleOpen}
              className="btn btn-ghost btn-sm"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="btn btn-secondary btn-sm"
              disabled={saving || !activeAgentId}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Info footer */}
          <div className="px-3 pb-3 text-xs opacity-50 text-center">
            Se utilizará en el próximo mensaje
          </div>
        </div>
      )}
    </div>
  );
}
