// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat input
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Wrench } from 'lucide-react';

interface Props {
  onSend: (text: string, tools?: string[]) => void;
  disabled: boolean;
  initialValue?: string;
}

// MCP tools available by default in Workers AI
const AVAILABLE_TOOLS = [
  { id: 'get_current_time', name: 'Hora actual', icon: '🕐' },
  { id: 'get_weather', name: 'Clima', icon: '🌤️' },
  { id: 'joke', name: 'Chiste', icon: '😂' },
  { id: 'cat_fact', name: 'Dato gato', icon: '🐱' },
  { id: 'hackernews', name: 'HN News', icon: '📰' },
];

export function ChatInput({ onSend, disabled, initialValue }: Props) {
  const [text, setText] = useState('');
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
    onSend(trimmed);
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
    <div className="flex flex-col gap-2 p-4 pb-2">
      {/* MCP Tools available - info display */}
      <div className="flex items-center gap-2 px-2 py-1 bg-base-200 rounded-lg text-xs">
        <Wrench className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-base-content/60">Disponibles:</span>
        {AVAILABLE_TOOLS.map((tool) => (
          <span key={tool.id} className="flex items-center gap-0.5 text-purple-300" title={tool.name}>
            {tool.icon}
          </span>
        ))}
      </div>
      
      {/* Input row */}
      <div className="flex items-end gap-2">
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
          className="btn btn-primary btn-circle"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
