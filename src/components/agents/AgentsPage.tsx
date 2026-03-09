// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agents page
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { 
  FileText, Save, Plus, Trash2, Check, X, Bot, 
  Layout, Smartphone, Palette, Code, Zap, CheckCircle 
} from 'lucide-react';
import { DEFAULT_GROUP_ID, CONFIG_KEYS } from '../../config.js';
import { readGroupFile, writeGroupFile, listGroupFiles } from '../../storage.js';
import { getConfig, setConfig } from '../../db.js';

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  agentsMd: string;
  icon: string;
}

// Default agent templates
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'general',
    name: 'Asistente General',
    description: 'Asistente de IA para conversación general y tareas diversas',
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
- Reasoning and problem-solving`,
    icon: '💬'
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Especialista en crear landing pages profesionales',
    systemPrompt: `Eres un experto diseñador y desarrollador de landing pages.
Tu objetivo es crear landing pages que conviertan visitantes en clientes.

DIRECTRICES:
- Usa diseño moderno con Tailwind CSS
- Asegura que sea responsive (mobile-first)
- Incluye: Hero, Features, Testimonios, CTA, Footer
- Usa animaciones sutiles para dar vida
- Optimiza para SEO
- El código debe ser limpio y profesional

Cuando crees una landing page:
1. Crea un archivo HTML con estructura completa
2. Crea archivo CSS con estilos modernos
3. Crea archivo JS para interacciones
4. Guarda todos los archivos en la carpeta del proyecto
5. Confirma al usuario dónde se guardaron los archivos`,
    agentsMd: `# Landing Page Agent

## Specialty
Creates professional, high-converting landing pages.

## Design Guidelines
- Modern, clean design with Tailwind CSS
- Mobile-first responsive design
- Include: Hero, Features, Testimonials, CTA, Footer
- Subtle animations for engagement
- SEO optimized
- Clean, professional code`,
    icon: 'Layout'
  },
  {
    id: 'pwa',
    name: 'PWA Developer',
    description: 'Especialista en Progressive Web Apps',
    systemPrompt: `Eres un experto desarrollador de Progressive Web Apps (PWA).
Tu objetivo es crear PWAs que ofrezcan una experiencia similar a una app nativa.

DIRECTRICES:
- Implementa Service Workers para offline
- Crea manifest.json completo
- Usa estrategias de cacheo apropiadas
- Incluye notificaciones push
- Diseño responsive y mobile-first
- Optimiza el rendimiento

Cuando crees una PWA:
1. Crea manifest.json con metadatos completos
2. Crea Service Worker con estrategias de cacheo
3. Crea archivos HTML/CSS/JS de la app
4. Configura icons para diferentes tamaños
5. Guarda todos los archivos y confirma al usuario`,
    agentsMd: `# PWA Agent

## Specialty
Creates Progressive Web Apps with native-like experience.

## PWA Requirements
- Service Workers for offline support
- Complete manifest.json
- Proper caching strategies
- Push notifications
- Responsive, mobile-first design
- Performance optimized`,
    icon: 'Smartphone'
  },
  {
    id: 'react',
    name: 'React Developer',
    description: 'Crea aplicaciones completas con React.js',
    systemPrompt: `Eres un experto desarrollador de React.js.
Crea aplicaciones web modernas usando las mejores prácticas de React.

DIRECTRICES:
- Usa componentes funcionales con Hooks
- Implementa state management con Context API o Zustand
- Usa Tailwind CSS para estilos
- Crea componentes reutilizables
- Implementa routing con React Router
- Optimiza rendimiento con useMemo, useCallback
- Usa TypeScript para mejor tipado

Cuando crees una app en React:
1. Crea estructura de proyecto profesional
2. Implementa componentes con Props y Hooks
3. Crea páginas con React Router
4. Usa Tailwind CSS para diseño
5. Guarda todos los archivos en carpetas apropiadas
6. Confirma la estructura al usuario`,
    agentsMd: `# React Developer Agent

## Specialty
Creates modern React.js applications with hooks and best practices.

## Requirements
- Functional components with Hooks
- Context API or Zustand for state
- Tailwind CSS for styling
- React Router for navigation
- TypeScript support
- Reusable components`,
    icon: 'Code'
  },
  {
    id: 'vue',
    name: 'Vue Developer',
    description: 'Crea aplicaciones con Vue.js 3',
    systemPrompt: `Eres un experto desarrollador de Vue.js 3.
Crea aplicaciones reactivas y performant con Vue 3 y Composition API.

DIRECTRICES:
- Usa Composition API con <script setup>
- Implementa Pinia para state management
- Usa Tailwind CSS o Vuetify para estilos
- Crea componentes reutilizables
- Implementa Vue Router para navegación
- Usa TypeScript para mejor desarrollo

Cuando crees una app en Vue:
1. Crea estructura de proyecto Vue 3
2. Implementa componentes con Composition API
3. Usa Pinia para estado global
4. Configura Vue Router
5. Aplica estilos con Tailwind CSS
6. Confirma los archivos creados`,
    agentsMd: `# Vue.js Developer Agent

## Specialty
Creates Vue.js 3 applications with Composition API.

## Requirements
- Vue 3 with Composition API
- Pinia for state management
- Vue Router for navigation
- Tailwind CSS for styling
- TypeScript support
- Reusable components`,
    icon: 'Code'
  },
  {
    id: 'angular',
    name: 'Angular Developer',
    description: 'Crea aplicaciones empresariales con Angular',
    systemPrompt: `Eres un experto desarrollador de Angular.
Crea aplicaciones empresariales robustas con Angular.

DIRECTRICES:
- Usa componentes standalone (Angular 17+)
- Implementa servicios con inyección de dependencias
- Usa Signals para reactivity
- Implementa routing con Guards
- Usa RxJS para operaciones asíncronas
- Aplica Tailwind CSS o Angular Material

Cuando crees una app en Angular:
1. Crea estructura de proyecto Angular
2. Implementa componentes standalone
3. Crea servicios con HttpClient
4. Configura routing con Guards
5. Usa Signals para estado
6. Confirma los archivos`,
    agentsMd: `# Angular Developer Agent

## Specialty
Creates enterprise Angular applications.

## Requirements
- Standalone components (Angular 17+)
- Dependency injection
- Signals for reactivity
- Routing with Guards
- RxJS for async operations
- Tailwind CSS or Angular Material`,
    icon: 'Code'
  },
  {
    id: 'nextjs',
    name: 'Next.js Developer',
    description: 'Crea apps full-stack con Next.js',
    systemPrompt: `Eres un experto desarrollador de Next.js.
Crea aplicaciones full-stack con Next.js 14+ (App Router).

DIRECTRICES:
- Usa App Router de Next.js 14
- Implementa Server Components
- Usa Tailwind CSS para estilos
- Crea API routes integrados
- Implementa SSR y SSG
- Usa TypeScript

Cuando crees una app en Next.js:
1. Crea estructura con App Router
2. Implementa páginas y layouts
3. Crea API routes en /app/api
4. Usa Tailwind CSS para styling
5. Implementa fetching de datos
6. Confirma estructura`,
    agentsMd: `# Next.js Developer Agent

## Specialty
Creates full-stack Next.js applications with App Router.

## Requirements
- Next.js 14+ with App Router
- Server Components
- API Routes
- Tailwind CSS
- TypeScript
- SSR/SSG support`,
    icon: 'Code'
  },
  {
    id: 'svelte',
    name: 'Svelte Developer',
    description: 'Crea aplicaciones ultra-rápidas con Svelte',
    systemPrompt: `Eres un experto desarrollador de Svelte/SvelteKit.
Crea aplicaciones web ultra-rápidas y reactivas.

DIRECTRICES:
- Usa sintaxis limpia de Svelte
- Implementa stores para estado
- Usa SvelteKit para routing
- Aplica estilos con CSS scoped
- Optimiza para rendimiento

Cuando crees una app en Svelte:
1. Crea estructura SvelteKit
2. Implementa componentes .svelte
3. Usa stores para estado global
4. Configura routing con SvelteKit
5. Aplica CSS scoped
6. Confirma archivos`,
    agentsMd: `# Svelte Developer Agent

## Specialty
Creates ultra-fast Svelte/SvelteKit applications.

## Requirements
- Svelte/SvelteKit
- Svelte stores
- CSS scoped styles
- File-based routing
- High performance`,
    icon: 'Code'
  },
  {
    id: 'fullstack',
    name: 'Full Stack',
    description: 'Desarrollador Full Stack para proyectos completos',
    systemPrompt: `Eres un desarrollador Full Stack senior.
Puedes crear aplicaciones web completas con frontend y backend.

DIRECTRICES:
- Frontend moderno con React/Vue/HTML+CSS+JS
- Backend con APIs REST o GraphQL
- Base de datos si es necesario
- Autenticación y seguridad
- Código limpio y documentado

Cuando crees un proyecto:
1. Estructura el proyecto correctamente
2. Crea todos los archivos necesarios
3. Guarda en carpetas apropiadas
4. Confirma la estructura al usuario`,
    agentsMd: `# Full Stack Agent

## Specialty
Creates complete web applications with frontend and backend.`,
    icon: 'Code'
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Especialista en tiendas online',
    systemPrompt: `Eres un experto en desarrollo de tiendas online y e-commerce.
Crea experiencias de compra profesionales y optimizadas para conversiones.

DIRECTRICES:
- Diseño profesional de tienda online
- Catálogo de productos con filtros
- Carrito de compras funcional
- Checkout optimizado
- Diseño responsive
- Animaciones de compra

Cuando crees una tienda:
1. Crea HTML/CSS/JS completo
2. Incluye sistema de carrito (localStorage)
3. Diseño profesional de productos
4. Checkout funcional
5. Confirma los archivos creados`,
    agentsMd: `# E-Commerce Agent

## Specialty
Creates professional online stores with shopping cart functionality.`,
    icon: 'Zap'
  }
];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Layout,
  Smartphone,
  Palette,
  Code,
  Zap,
};

function getIconComponent(iconName: string) {
  return iconMap[iconName] || Bot;
}

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'agents'>('system');

  // Load saved agents and active agent
  useEffect(() => {
    async function load() {
      const savedAgents = await getConfig('saved_agents');
      const savedActive = await getConfig(CONFIG_KEYS.USE_AGENTS_FILE);
      
      if (savedAgents) {
        try {
          const parsed = JSON.parse(savedAgents);
          // Merge with defaults, keeping any custom agents
          const customIds = parsed.map((a: Agent) => a.id).filter((id: string) => !DEFAULT_AGENTS.find(d => d.id === id));
          const custom = parsed.filter((a: Agent) => customIds.includes(a.id));
          setAgents([...DEFAULT_AGENTS, ...custom]);
        } catch {}
      }
      
      if (savedActive && savedActive !== 'false') {
        setActiveAgentId(savedActive);
      } else {
        setActiveAgentId('landing-page');
      }
    }
    load();
  }, []);

  // Set editing agent when selection changes
  useEffect(() => {
    if (selectedAgentId) {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (agent) {
        setEditingAgent({ ...agent });
        setActiveTab('system'); // Reset to system tab when switching agents
      }
    }
  }, [selectedAgentId, agents]);

  // Save agent changes
  async function handleSaveAgent() {
    if (!editingAgent) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedAgents = agents.map(a => 
        a.id === editingAgent.id ? editingAgent : a
      );
      setAgents(updatedAgents);
      
      // Save to config (only custom agents)
      const customAgents = updatedAgents.filter(a => !DEFAULT_AGENTS.find(d => d.id === a.id));
      await setConfig('saved_agents', JSON.stringify(customAgents));
      
      setSuccess('¡Agente guardado!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // Activate agent for chat
  async function handleActivateAgent(agentId: string) {
    setActiveAgentId(agentId);
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, agentId);
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, agent.systemPrompt);
      await writeGroupFile(DEFAULT_GROUP_ID, 'AGENTS.md', agent.agentsMd);
      setSuccess(`¡${agent.name} activado para el chat!`);
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  // Create new custom agent
  function handleNewAgent() {
    const newId = `custom-${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      name: 'Nuevo Agente',
      description: 'Descripción de tu agente',
      systemPrompt: 'Eres un asistente personalizado...',
      agentsMd: '# Mi Agente\n\nDescripción del agente...',
      icon: 'Bot'
    };
    setAgents([...agents, newAgent]);
    setSelectedAgentId(newId);
  }

  // Delete agent (only custom)
  function handleDeleteAgent(agentId: string) {
    const agent = agents.find(a => a.id === agentId);
    if (DEFAULT_AGENTS.find(a => a.id === agentId)) {
      setError('No puedes eliminar agentes predefinidos');
      return;
    }
    
    setAgents(agents.filter(a => a.id !== agentId));
    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
      setEditingAgent(null);
    }
  }

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const IconComponent = selectedAgent ? getIconComponent(selectedAgent.icon) : Bot;

  return (
    <div className="flex flex-col sm:flex-row h-full">
      {/* Left sidebar - Agent list - collapsible on mobile */}
      <div className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-base-300 bg-base-200 flex flex-col max-h-[40vh] sm:max-h-none">
        <div className="p-4 border-b border-base-300">
          <h2 className="font-bold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agentes
          </h2>
          <p className="text-xs opacity-50 mt-1 hidden sm:block">Selecciona un agente para editar</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {agents.map(agent => {
            const AgentIcon = getIconComponent(agent.icon);
            const isActive = activeAgentId === agent.id;
            const isSelected = selectedAgentId === agent.id;
            
            return (
              <div
                key={agent.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/20 border border-primary' : 'hover:bg-base-300'
                } ${isActive ? 'border-l-4 border-l-success' : ''}`}
                onClick={() => setSelectedAgentId(agent.id)}
              >
                <div className="flex items-start gap-2">
                  <AgentIcon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'opacity-60'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm truncate">{agent.name}</span>
                      {isActive && <CheckCircle className="w-3 h-3 text-success shrink-0" />}
                    </div>
                    <p className="text-xs opacity-50 line-clamp-2 hidden sm:block">{agent.description}</p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="flex gap-1 mt-2">
                    {!DEFAULT_AGENTS.find(d => d.id === agent.id) && (
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      className={`btn btn-xs ${isActive ? 'btn-success' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateAgent(agent.id);
                      }}
                    >
                      {isActive ? 'Activo' : 'Activar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="p-2 border-t border-base-300">
          <button
            className="btn btn-sm btn-outline w-full"
            onClick={handleNewAgent}
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">Nuevo</span>
            <span className="hidden sm:inline">Nuevo Agente</span>
          </button>
        </div>
      </div>

      {/* Right - Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {editingAgent ? (
          <>
            {/* Agent header */}
            <div className="p-4 border-b border-base-300 bg-base-100">
              <div className="flex items-center gap-3">
                <IconComponent className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    placeholder="Nombre del agente"
                  />
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveAgent}
                  disabled={saving}
                >
                  {saving ? <span className="loading loading-spinner loading-xs" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
              <input
                type="text"
                className="input input-sm input-ghost w-full mt-2"
                value={editingAgent.description}
                onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                placeholder="Descripción breve del agente"
              />
            </div>

            {/* Editor tabs */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="tabs tabs-boxed bg-base-200 m-4 mb-0">
                <button 
                  className={`tab ${activeTab === 'system' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('system')}
                >
                  System Prompt
                </button>
                <button 
                  className={`tab ${activeTab === 'agents' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('agents')}
                >
                  AGENTS.md
                </button>
              </div>

              {/* Content based on active tab */}
              <div className="flex-1 p-4 pt-2 overflow-hidden">
                {activeTab === 'system' ? (
                  <textarea
                    className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none"
                    value={editingAgent.systemPrompt}
                    onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                    placeholder="Escribe las instrucciones del system prompt..."
                  />
                ) : (
                  <textarea
                    className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none"
                    value={editingAgent.agentsMd}
                    onChange={(e) => setEditingAgent({ ...editingAgent, agentsMd: e.target.value })}
                    placeholder="# AGENTS.md\n\nEscribe las instrucciones del agente..."
                  />
                )}
              </div>
            </div>

            {/* Active indicator */}
            {activeAgentId === editingAgent.id && (
              <div className="px-4 py-2 bg-success/20 border-t border-success/30">
                <span className="text-sm text-success font-medium">
                  ✓ Este agente está activo en el chat
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center opacity-50">
              <Bot className="w-16 h-16 mx-auto mb-4" />
              <p>Selecciona un agente de la lista</p>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      {success && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-success">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-error">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
