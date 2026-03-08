// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat page
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Layout, Smartphone, Code, Zap, ChevronLeft, ChevronRight, Copy, Check, Trash2, Bot, Save } from 'lucide-react';
import { useOrchestratorStore } from '../../stores/orchestrator-store.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import { TypingIndicator } from './TypingIndicator.js';
import { ActivityLog } from './ActivityLog.js';
import { ContextBar } from './ContextBar.js';
import { ChatActions } from './ChatActions.js';
import { ChatContextIndicator } from './ChatContextIndicator.js';
import { ToolResultsPanel } from './ToolResultsPanel.js';
import { AgentEditorFloating } from './AgentEditorFloating.js';
import { ToolExecutionDisplay } from './ToolExecutionDisplay.js';
import { ChatHistory, addToChatHistory, updateChatHistory } from './ChatHistory.js';
import { getConfig } from '../../db.js';
import { CONFIG_KEYS } from '../../config.js';

// Agent templates for prompt carousel
const AGENT_TEMPLATES = [
    {
        id: 'general',
        name: 'Asistente General',
        agentId: 'general',
        icon: MessageSquare,
        color: 'bg-blue-500',
        prompts: [
            'Ayúdame a escribir un código para calcular fibonacci',
            'Explícame qué es una API REST',
            'Revisa este código y dime cómo mejorarlo',
            'Ayúdame a escribir tests unitarios',
        ]
    },
    {
        id: 'landing-page',
        name: 'Landing Page',
        agentId: 'landing-page',
        icon: Layout,
        color: 'bg-orange-500',
        prompts: [
            'Crea una landing page para una agencia de marketing digital con hero, features, testimonios y CTA',
            'Landing page para restaurante con menú, galería de fotos y reserva de mesas',
            'Landing page para startup SaaS con pricing, demo y formulario de contacto',
            'Landing page para curso online con temario, instructor y botón de compra',
        ]
    },
    {
        id: 'pwa',
        name: 'PWA',
        agentId: 'pwa',
        icon: Smartphone,
        color: 'bg-blue-500',
        prompts: [
            'Crea una PWA de lista de tareas con modo offline y notificaciones',
            'Progressive Web App para cuaca con geolocalización y alertas',
            'PWA de notas con sincronización y almacenamiento local',
            'App web progresiva para seguimiento de hábitos diarios',
        ]
    },
    {
        id: 'fullstack',
        name: 'Full Stack',
        agentId: 'fullstack',
        icon: Code,
        color: 'bg-purple-500',
        prompts: [
            'Crea una aplicación de gestión de proyectos con Kanban y equipo',
            'App de blog con panel de admin y sistema de comentarios',
            'Plataforma de cursos con videos, progreso y certificados',
            'Sistema de reservas con calendario y pagos',
        ]
    },
    {
        id: 'ecommerce',
        name: 'E-Commerce',
        agentId: 'ecommerce',
        icon: Zap,
        color: 'bg-green-500',
        prompts: [
            'Tienda online de ropa con catálogo, carrito y checkout',
            'Marketplace de productos artesanales con vendedor y comprador',
            'Tienda de electrónicos con filtros, comparación y opiniones',
            'Carrito de compras con cupones y envío calculado',
        ]
    }
];

export function ChatPage() {
  const messages = useOrchestratorStore((s) => s.messages);
  const isTyping = useOrchestratorStore((s) => s.isTyping);
  const activityLog = useOrchestratorStore((s) => s.activityLog);
  const orchState = useOrchestratorStore((s) => s.state);
  const tokenUsage = useOrchestratorStore((s) => s.tokenUsage);
  const error = useOrchestratorStore((s) => s.error);
  const sendMessage = useOrchestratorStore((s) => s.sendMessage);
  const loadHistory = useOrchestratorStore((s) => s.loadHistory);
  const toolResults = useOrchestratorStore((s) => s.toolResults);
  
  // Track tool executions for futuristic display
  const [toolExecutions, setToolExecutions] = useState<Array<{id: string; tool: string; status: 'done'; result?: string; timestamp: number}>>([]);
  const [assistantName, setAssistantName] = useState('Sybek');
  
  useEffect(() => {
    async function loadAssistantName() {
      const name = await getConfig(CONFIG_KEYS.ASSISTANT_NAME);
      if (name) setAssistantName(name);
    }
    loadAssistantName();
  }, []);
  
  useEffect(() => {
    const executions = toolResults.map((tr, idx) => ({
      id: `${tr.tool}-${idx}`,
      tool: tr.tool,
      status: 'done' as const,
      result: tr.result?.slice(0, 500),
      timestamp: Date.now() - (toolResults.length - idx) * 1000,
    }));
    setToolExecutions(executions);
  }, [toolResults]);

  // Chat history state
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Listen for toggle event from Layout
  useEffect(() => {
    const handleToggle = () => setShowChatHistory(prev => !prev);
    window.addEventListener('toggle-chat-history', handleToggle);
    return () => window.removeEventListener('toggle-chat-history', handleToggle);
  }, []);
  
  // New chat confirmation
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  
  function handleNewChat() {
    // Show confirmation popup
    setShowNewChatConfirm(true);
  }
  
  function confirmNewChat() {
    setCurrentChatId(null);
    localStorage.removeItem('currentSessionFolder');
    localStorage.removeItem('contextFolders');
    window.location.reload();
  }
  
  function handleSelectChat(sessionId: string) {
    setCurrentChatId(sessionId);
    // TODO: Load messages from that chat when persistence is implemented
    // For now, just close sidebar
    setShowChatHistory(false);
  }
  
  // Update chat history only when there are new messages (not on page load)
  const hasInitiallyLoaded = useRef(false);
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      return;
    }
    
    if (messages.length > 0 && messages[0]?.content) {
      const firstMessage = messages[0].content?.slice(0, 100) || 'Nueva conversación';
      const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
      if (currentChatId) {
        updateChatHistory(currentChatId, title, firstMessage);
      } else if (messages.length >= 2) {
        const newChat = addToChatHistory(title, firstMessage);
        setCurrentChatId(newChat.id);
      }
    }
  }, [messages.length]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Agent change confirmation state
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [pendingTemplateAgentId, setPendingTemplateAgentId] = useState<string | null>(null);
  const [pendingTemplatePrompt, setPendingTemplatePrompt] = useState<string | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const hasMessages = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  
  // Show welcome screen only when there are NO messages
  const showWelcome = messages.length === 0;
  
  // Show continue banner only after at least 2 full conversations (4+ messages)
  const showContinueBanner = messages.length >= 4 && 
    orchState === 'idle' && 
    lastMessage?.isFromMe === true;

  function handleSelectPrompt(prompt: string, templateAgentId?: string) {
    // If template has a different agent than current, show confirmation
    if (templateAgentId) {
      setPendingTemplateAgentId(templateAgentId);
      setPendingTemplatePrompt(prompt);
      setShowAgentConfirm(true);
    } else {
      // Same agent, just set the prompt
      setInputValue(prompt);
      setCopiedPrompt(prompt);
      setTimeout(() => setCopiedPrompt(null), 2000);
    }
  }

  // Handle confirmed agent change from template
  async function handleConfirmTemplateAgent() {
    if (!pendingTemplateAgentId || !pendingTemplatePrompt) return;
    
    // Save the new agent
    const { setConfig } = await import('../../db.js');
    const { CONFIG_KEYS, DEFAULT_GROUP_ID } = await import('../../config.js');
    const { writeGroupFile } = await import('../../storage.js');
    const { DEFAULT_AGENTS } = await import('./AgentEditorFloating.js');
    
    const agent = DEFAULT_AGENTS.find((a: { id: string }) => a.id === pendingTemplateAgentId);
    if (agent) {
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, pendingTemplateAgentId);
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, agent.systemPrompt);
      await writeGroupFile(DEFAULT_GROUP_ID, 'AGENTS.md', agent.agentsMd);
    }
    
    // Set the prompt in textarea
    setInputValue(pendingTemplatePrompt);
    setCopiedPrompt(pendingTemplatePrompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
    
    // Close popup
    setShowAgentConfirm(false);
    setPendingTemplateAgentId(null);
    setPendingTemplatePrompt(null);
  }

  function nextSlide() {
    setActiveSlide((prev) => (prev + 1) % AGENT_TEMPLATES.length);
  }

  function prevSlide() {
    setActiveSlide((prev) => (prev - 1 + AGENT_TEMPLATES.length) % AGENT_TEMPLATES.length);
  }

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      {showChatHistory && (
        <ChatHistory 
          currentSessionId={currentChatId}
          onSelectSession={handleSelectChat}
          onNewChat={handleNewChat}
        />
      )}
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
        {showContinueBanner && (
          <div className="hero min-h-full">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h2 className="text-2xl font-bold">Continúa la conversación</h2>
                <p className="mt-2 opacity-60">Envía un mensaje para continuar</p>
              </div>
            </div>
          </div>
        )}

        {showWelcome && (
          <div className="space-y-6">
            {/* Welcome message */}
            <div className="text-center py-4">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-primary opacity-80" />
              <h2 className="text-3xl font-bold">¡Hola! Soy {assistantName}</h2>
              <p className="mt-2 opacity-60 text-lg">Selecciona una plantilla o escribe tu idea</p>
            </div>

            {/* Agent Templates Carousel */}
            <div className="relative max-w-4xl mx-auto">
              {/* Navigation arrows */}
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 btn btn-circle btn-sm btn-ghost"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 btn btn-circle btn-sm btn-ghost"
                onClick={nextSlide}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Carousel cards */}
              <div className="overflow-hidden px-8">
                <div 
                  className="flex transition-transform duration-300"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {AGENT_TEMPLATES.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <div key={agent.id} className="w-full flex-shrink-0 px-2">
                        <div className="card bg-base-200 border border-base-300">
                          <div className="card-body p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`p-2 rounded-lg ${agent.color}`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-bold text-lg">{agent.name}</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {agent.prompts.map((prompt, idx) => (
                                <button
                                  key={idx}
                                  className="btn btn-outline btn-sm h-auto py-2 text-left justify-start items-start"
                                  onClick={() => handleSelectPrompt(prompt, agent.agentId)}
                                >
                                  {copiedPrompt === prompt ? (
                                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                  ) : (
                                    <Copy className="w-4 h-4 opacity-50 shrink-0 mt-0.5" />
                                  )}
                                  <span className="line-clamp-2 text-xs">{prompt}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center items-center gap-2 mt-4">
                {AGENT_TEMPLATES.map((agent, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`relative group transition-all duration-300 ${
                      idx === activeSlide ? 'w-8' : 'w-2'
                    }`}
                    aria-label={`Go to ${agent.name}`}
                  >
                    <span 
                      className={`block rounded-full transition-all duration-300 ${
                        idx === activeSlide 
                          ? 'h-2 bg-primary shadow-md shadow-primary/40' 
                          : 'h-2 bg-base-content/40 group-hover:bg-base-content/60'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="text-center">
              <p className="text-sm opacity-50 mb-3">O describe tu idea directamente</p>
            </div>
          </div>
        )}

        {/* Show messages when there are messages and not showing welcome/continue */}
        {messages.length > 0 && !showWelcome && (
          <MessageList messages={messages} />
        )}

        {/* Futuristic Tool Execution Display */}
        {toolExecutions.length > 0 && (
          <ToolExecutionDisplay tools={toolExecutions} />
        )}

        {/* Tool Results Panel - only show when there are tool results */}
        {toolResults.length > 0 && (
          <ToolResultsPanel 
            toolResults={toolResults}
          />
        )}

        {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-base-300 bg-base-100">
        {/* Activity log (collapsible) */}
        {activityLog.length > 0 && <ActivityLog entries={activityLog} />}

        {/* Context bar + Chat actions in same row */}
        <div className="flex items-center justify-between gap-2 px-4 py-1.5">
          {/* Context / token usage bar */}
          <div className="flex-1">
            {tokenUsage && <ContextBar usage={tokenUsage} />}
          </div>
          
          {/* Compact / New Session actions */}
          <ChatActions disabled={orchState !== 'idle'} />
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 pb-2">
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => useOrchestratorStore.getState().clearError()}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          disabled={orchState !== 'idle'}
          initialValue={inputValue}
        />
      </div>

      {/* Floating context indicator */}
      <ChatContextIndicator onNewChat={() => {
        // Clear context and start new chat
        localStorage.removeItem('currentSessionFolder');
        localStorage.removeItem('contextFolders');
        window.location.reload();
      }} />

      {/* Agent Editor Floating Component */}
      <AgentEditorFloating />
      
      {/* Agent Change Confirmation Popup for Templates */}
      {showAgentConfirm && pendingTemplateAgentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-72 p-4">
            <div className="text-center mb-4">
              <Bot className="w-10 h-10 mx-auto mb-2 text-warning" />
              <h3 className="font-bold">¿Cambiar Agente?</h3>
              <p className="text-sm opacity-70 mt-2">
                ¿Estás seguro de cambiar a <strong>{AGENT_TEMPLATES.find(t => t.agentId === pendingTemplateAgentId)?.name}</strong>?
              </p>
              <p className="text-xs opacity-50 mt-2">
                Esto reemplazará el agent actual y pegará el template en el input.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAgentConfirm(false);
                  setPendingTemplateAgentId(null);
                  setPendingTemplatePrompt(null);
                }}
                className="btn btn-ghost btn-sm flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTemplateAgent}
                className="btn btn-primary btn-sm flex-1"
              >
                <Save className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Chat Confirmation Popup */}
      {showNewChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-base-200 border border-base-300 rounded-xl shadow-2xl w-80 mx-4 overflow-hidden">
            <div className="p-4 border-b border-base-300">
              <h3 className="font-bold text-lg">¿Nueva Conversación?</h3>
              <p className="text-sm opacity-60 mt-1">
                Se borrarán los mensajes actuales y empezarás de cero.
              </p>
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="btn btn-ghost btn-sm flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmNewChat}
                className="btn btn-primary btn-sm flex-1"
              >
                Nueva Conversación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
