// ---------------------------------------------------------------------------
// Tool Results Panel - Shows API responses and tool results above final response
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { ChevronUp, ChevronDown, Terminal, Wrench, Zap, Copy, Check } from 'lucide-react';

interface ToolResult {
  tool: string;
  result: string;
}

interface Props {
  apiResponse?: string;
  toolResults: ToolResult[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ToolResultsPanel({ apiResponse, toolResults, isOpen: externalIsOpen, onToggle: externalOnToggle }: Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnToggle ? () => externalOnToggle() : setInternalIsOpen;

  if (!apiResponse && toolResults.length === 0) return null;

  const toggleTool = (idx: number) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="mb-2">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-200">
            {toolResults.length > 0 
              ? `${toolResults.length} herramienta(s) ejecutada(s)` 
              : 'Procesando...'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-cyan-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="mt-2 space-y-2">
          {/* API Response */}
          {apiResponse && (
            <div className="bg-base-200 border border-base-300 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-base-300/50 border-b border-base-300">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">API Response</span>
              </div>
              <div className="p-3">
                <pre className="text-sm font-mono text-base-content/80 whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                  {apiResponse}
                </pre>
              </div>
            </div>
          )}

          {/* Tool Results */}
          {toolResults.map((tr, idx) => {
            const isExpanded = expandedTools.has(idx);
            return (
              <div 
                key={idx}
                className="bg-base-200 border border-purple-500/30 rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 cursor-pointer hover:bg-purple-500/20"
                  onClick={() => toggleTool(idx)}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-300">
                      Herramienta: {tr.tool}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                {isExpanded && (
                  <div className="p-3">
                    {/* Copy button */}
                    <div className="flex justify-end mb-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(tr.result); }}
                        className="btn btn-xs btn-ghost"
                        title="Copy JSON"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    {/* JSON content */}
                    <pre className="text-xs font-mono text-success whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(tr.result), null, 2);
                        } catch {
                          return tr.result;
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
