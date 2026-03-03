// ---------------------------------------------------------------------------
// OpenBrowserClaw — Message bubble with collapsible code blocks
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import type { StoredMessage } from '../../types.js';

interface Props {
  message: StoredMessage;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// CodeBlock component - collapsible
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = code.split('\n').length > 5 || code.length > 200;

  if (!isLong) {
    return (
      <pre className="bg-slate-800 p-3 rounded-lg overflow-x-auto my-2 text-xs">
        <code className="text-cyan-300 font-mono">{code}</code>
      </pre>
    );
  }

  return (
    <div className="my-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-t-lg hover:bg-purple-500/30 transition-colors"
      >
        <span className="text-xs text-purple-300 font-mono">
          📄 Código {language ? `(${language})` : ''} • Click para {isExpanded ? 'colapsar' : 'expandir'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-400" />
        )}
      </button>
      {isExpanded && (
        <pre className="bg-slate-900 p-3 border border-purple-500/30 rounded-b-lg overflow-x-auto text-xs">
          <code className="text-cyan-300 font-mono">{code}</code>
        </pre>
      )}
    </div>
  );
}

// Parse message content for code blocks and regular text
function parseContent(content: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    // Add code block
    parts.push({ type: 'code', content: match[2], language: match[1] || 'text' });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts;
}

export function MessageBubble({ message }: Props) {
  const isAssistant = message.isFromMe;
  const senderName = isAssistant ? 'Sybek' : 'You';

  // Check if this is a response with saved files
  const content = message.content || '';
  const hasSavedFiles = content.includes('guardados') || content.includes('Archivos');

  // Extract LLM response and saved files
  let llmResponse = content;
  let savedFiles: string[] = [];

  if (hasSavedFiles) {
    const fileMatch = content.match(/✅ Archivos guardados:[\s\S]*/);
    if (fileMatch) {
      const filesSection = fileMatch[0];
      llmResponse = content.replace(filesSection, '').trim();
      savedFiles = filesSection
        .replace('✅ Archivos guardados:', '')
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(f => f.replace(/^-\s*/, '').trim());
    }
  }

  // Parse content for code blocks
  const contentParts = parseContent(llmResponse);

  // User message - simple render
  if (!isAssistant || !hasSavedFiles) {
    return (
      <div className={`chat ${isAssistant ? 'chat-start' : 'chat-end'}`}>
        <div className="chat-header opacity-50 text-xs mb-1">
          <Bot className="w-3 h-3 inline mr-1" />
          {senderName}
          <time className="ml-2">{formatTime(message.timestamp)}</time>
        </div>
        <div className={`chat-bubble ${isAssistant ? 'chat-bubble-neutral' : 'chat-bubble-primary'}`}>
          <div className="prose prose-sm max-w-none">
            {contentParts.map((part, i) => (
              part.type === 'code' ? (
                <CodeBlock key={i} code={part.content} language={part.language!} />
              ) : (
                <div key={i} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: part.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-base-300/50 px-1 rounded text-sm">$1</code>')
                    .replace(/\n/g, '<br/>')
                }} />
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Assistant response with saved files - show collapsible UI
  const [showResponse, setShowResponse] = useState(true);

  return (
    <div className="chat chat-start">
      <div className="chat-header opacity-50 text-xs mb-1">
        <Bot className="w-3 h-3 inline mr-1" />
        Sybek
        <time className="ml-2">{formatTime(message.timestamp)}</time>
      </div>

      {/* Futuristic collapsible response */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900/50 to-slate-900 border border-purple-500/30 rounded-lg overflow-hidden shadow-lg shadow-purple-500/10">
        {/* Header */}
        <button
          onClick={() => setShowResponse(!showResponse)}
          className="w-full px-4 py-2 flex items-center justify-between bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 transition-all"
        >
          <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Respuesta del Asistente
          </span>
          {showResponse ? (
            <ChevronUp className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Content with collapsible code blocks */}
        {showResponse && (
          <div className="p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              {contentParts.map((part, i) => (
                part.type === 'code' ? (
                  <CodeBlock key={i} code={part.content} language={part.language!} />
                ) : (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{
                    __html: part.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="text-cyan-300">$1</em>')
                      .replace(/`(.*?)`/g, '<code class="bg-purple-500/30 px-1.5 py-0.5 rounded text-purple-200 font-mono text-xs">$1</code>')
                      .replace(/\n/g, '<br/>')
                  }} />
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved Files */}
      {savedFiles.length > 0 && (
        <div className="mt-2 p-3 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400">✅</span>
            <span className="text-sm font-medium bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Archivos guardados
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedFiles.map((file, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-xs text-emerald-300 font-mono"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
