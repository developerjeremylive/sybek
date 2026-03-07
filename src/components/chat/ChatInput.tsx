// ---------------------------------------------------------------------------
// OpenBrowserClaw — Chat input with tools
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { AgentSkillsPanel } from './AgentSkillsPanel.js';

interface Props {
  onSend: (text: string, tools?: string[]) => void;
  disabled: boolean;
  initialValue?: string;
}

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
    // Send message without tools
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
    <div className="flex items-end gap-2 p-4">
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
      <div className="flex items-center gap-2">
        <AgentSkillsPanel />
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
