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

export function getChatHistory(): ChatSession[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
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
}

export function ChatHistory({ currentSessionId, onSelectSession, onNewChat }: ChatHistoryProps) {
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
    <div className="w-72 border-r border-base-300 bg-base-200 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-base-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chats
          </h2>
          <button onClick={onNewChat} className="btn btn-primary btn-xs btn-circle">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Buscar..."
            className="input input-sm input-bordered w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No hay chats</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectSession(chat.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors group ${
                  currentSessionId === chat.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-base-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{chat.title}</div>
                    <div className="text-xs opacity-50 truncate mt-0.5">{chat.lastMessage || 'Sin mensajes'}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] opacity-40">{formatTime(chat.updatedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(chat.id);
                      }}
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-error"
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
      
      {/* Delete Confirmation Popup */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-base-200 border border-error/30 rounded-xl shadow-2xl w-80 mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-error/20 bg-error/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h3 className="font-bold text-error">¿Eliminar Chat?</h3>
                  <p className="text-xs opacity-60">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-4">
              <p className="text-sm mb-3">
                ¿Estás seguro de que deseas eliminar este chat?
              </p>
              <div className="bg-base-300/50 rounded-lg p-3 text-xs opacity-70">
                <p className="font-medium mb-1">ℹ️ Nota:</p>
                <p>Los archivos creados en <strong>Files</strong> no se eliminarán. Solo se borrará el historial de conversación.</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn btn-ghost btn-sm flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteFromChatHistory(deleteConfirmId);
                  setHistory(getChatHistory());
                  setDeleteConfirmId(null);
                }}
                className="btn btn-error btn-sm flex-1"
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
