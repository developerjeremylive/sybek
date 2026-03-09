// ---------------------------------------------------------------------------
// Tool Result Display - Futuristic component for tool responses
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ToolResult {
  tool: string;
  result: string;
  status: 'running' | 'done' | 'error';
}

interface Props {
  toolResults: ToolResult[];
}

export function ToolResultDisplay({ toolResults }: Props) {
  if (toolResults.length === 0) return null;

  return (
    <div className="my-3 space-y-2">
      {toolResults.map((tool, index) => (
        <ToolResultItem key={index} tool={tool} />
      ))}
    </div>
  );
}

function ToolResultItem({ tool }: { tool: ToolResult }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Format tool name for display
  const toolName = tool.tool.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  // Try to parse JSON result for better display
  let displayResult = tool.result;
  try {
    const parsed = JSON.parse(tool.result);
    displayResult = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep original if not JSON
  }

  const isError = tool.status === 'error' || tool.result.includes('error');
  const isRunning = tool.status === 'running';

  return (
    <div className={`bg-gradient-to-r from-slate-900 border rounded-lg overflow-hidden ${
      isError ? 'border-red-500/50' : isRunning ? 'border-yellow-500/50' : 'border-cyan-500/50'
    }`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-3 py-2 flex items-center justify-between transition-all ${
          isError ? 'bg-red-500/20 hover:bg-red-500/30' : isRunning ? 'bg-yellow-500/20 hover:bg-yellow-500/30' : 'bg-cyan-500/20 hover:bg-cyan-500/30'
        }`}
      >
        <div className="flex items-center gap-2">
          {isRunning ? (
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className={`w-4 h-4 ${isError ? 'text-red-400' : 'text-cyan-400'}`} />
          )}
          <span className={`text-sm font-medium ${isError ? 'text-red-300' : isRunning ? 'text-yellow-300' : 'text-cyan-300'}`}>
            ⚙️ {toolName}
          </span>
          {isRunning && <span className="text-xs text-yellow-400">Ejecutando...</span>}
          {isError && <span className="text-xs text-red-400">Error</span>}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-cyan-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-cyan-400" />
        )}
      </button>

      {/* Result Content */}
      {isExpanded && !isRunning && (
        <div className="p-3 bg-slate-900/50">
          <pre className={`text-xs font-mono whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-green-400'}`}>
            {displayResult}
          </pre>
        </div>
      )}
    </div>
  );
}

// Standalone component for tool activity events
export function ToolActivityDisplay({ activities }: { activities: Array<{ tool: string; status: string; timestamp: number }> }) {
  const [collapsed, setCollapsed] = useState(true);
  
  if (activities.length === 0) return null;

  return (
    <div className="my-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:bg-purple-500/30 transition-colors"
      >
        <Zap className="w-4 h-4" />
        <span>Herramientas ({activities.length})</span>
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
      
      {!collapsed && (
        <div className="mt-2 space-y-1">
          {activities.map((activity, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                activity.status === 'done' 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : activity.status === 'running'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {activity.status === 'done' ? '✅' : activity.status === 'running' ? '⏳' : '❌'}
              <span className="font-medium">{activity.tool.replace(/_/g, ' ')}</span>
              <span className="opacity-70">- {activity.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
