// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat page
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, MessageSquare, Layout, Smartphone, Code, Zap, ChevronLeft, ChevronRight, ChevronDown, Copy, Check, Trash2, Bot, Save } from 'lucide-react';
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
import { ChatHistory, addToChatHistory, updateChatHistory, saveChatMessages, loadChatMessages } from './ChatHistory.js';
import { getConfig } from '../../db.js';
import { CONFIG_KEYS } from '../../config.js';
import { useMCPStore, type MCPTool } from '../../stores/mcp-store.js';

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
  const setMessages = useOrchestratorStore((s) => s.setMessages);
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

  // Chat history state - sidebar always visible on desktop
  const [showChatHistory, setShowChatHistory] = useState(true); // Start with sidebar open
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Auto-show sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowChatHistory(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Listen for toggle event from Layout (only toggle on mobile)
  useEffect(() => {
    const handleToggle = () => {
      // Only toggle on mobile, on desktop sidebar is always visible
      if (window.innerWidth < 640) {
        setShowChatHistory(prev => !prev);
      }
    };
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
    setShowNewChatConfirm(false);
    setCurrentChatId(null);
    // Clear messages for fresh start
    setMessages([]);
    localStorage.removeItem('currentSessionFolder');
    localStorage.removeItem('contextFolders');
  }
  
  function handleSelectChat(sessionId: string) {
    // Save current messages to current chat if exists
    if (currentChatId && messages.length > 0) {
      saveChatMessages(currentChatId, messages);
    }
    
    // Load messages from selected chat FIRST
    const loadedMessages = loadChatMessages(sessionId);
    console.log('Loading messages for chat', sessionId, loadedMessages);
    
    setCurrentChatId(sessionId);
    
    // Then replace messages in orchestrator store
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages);
    } else {
      setMessages([]);
    }
    
    // Sidebar stays visible - don't close it on desktop
    // On mobile, user can toggle with the button
  }
  
  const hasInitiallyLoaded = useRef(false);
  
  // Initialize on mount - clear messages and chat on page load
  useEffect(() => {
    hasInitiallyLoaded.current = true;
    // Clear messages on page load - fresh start
    setMessages([]);
    // Also clear current chat ID for fresh start
    setCurrentChatId(null);
  }, [setMessages]);
  
  // Auto-create chat when first message is sent
  
  // Auto-create chat when first message is sent (not on page load)
  useEffect(() => {
    if (!hasInitiallyLoaded.current) return;
    
    // Don't create chat if there are no messages or already have a current chat
    if (!currentChatId && messages.length >= 1 && messages[0]?.content) {
      const firstMessage = messages[0].content?.slice(0, 100) || 'Nueva conversación';
      const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
      const newChat = addToChatHistory(title, firstMessage);
      setCurrentChatId(newChat.id);
    }
  }, [messages, currentChatId]);
  
  // Save messages whenever they change (for current chat)
  useEffect(() => {
    // Don't save on initial load
    if (!hasInitiallyLoaded.current) {
      return;
    }
    
    // Save messages for current chat whenever they change
    if (currentChatId && messages.length > 0) {
      saveChatMessages(currentChatId, messages);
    }
  }, [messages, messages.length, currentChatId]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Track if user has scrolled up manually
  const userScrolledUp = useRef(false);
  
  // Agent change confirmation state
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [pendingTemplateAgentId, setPendingTemplateAgentId] = useState<string | null>(null);
  const [pendingTemplatePrompt, setPendingTemplatePrompt] = useState<string | null>(null);

  // Professional scroll handling
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    userScrolledUp.current = false;
    setShowScrollButton(false);
  }, []);

  // Handle scroll event to detect if user is near bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    
    setIsNearBottom(nearBottom);
    setShowScrollButton(!nearBottom && messages.length > 0);
    
    // Track if user manually scrolled up
    if (!nearBottom && !userScrolledUp.current) {
      userScrolledUp.current = true;
    }
  }, [messages.length]);

  // Scroll to bottom on new messages (only if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolledUp.current && (messages.length > 0 || isTyping)) {
      scrollToBottom('auto');
    }
  }, [messages.length, isTyping, scrollToBottom]);

  // Reset scroll state when switching chats
  useEffect(() => {
    userScrolledUp.current = false;
    setShowScrollButton(false);
    scrollToBottom('auto');
  }, [currentChatId, scrollToBottom]);

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
    <div className="flex h-full bg-zinc-950">
      {/* Chat History Sidebar */}
      {showChatHistory && (
        <ChatHistory 
          currentSessionId={currentChatId}
          onSelectSession={handleSelectChat}
          onNewChat={handleNewChat}
          onNewChatConfirm={() => setShowNewChatConfirm(true)}
        />
      )}
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          {/* Messages area with professional scrolling */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-1 scroll-smooth relative"
            onScroll={handleScroll}
          >
            {showContinueBanner && (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <h2 className="text-lg font-medium text-zinc-300">Continúa la conversación</h2>
              <p className="mt-1 text-zinc-500 text-sm">Envía un mensaje para continuar</p>
            </div>
          </div>
        )}

        {showWelcome && (
          <div className="space-y-8">
            {/* Welcome message - Claude style */}
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/50">
                <span className="text-3xl">⚡</span>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100">Soy {assistantName}</h2>
              <p className="mt-2 text-zinc-500 text-lg">Selecciona una plantilla o cuéntame tu idea</p>
            </div>

            {/* Agent Templates Carousel - Claude style */}
            <div className="relative max-w-4xl mx-auto px-4">
              {/* Navigation arrows */}
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 btn btn-circle btn-sm btn-ghost text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 btn btn-circle btn-sm btn-ghost text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
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
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm">
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`p-2.5 rounded-lg ${agent.color} shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-semibold text-lg text-zinc-100">{agent.name}</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {agent.prompts.map((prompt, idx) => (
                                <button
                                  key={idx}
                                  className="btn btn-outline btn-sm h-auto py-2.5 text-left justify-start items-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-100 rounded-lg"
                                  onClick={() => handleSelectPrompt(prompt, agent.agentId)}
                                >
                                  {copiedPrompt === prompt ? (
                                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
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

              {/* Dots indicator - Claude style */}
              <div className="flex justify-center items-center gap-2 mt-6">
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
                          ? 'h-1.5 bg-zinc-200 shadow-md shadow-zinc-400/30' 
                          : 'h-1.5 bg-zinc-700 group-hover:bg-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="text-center">
              <p className="text-sm text-zinc-600 mb-3">O describe tu idea directamente</p>
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

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button - positioned relative to messages container */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-primary btn-circle shadow-lg animate-fade-in z-10"
            title="Ir al final"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom bar - Claude style */}
      <div className="border-t border-zinc-800 bg-zinc-950">
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
            <div role="alert" className="alert bg-red-500/10 border-red-500/30 text-red-400">
              <span>{error}</span>
              <button
                className="btn btn-ghost btn-xs text-red-400"
                onClick={() => useOrchestratorStore.getState().clearError()}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={(text, tools, mcpTools) => {
            // Get MCP tools from store if not provided
            const activeMcpTools = mcpTools || useMCPStore.getState().activeTools;
            // Send message with tools including MCP tools
            sendMessage(text, tools, activeMcpTools);
          }}
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
      
      {/* Agent Change Confirmation Popup for Templates - Claude style */}
      {showAgentConfirm && pendingTemplateAgentId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl w-72 p-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-semibold text-zinc-100">Cambiar agente</h3>
              <p className="text-sm text-zinc-400 mt-2">
                Cambiar a <strong className="text-zinc-200">{AGENT_TEMPLATES.find(t => t.agentId === pendingTemplateAgentId)?.name}</strong>?
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                El template se pegará en el input.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAgentConfirm(false);
                  setPendingTemplateAgentId(null);
                  setPendingTemplatePrompt(null);
                }}
                className="btn btn-ghost btn-sm flex-1 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTemplateAgent}
                className="btn btn-sm flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none font-medium"
              >
                <Save className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* New Chat Confirmation Popup - Claude style */}
      {showNewChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-80 mx-4 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-semibold text-lg text-zinc-100">Nueva conversación</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Los mensajes actuales se borrarán.
              </p>
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="btn btn-ghost btn-sm flex-1 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmNewChat}
                className="btn btn-sm flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none font-medium"
              >
                Nueva conversación
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}
