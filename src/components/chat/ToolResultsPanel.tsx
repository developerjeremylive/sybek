// ---------------------------------------------------------------------------
// Tool Results Panel - Shows tool results above final response
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { ChevronUp, ChevronDown, Wrench, Copy } from 'lucide-react';

interface ToolResult {
  tool: string;
  result: string;
}

interface Props {
  apiResponse?: string;
  toolResults: ToolResult[];
}

export function ToolResultsPanel({ apiResponse, toolResults }: Props) {
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());

  if (toolResults.length === 0) return null;

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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-t-lg">
        <Wrench className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-purple-200">
          {toolResults.length} herramienta(s) ejecutada(s)
        </span>
      </div>

      {/* Tool Results */}
      <div className="space-y-2 mt-2">
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
                    {tr.tool}
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
    </div>
  );
}
