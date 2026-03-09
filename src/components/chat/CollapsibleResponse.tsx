// ---------------------------------------------------------------------------
// Collapsible LLM Response Component
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { ChevronDown, ChevronUp, Bot } from 'lucide-react';

interface Props {
  response: string;
  savedFiles?: string[];
}

export function CollapsibleResponse({ response, savedFiles = [] }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="my-4">
      {/* Collapsible LLM Response */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30 rounded-lg overflow-hidden">
        {/* Header - click to expand/collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">Respuesta del Asistente</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-purple-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-400" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <div 
                className="text-gray-200 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: response
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-purple-500/20 px-1 rounded text-purple-300">$1</code>')
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Saved Files */}
      {savedFiles.length > 0 && (
        <div className="mt-3 p-3 bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-400">✅</span>
            <span className="text-sm font-medium text-emerald-200">Archivos guardados:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedFiles.map((file, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs text-emerald-300"
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
