// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Editor Floating Component (combines System Prompt + Agent)
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Bot, ChevronDown, Save, HelpCircle, FileText, X, Check } from 'lucide-react';
import { getConfig, setConfig } from '../../db.js';
import { CONFIG_KEYS, DEFAULT_GROUP_ID } from '../../config.js';
import { writeGroupFile } from '../../storage.js';

// Default agents data (same as AgentsPage)
export const DEFAULT_AGENTS = [
  { 
    id: 'general', 
    name: 'Asistente General', 
    description: 'Asistente de IA para conversación general',
    systemPrompt: `Eres un asistente de IA útil y amigable.

DIRECTRICES:
- Responde de manera clara y concisa
- Si no sabes algo, admítelo honestamente
- Asked questions - ask clarifying questions when needed
- Provides accurate, well-reasoned responses
- Can help with coding, writing, analysis, and more

CONFIGURACIÓN:
- Siempre usa código limpio y bien estructurado cuando escribas código
- Explica los conceptos de manera clara
- Si el usuario pide código, proporciona ejemplos funcionales`,
    agentsMd: `# Asistente General

## Specialty
General conversation and task assistance.

## Capabilities
- Answer questions on various topics
- Help with coding tasks
- Write and edit content
- Analyze and explain concepts
- Reasoning and problem-solving`
  },
  { 
    id: 'landing-page', 
    name: 'Landing Page', 
    description: 'Especialista en landing pages',
    systemPrompt: `Eres un experto diseñador y desarrollador de landing pages.
Tu objetivo es crear landing pages que conviertan visitantes en clientes.

DIRECTRICES:
- Usa diseño moderno con Tailwind CSS
- Asegura que sea responsive (mobile-first)
- Incluye: Hero, Features, Testimonios, CTA, Footer
- Usa animaciones sutiles para dar vida
- Optimiza para SEO
- El código debe ser limpio y profesional`,
    agentsMd: `# Landing Page Agent

## Specialty
Creates professional, high-converting landing pages.

## Design Guidelines
- Modern, clean design with Tailwind CSS
- Mobile-first responsive design
- Include: Hero, Features, Testimonials, CTA, Footer
- Subtle animations for engagement
- SEO optimized
- Clean, professional code`
  },
  { 
    id: 'pwa', 
    name: 'PWA Developer', 
    description: 'Progressive Web Apps',
    systemPrompt: `Eres un experto desarrollador de Progressive Web Apps (PWA).
Tu objetivo es crear PWAs que ofrezcan una experiencia similar a una app nativa.

DIRECTRICES:
- Implementa Service Workers para offline
- Crea manifest.json completo
- Usa estrategias de cacheo apropiadas
- Incluye notificaciones push
- Diseño responsive y mobile-first
- Optimiza el rendimiento`,
    agentsMd: `# PWA Agent

## Specialty
Creates Progressive Web Apps with native-like experience.

## PWA Requirements
- Service Workers for offline support
- Complete manifest.json
- Proper caching strategies
- Push notifications
- Responsive, mobile-first design
- Performance optimized`
  },
  { 
    id: 'react', 
    name: 'React Developer', 
    description: 'React.js aplicaciones',
    systemPrompt: `Eres un experto desarrollador de React.js.
Crea aplicaciones web modernas usando las mejores prácticas de React.`,
    agentsMd: `# React Developer Agent

## Specialty
Creates modern React.js applications with hooks and best practices.`
  },
  { 
    id: 'vue', 
    name: 'Vue Developer', 
    description: 'Vue.js 3 aplicaciones',
    systemPrompt: `Eres un experto desarrollador de Vue.js 3.
Crea aplicaciones reactivas y performant con Vue 3 y Composition API.`,
    agentsMd: `# Vue.js Developer Agent

## Specialty
Creates Vue.js 3 applications with Composition API.`
  },
  { 
    id: 'angular', 
    name: 'Angular Developer', 
    description: 'Angular aplicaciones',
    systemPrompt: `Eres un experto desarrollador de Angular.
Crea aplicaciones empresariales robustas con Angular.`,
    agentsMd: `# Angular Developer Agent

## Specialty
Creates enterprise Angular applications.`
  },
  { 
    id: 'nextjs', 
    name: 'Next.js Developer', 
    description: 'Next.js full-stack',
    systemPrompt: `Eres un experto desarrollador de Next.js.
Crea aplicaciones full-stack con Next.js 14+ (App Router).`,
    agentsMd: `# Next.js Developer Agent

## Specialty
Creates full-stack Next.js applications with App Router.`
  },
  { 
    id: 'svelte', 
    name: 'Svelte Developer', 
    description: 'Svelte aplicaciones',
    systemPrompt: `Eres un experto desarrollador de Svelte/SvelteKit.
Crea aplicaciones web ultra-rápidas y reactivas.`,
    agentsMd: `# Svelte Developer Agent

## Specialty
Creates ultra-fast Svelte/SvelteKit applications.`
  },
  { 
    id: 'fullstack', 
    name: 'Full Stack', 
    description: 'Desarrollador completo',
    systemPrompt: `Eres un desarrollador Full Stack senior.
Puedes crear aplicaciones web completas con frontend y backend.`,
    agentsMd: `# Full Stack Agent

## Specialty
Creates complete web applications with frontend and backend.`
  },
  { 
    id: 'ecommerce', 
    name: 'E-Commerce', 
    description: 'Tiendas online',
    systemPrompt: `Eres un experto en desarrollo de tiendas online y e-commerce.
Crea experiencias de compra profesionales y optimizadas para conversiones.`,
    agentsMd: `# E-Commerce Agent

## Specialty
Creates professional online stores with shopping cart functionality.`
  },
];

interface AgentEditorFloatingProps {
  onAgentChange?: (agentId: string) => void;
  onAgentChangeWithPrompt?: (agentId: string, prompt: string) => void;
  pendingAgentId?: string | null;
  pendingPrompt?: string | null;
  onConfirmPending?: () => void;
}

export function AgentEditorFloating({ onAgentChange, pendingAgentId: externalPendingAgentId, pendingPrompt: externalPendingPrompt, onConfirmPending }: AgentEditorFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string>('landing-page');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [agentsMd, setAgentsMd] = useState('');
  const [activeTab, setActiveTab] = useState<'system' | 'agents'>('system');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Load current agent data and stay synced
  useEffect(() => {
    async function load() {
      const savedAgent = await getConfig(CONFIG_KEYS.USE_AGENTS_FILE);
      const savedSystemPrompt = await getConfig(CONFIG_KEYS.SYSTEM_PROMPT);
      
      // Use saved agent or default to landing-page
      const agentId = savedAgent || 'landing-page';
      setActiveAgentId(agentId);
      
      // Find the agent template
      const agent = DEFAULT_AGENTS.find(a => a.id === agentId);
      if (agent) {
        // Use saved custom prompt or default template
        setSystemPrompt(savedSystemPrompt && savedSystemPrompt.trim() !== '' 
          ? savedSystemPrompt 
          : agent.systemPrompt);
        setAgentsMd(agent.agentsMd);
      }
    }
    load();
    
    // Poll every 2 seconds to stay synced
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, []);

  // Save agent configuration
  async function handleSave() {
    setSaving(true);
    try {
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, activeAgentId);
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, systemPrompt);
      await writeGroupFile(DEFAULT_GROUP_ID, 'AGENTS.md', agentsMd);
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSaving(false);
      }, 1500);
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
      setSystemPrompt(agent.systemPrompt);
      setAgentsMd(agent.agentsMd);
    }
  }

  // Confirm and save agent change from popup
  async function confirmAgentChange(agentId: string) {
    const agent = DEFAULT_AGENTS.find(a => a.id === agentId);
    if (!agent) return;
    
    // Update local state
    setActiveAgentId(agentId);
    setSystemPrompt(agent.systemPrompt);
    setAgentsMd(agent.agentsMd);
    
    // Get the pending prompt to insert after saving
    const promptToInsert = pendingPrompt;
    setPendingPrompt(null);
    
    // Immediately save to DB
    setSaving(true);
    try {
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, agentId);
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, agent.systemPrompt);
      await writeGroupFile(DEFAULT_GROUP_ID, 'AGENTS.md', agent.agentsMd);
      
      // Call the callback with the prompt if provided
      if (onAgentChange && promptToInsert) {
        onAgentChange(promptToInsert);
      }
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSaving(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving agent:', err);
      setSaving(false);
    }
  }

  // Request agent change with optional prompt to insert after confirmation
  function requestAgentChange(agentId: string, prompt?: string) {
    if (prompt) {
      setPendingPrompt(prompt);
    }
    setPendingAgentId(agentId);
    setShowConfirmPopup(true);
  }

  // Toggle panel
  function toggleOpen() {
    setIsOpen(!isOpen);
  }

  const currentAgent = DEFAULT_AGENTS.find(a => a.id === activeAgentId);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Floating button when collapsed */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="btn btn-primary btn-circle shadow-lg"
          title="Configurar Agente"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-80 sm:w-96 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-100 rounded-t-lg shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Configurar Agente</span>
              {currentAgent && (
                <span className="badge badge-primary badge-sm">{currentAgent.name}</span>
              )}
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
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Help tooltip */}
          {showHelp && (
            <div className="p-3 bg-base-100 border-b border-base-300 text-xs shrink-0">
              <p className="font-medium mb-1">¿Qué es el System Prompt?</p>
              <p className="opacity-70 mb-2">
                El system prompt define cómo el asistente responde. 
                Incluye personalidad, objetivos y reglas.
              </p>
              <p className="font-medium mb-1">¿Qué es AGENTS.md?</p>
              <p className="opacity-70">
                Es un archivo de contexto que proporciona información adicional 
                sobre las capacidades y limitaciones del agente.
              </p>
            </div>
          )}

          {/* Agent selector */}
          <div className="p-3 border-b border-base-300 shrink-0">
            <label className="text-xs font-medium mb-2 block">Agente</label>
            <select
              className="select select-bordered select-sm w-full"
              value={activeAgentId}
              onChange={(e) => {
                if (e.target.value !== activeAgentId) {
                  setPendingAgentId(e.target.value);
                  setShowConfirmPopup(true);
                }
              }}
            >
              {DEFAULT_AGENTS.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.description}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed bg-base-300 mx-3 mt-2 shrink-0">
            <button 
              className={`tab flex-1 ${activeTab === 'system' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <FileText className="w-3 h-3 mr-1" />
              System Prompt
            </button>
            <button 
              className={`tab flex-1 ${activeTab === 'agents' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              <Bot className="w-3 h-3 mr-1" />
              AGENTS.md
            </button>
          </div>

          {/* Editor content */}
          <div className="flex-1 p-3 overflow-hidden min-h-0">
            {activeTab === 'system' ? (
              <textarea
                className="textarea textarea-bordered w-full h-full text-xs font-mono resize-none"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Escribe las instrucciones del system prompt..."
              />
            ) : (
              <textarea
                className="textarea textarea-bordered w-full h-full text-xs font-mono resize-none"
                value={agentsMd}
                onChange={(e) => setAgentsMd(e.target.value)}
                placeholder="# AGENTS.md&#10;&#10;Escribe las instrucciones del agente..."
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-3 border-t border-base-300 bg-base-100 rounded-b-lg shrink-0">
            <span className="text-xs opacity-50">
              Se usará en el próximo mensaje
            </span>
            <button
              onClick={handleSave}
              className={`btn btn-sm ${saved ? 'btn-success' : 'btn-primary'}`}
              disabled={saving}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmPopup && pendingAgentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-72 p-4">
            <div className="text-center mb-4">
              <Bot className="w-10 h-10 mx-auto mb-2 text-warning" />
              <h3 className="font-bold">¿Cambiar Agente?</h3>
              <p className="text-sm opacity-70 mt-2">
                ¿Estás seguro de cambiar a <strong>{DEFAULT_AGENTS.find(a => a.id === pendingAgentId)?.name}</strong>?
              </p>
              <p className="text-xs opacity-50 mt-2">
                Esto reemplazará el system prompt actual con la plantilla del nuevo agente.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmPopup(false);
                  setPendingAgentId(null);
                }}
                className="btn btn-ghost btn-sm flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmAgentChange(pendingAgentId);
                  setShowConfirmPopup(false);
                  setPendingAgentId(null);
                }}
                className="btn btn-primary btn-sm flex-1"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
