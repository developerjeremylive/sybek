// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat History (simplified inline version)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Search, X, PanelLeftClose, PanelLeft } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: number;
}

const CHAT_HISTORY_KEY = 'obc_chat_history';
const CHAT_MESSAGES_PREFIX = 'obc_chat_messages_';

export function getChatHistory(): ChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveChatMessages(sessionId: string, messages: any[]): void {
  try {
    localStorage.setItem(CHAT_MESSAGES_PREFIX + sessionId, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving chat messages:', e);
  }
}

export function loadChatMessages(sessionId: string): any[] | null {
  try {
    const stored = localStorage.getItem(CHAT_MESSAGES_PREFIX + sessionId);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(history: ChatSession[]): void {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
}

export function addToChatHistory(title: string, lastMessage: string): ChatSession {
  const history = getChatHistory();
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: title.slice(0, 50),
    lastMessage: lastMessage.slice(0, 100),
    updatedAt: Date.now(),
  };
  history.unshift(newSession);
  saveChatHistory(history.slice(0, 50));
  return newSession;
}

export function updateChatHistory(sessionId: string, title?: string, lastMessage?: string): void {
  const history = getChatHistory();
  const idx = history.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    if (title) history[idx].title = title.slice(0, 50);
    if (lastMessage) history[idx].lastMessage = lastMessage.slice(0, 100);
    history[idx].updatedAt = Date.now();
    saveChatHistory(history);
  }
}

export function deleteFromChatHistory(sessionId: string): void {
  saveChatHistory(getChatHistory().filter(s => s.id !== sessionId));
}

interface ChatHistoryProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onNewChatConfirm: () => void;
}

export function ChatHistory({ currentSessionId, onSelectSession, onNewChat, onNewChatConfirm }: ChatHistoryProps) {
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getChatHistory());
  }, [currentSessionId]);

  const filteredHistory = history.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    deleteFromChatHistory(sessionId);
    setHistory(getChatHistory());
  }

  function formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString('es', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="w-64 sm:w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full shrink-0 fixed sm:relative inset-0 sm:inset-auto z-50 sm:z-auto">
      {/* Header - Claude style - sticky */}
      <div className="p-3 border-b border-zinc-800 shrink-0 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-zinc-200 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Historial
          </h2>
          <button 
            onClick={onNewChatConfirm} 
            className="btn btn-ghost btn-xs btn-circle text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Nuevo chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            className="input input-sm w-full pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-0 rounded-md text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Chat list - Claude style - separate scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 scroll-smooth">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 opacity-40">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-zinc-500" />
            <p className="text-sm text-zinc-400">Sin conversaciones</p>
            <p className="text-xs text-zinc-600 mt-1">Crea un nuevo chat para empezar</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectSession(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-150 group ${
                  currentSessionId === chat.id 
                    ? 'bg-zinc-800/80 border border-zinc-700/50' 
                    : 'hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-zinc-100 truncate">{chat.title}</div>
                    <div className="text-xs text-zinc-500 truncate mt-1 line-clamp-1">{chat.lastMessage || 'Sin mensajes'}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-zinc-600">{formatTime(chat.updatedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(chat.id);
                      }}
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Popup - Claude style */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-80 mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">Eliminar chat</h3>
                  <p className="text-xs text-zinc-500">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-4">
              <p className="text-sm text-zinc-300 mb-3">
                ¿Eliminar esta conversación?
              </p>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                <p className="font-medium mb-1 text-zinc-300">ℹ️ Nota:</p>
                <p>Los archivos en <strong className="text-zinc-300">Files</strong> no se eliminarán.</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-ghost btn-sm flex-1 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteFromChatHistory(deleteConfirmId);
                  setHistory(getChatHistory());
                  setDeleteConfirmId(null);
                }}
                className="btn btn-sm flex-1 bg-red-500 hover:bg-red-600 text-white border-none"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
