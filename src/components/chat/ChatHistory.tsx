// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat History Sidebar
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Search, X, ChevronRight } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: number;
  preview?: string;
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

export function addToChatHistory(title: string, lastMessage: string, preview?: string): ChatSession {
  const history = getChatHistory();
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: title.slice(0, 50),
    lastMessage: lastMessage.slice(0, 100),
    updatedAt: Date.now(),
    preview,
  };
  
  // Add to beginning
  history.unshift(newSession);
  
  // Keep only last 50 chats
  const trimmed = history.slice(0, 50);
  saveChatHistory(trimmed);
  
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
  const history = getChatHistory().filter(s => s.id !== sessionId);
  saveChatHistory(history);
}

interface ChatHistoryProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistory({ currentSessionId, onSelectSession, onNewChat }: ChatHistoryProps) {
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);

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
    const now = Date.now();
    const diff = now - timestamp;
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
    <div className={`flex flex-col border-r border-base-300 bg-base-200 transition-all duration-300 ${isOpen ? 'w-72' : 'w-0'}`}>
      {/* Header */}
      <div className="p-3 border-b border-base-300 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chats
          </h2>
          <button
            onClick={onNewChat}
            className="btn btn-primary btn-xs btn-circle"
            title="Nuevo chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            type="text"
            placeholder="Buscar chats..."
            className="input input-sm input-bordered w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No hay chats</p>
            <button onClick={onNewChat} className="btn btn-ghost btn-xs mt-2">
              Crear chat
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectSession(chat.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors group ${
                  currentSessionId === chat.id 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-base-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{chat.title}</div>
                    <div className="text-xs opacity-50 truncate mt-0.5">
                      {chat.lastMessage || 'Sin mensajes'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] opacity-40">{formatTime(chat.updatedAt)}</span>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity text-error"
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
    </div>
  );
}

// Toggle button component for showing/hiding sidebar
export function ChatHistoryToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="btn btn-ghost btn-sm btn-circle absolute left-2 top-2 z-10"
      title={isOpen ? 'Ocultar historial' : 'Mostrar historial'}
    >
      <MessageSquare className="w-5 h-5" />
    </button>
  );
}
