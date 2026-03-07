// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat page
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Layout, Smartphone, Code, Zap, ChevronLeft, ChevronRight, Copy, Check, Trash2 } from 'lucide-react';
import { useOrchestratorStore } from '../../stores/orchestrator-store.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import { TypingIndicator } from './TypingIndicator.js';
import { ActivityLog } from './ActivityLog.js';
import { ContextBar } from './ContextBar.js';
import { ChatActions } from './ChatActions.js';
import { ChatContextIndicator } from './ChatContextIndicator.js';
import { ToolResultsPanel } from './ToolResultsPanel.js';

// Agent templates for prompt carousel
const AGENT_TEMPLATES = [
    {
        id: 'landing-page',
        name: 'Landing Page',
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

  const [activeSlide, setActiveSlide] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const hasMessages = messages.length > 0;
  // Show "Continúa la conversación" only when:
  // - There are at least 2 messages (user + assistant completed)
  // - We're idle (not thinking/responding)
  // - The last message was from the assistant (isFromMe = true)
  const lastMessage = messages[messages.length - 1];
  const showContinueBanner = messages.length >= 2 && 
    orchState === 'idle' && 
    lastMessage?.isFromMe === true;

  function handleSelectPrompt(prompt: string) {
    setInputValue(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  }

  function nextSlide() {
    setActiveSlide((prev) => (prev + 1) % AGENT_TEMPLATES.length);
  }

  function prevSlide() {
    setActiveSlide((prev) => (prev - 1 + AGENT_TEMPLATES.length) % AGENT_TEMPLATES.length);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
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

        {!showContinueBanner && (
          <div className="space-y-6">
            {/* Welcome message */}
            <div className="text-center py-4">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-primary opacity-80" />
              <h2 className="text-3xl font-bold">¡Hola! Soy Sybek</h2>
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
                                  onClick={() => handleSelectPrompt(prompt)}
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
              <div className="flex justify-center gap-2 mt-4">
                {AGENT_TEMPLATES.map((_, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-xs btn-circle ${idx === activeSlide ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveSlide(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="text-center">
              <p className="text-sm opacity-50 mb-3">O describe tu idea directamente</p>
            </div>
          </div>
        )}

        <MessageList messages={messages} />

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

        {/* Context / token usage bar */}
        {tokenUsage && <ContextBar usage={tokenUsage} />}

        {/* Compact / New Session actions */}
        <ChatActions disabled={orchState !== 'idle'} />

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
    </div>
  );
}
