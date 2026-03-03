// ---------------------------------------------------------------------------
// Chat Context Indicator - floating button showing current session/folder
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Folder, X, RefreshCw, Check, FileCode } from 'lucide-react';

interface Props {
  onNewChat?: () => void;
}

export function ChatContextIndicator({ onNewChat }: Props) {
  const [contextFolders, setContextFolders] = useState<string[]>([]);
  const [currentSessionFolder, setCurrentSessionFolder] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const savedFolders = localStorage.getItem('contextFolders');
    const savedSession = localStorage.getItem('currentSessionFolder');
    setContextFolders(savedFolders ? JSON.parse(savedFolders) : []);
    setCurrentSessionFolder(savedSession || '');
  }, []);
  
  const hasContext = currentSessionFolder || contextFolders.length > 0;
  
  if (!hasContext) return null;
  
  return (
    <div className="fixed bottom-24 right-4 z-50">
      {isExpanded && (
        <div className="absolute bottom-12 right-0 w-72 bg-base-200 border border-base-300 rounded-lg shadow-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Contexto del Chat</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setIsExpanded(false)}>
              <X className="w-3 h-3" />
            </button>
          </div>
          
          {currentSessionFolder && (
            <div className="flex items-center gap-2 text-xs bg-success/10 p-2 rounded">
              <Folder className="w-4 h-4 text-success shrink-0" />
              <span className="truncate">{currentSessionFolder}</span>
              <Check className="w-3 h-3 text-success shrink-0 ml-auto" />
            </div>
          )}
          
          {contextFolders.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs opacity-50">Carpetas adicionales:</span>
              {contextFolders.map((folder: string) => (
                <div key={folder} className="flex items-center gap-2 text-xs bg-base-300 p-2 rounded">
                  <FileCode className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate flex-1">{folder}</span>
                </div>
              ))}
            </div>
          )}
          
          {onNewChat && (
            <button className="btn btn-sm btn-outline w-full mt-2" onClick={onNewChat}>
              <RefreshCw className="w-4 h-4" />
              Nueva conversación
            </button>
          )}
        </div>
      )}
      
      <button
        className="btn btn-circle btn-lg bg-primary text-primary-content shadow-lg hover:bg-primary-focus"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Contexto del chat"
      >
        <Folder className="w-6 h-6" />
        {(currentSessionFolder || contextFolders.length > 0) && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
            <Check className="w-2 h-2" />
          </span>
        )}
      </button>
    </div>
  );
}
