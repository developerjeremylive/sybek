// ---------------------------------------------------------------------------
// OpenBrowserClaw — Activity log (collapsible)
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link, Wrench, ClipboardList, MessageSquare, Info, FileCode, FolderPlus, Save, X } from 'lucide-react';
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

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
    default:
      return '';
  }
}

export function ActivityLog({ entries }: Props) {
  const [open, setOpen] = useState(true); // Default open
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());

  // Filter to show only relevant activities (last 10)
  const recentEntries = entries.slice(-10);

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
    <div className="px-4 pt-2">
      <div className="collapse collapse-arrow bg-base-200 border border-base-300 rounded-lg">
        <input
          type="checkbox"
          checked={open}
          onChange={() => setOpen(!open)}
        />
        <div className="collapse-title text-sm font-medium py-2 min-h-0 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Actividad
          <span className="badge badge-sm badge-primary ml-1">{entries.length}</span>
        </div>
        <div className="collapse-content">
          <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
            {recentEntries.map((entry, idx) => {
              const originalIdx = entries.length - recentEntries.length + idx;
              const KindIcon = kindIcons[entry.kind];
              const colorClass = getKindColor(entry.kind);
              return (
              <div key={originalIdx} className="flex items-start gap-2 p-1.5 rounded hover:bg-base-300/50">
                {KindIcon ? (
                  <KindIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${colorClass}`} />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0 mt-0.5">•</span>
                )}
                <span className="opacity-50 shrink-0 text-[10px]">
                  {formatTime(entry.timestamp)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{entry.label}</span>
                  {entry.detail && (
                    <>
                      {entry.detail.length > 80 && (
                        <button
                          className="ml-1 link link-primary text-xs"
                          onClick={() => toggleDetail(originalIdx)}
                        >
                          {expandedDetails.has(originalIdx) ? 'menos' : 'más'}
                        </button>
                      )}
                      <div
                        className={`mt-0.5 opacity-60 break-all ${
                          entry.detail.length > 80 && !expandedDetails.has(originalIdx)
                            ? 'line-clamp-1'
                            : ''
                        }`}
                      >
                        {entry.detail}
                      </div>
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
