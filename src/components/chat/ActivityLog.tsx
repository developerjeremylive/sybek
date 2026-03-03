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
      return 'text-success';
    case 'file-error':
      return 'text-error';
    case 'tool-call':
      return 'text-warning';
    case 'tool-result':
      return 'text-info';
    case 'api-call':
      return 'text-primary';
    default:
      return 'text-base-content/70';
  }
}

function getKindBgColor(kind: string): string {
  switch (kind) {
    case 'file-saved':
    case 'file-created':
      return 'bg-success/10';
    case 'file-error':
      return 'bg-error/10';
    case 'tool-call':
      return 'bg-warning/10';
    case 'tool-result':
      return 'bg-info/10';
    case 'api-call':
      return 'bg-primary/10';
    default:
      return 'bg-base-300/30';
  }
}

export function ActivityLog({ entries }: Props) {
  const [open, setOpen] = useState(true);
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());
  const [prevLength, setPrevLength] = useState(0);

  // Auto-open when new entries arrive
  useEffect(() => {
    if (entries.length > prevLength) {
      setOpen(true);
    }
    setPrevLength(entries.length);
  }, [entries.length, prevLength]);

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
                  className={`flex items-start gap-2 px-3 py-2 border-b border-base-300/50 last:border-0 hover:bg-base-300/30 transition-colors ${bgClass}`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 mt-0.5 ${colorClass}`}>
                    <KindIcon className="w-4 h-4" />
                  </div>
                  
                  {/* Time */}
                  <span className="shrink-0 text-[10px] opacity-40 mt-1">
                    {formatTime(entry.timestamp)}
                  </span>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`font-medium text-xs ${colorClass}`}>
                        {label}
                      </span>
                      {detail.length > 60 && (
                        <button
                          className="text-[10px] link link-primary"
                          onClick={() => toggleDetail(originalIdx)}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                    </div>
                    
                    {detail && (
                      <div className={`mt-0.5 text-[10px] opacity-60 break-all font-mono ${
                        detail.length > 60 && !isExpanded ? 'line-clamp-2' : ''
                      }`}>
                        {detail}
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
