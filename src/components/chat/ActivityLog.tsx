// ---------------------------------------------------------------------------
// OpenBrowserClaw — Activity log (collapsible)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { 
  Link, Wrench, ClipboardList, MessageSquare, Info, 
  FileCode, FolderPlus, Save, X, Bot, Sparkles, Clock 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThinkingLogEntry } from '../../types.js';

interface Props {
  entries: ThinkingLogEntry[];
}

const kindIcons: Record<string, LucideIcon> = {
  'api-call': Link,
  'tool-call': Wrench,
  'tool-result': ClipboardList,
  'text': MessageSquare,
  'info': Info,
  'file-saved': Save,
  'file-error': X,
  'file-created': FolderPlus,
  'file-updated': FileCode,
  'mcp-tool': Sparkles,
};

const kindLabels: Record<string, string> = {
  'api-call': 'Llamada API',
  'tool-call': 'Herramienta',
  'tool-result': 'Resultado',
  'text': 'Respuesta',
  'info': 'Información',
  'file-saved': 'Archivo guardado',
  'file-error': 'Error de archivo',
  'file-created': 'Archivo creado',
  'file-updated': 'Archivo actualizado',
  'mcp-tool': 'MCP Tool',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getKindColor(kind: string): string {
  switch (kind) {
    case 'file-saved':
    case 'file-created':
      return 'text-emerald-400';
    case 'file-error':
      return 'text-red-400';
    case 'tool-call':
      return 'text-amber-400';
    case 'tool-result':
      return 'text-cyan-400';
    case 'api-call':
      return 'text-blue-400';
    case 'mcp-tool':
      return 'text-purple-400';
    default:
      return 'text-base-content/70';
  }
}

function getKindBgColor(kind: string): string {
  switch (kind) {
    case 'file-saved':
    case 'file-created':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'file-error':
      return 'bg-red-500/10 border-red-500/20';
    case 'tool-call':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'tool-result':
      return 'bg-cyan-500/10 border-cyan-500/20';
    case 'api-call':
      return 'bg-blue-500/10 border-blue-500/20';
    case 'mcp-tool':
      return 'bg-purple-500/10 border-purple-500/20';
    default:
      return 'bg-base-300/30 border-base-300/50';
  }
}

export function ActivityLog({ entries }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  // Get last 15 entries
  const recentEntries = entries.slice(-15);

  function toggleDetail(idx: number) {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  if (entries.length === 0) return null;

  return (
    <div className="px-2 py-1">
      <div className="bg-base-200 border border-base-300 rounded-lg overflow-hidden">
        {/* Header */}
        <button 
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-base-300/50 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Actividad</span>
            <span className="badge badge-primary badge-sm">{entries.length}</span>
          </div>
          <div className="flex items-center gap-1">
            {entries.length > 0 && (
              <span className="text-xs opacity-50">
                {formatTime(entries[entries.length - 1]?.timestamp || 0)}
              </span>
            )}
            <Sparkles className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Content */}
        {open && (
          <div className="border-t border-base-300 max-h-48 overflow-y-auto">
            {recentEntries.map((entry, idx) => {
              const originalIdx = entries.length - recentEntries.length + idx;
              const KindIcon = kindIcons[entry.kind] || Info;
              const colorClass = getKindColor(entry.kind);
              const bgClass = getKindBgColor(entry.kind);
              const label = entry.label || kindLabels[entry.kind] || entry.kind;
              const detail = entry.detail || '';
              const isExpanded = expandedDetails.has(originalIdx);
              
              return (
                <div 
                  key={originalIdx} 
                  className={`flex items-start gap-2 px-3 py-2 border-b border-base-300/30 last:border-0 hover:bg-base-300/20 transition-all rounded-md mx-1 ${bgClass}`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 mt-0.5 ${colorClass}`}>
                    <KindIcon className="w-3.5 h-3.5" />
                  </div>
                  
                  {/* Time */}
                  <span className="shrink-0 text-[10px] opacity-40 mt-0.5 font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold text-xs ${colorClass}`}>
                        {label}
                      </span>
                    </div>
                    
                    {detail && (
                      <div className={`mt-1 text-[11px] opacity-70 break-all font-mono leading-relaxed ${
                        detail.length > 80 ? 'line-clamp-2' : ''
                      }`}>
                        {detail}
                      </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
