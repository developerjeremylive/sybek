// ---------------------------------------------------------------------------
// OpenBrowserClaw — Futuristic Tool Execution Display
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { 
  Cpu, Wrench, CheckCircle, XCircle, Loader2, 
  ChevronDown, ChevronUp, FileText, Bot, Sparkles 
} from 'lucide-react';

interface ToolExecution {
  id: string;
  tool: string;
  status: 'running' | 'done' | 'error';
  result?: string;
  timestamp: number;
}

interface Props {
  tools: ToolExecution[];
}

export function ToolExecutionDisplay({ tools }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Show only last 3 by default
  const displayTools = showAll ? tools : tools.slice(-3);
  const hasMore = tools.length > 3;

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (tools.length === 0) return null;

  return (
    <div className="my-4 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-2">
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        <span className="text-xs font-medium text-purple-400">
          Herramientas ejecutadas
        </span>
        <span className="badge badge-outline badge-sm text-purple-400 border-purple-400">
          {tools.length}
        </span>
      </div>

      {/* Tool cards */}
      <div className="space-y-2">
        {displayTools.map((tool, idx) => {
          const isExpanded = expanded.has(tool.id);
          const isRunning = tool.status === 'running';
          const isError = tool.status === 'error';
          
          return (
            <div 
              key={tool.id}
              className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-base-200 to-cyan-900/20"
            >
              {/* Animated border glow when running */}
              {isRunning && (
                <div className="absolute inset-0 animate-pulse bg-purple-500/10" />
              )}
              
              {/* Header */}
              <button
                onClick={() => toggleExpand(tool.id)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-base-300/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4 text-error" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-success" />
                  )}
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-sm text-cyan-300">
                    {tool.tool}
                  </span>
                </div>
                {tool.result && (
                  isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-base-content/50" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-base-content/50" />
                  )
                )}
              </button>

              {/* Result */}
              {tool.result && isExpanded && (
                <div className="px-3 pb-3 border-t border-purple-500/20">
                  <pre className="mt-2 text-xs font-mono text-base-content/70 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                    {tool.result}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="btn btn-ghost btn-xs text-purple-400"
        >
          {showAll ? 'Mostrar menos' : `Mostrar ${tools.length - 3} más`}
        </button>
      )}
    </div>
  );
}

// Hook to track tool executions from store
export function useToolExecutions() {
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const toolResults = useOrchestratorStore((s) => s.toolResults);
  
  useEffect(() => {
    // Convert tool results to executions
    const executions: ToolExecution[] = toolResults.map((tr, idx) => ({
      id: `${tr.tool}-${idx}`,
      tool: tr.tool,
      status: 'done' as const,
      result: tr.result?.slice(0, 500),
      timestamp: Date.now() - (toolResults.length - idx) * 1000,
    }));
    
    setToolExecutions(executions);
  }, [toolResults]);

  return toolExecutions;
}

// Need to import from store
import { useOrchestratorStore } from '../../stores/orchestrator-store.js';
