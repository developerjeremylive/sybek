// ---------------------------------------------------------------------------
// OpenBrowserClaw — System Prompt Floating Component
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown, Bot } from 'lucide-react';
import { getConfig, setConfig } from '../../db.js';
import { CONFIG_KEYS } from '../../config.js';

interface SystemPromptFloatingProps {
  onClose?: () => void;
}

export function SystemPromptFloating({ onClose }: SystemPromptFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeAgentName, setActiveAgentName] = useState<string>('Default');
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load current system prompt and active agent
  useEffect(() => {
    async function load() {
      const prompt = await getConfig(CONFIG_KEYS.SYSTEM_PROMPT);
      const activeAgent = await getConfig(CONFIG_KEYS.USE_AGENTS_FILE);
      
      if (prompt) {
        setSystemPrompt(prompt);
      }
      
      if (activeAgent) {
        setActiveAgentId(activeAgent);
        setActiveAgentName(activeAgent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      }
    }
    load();
  }, []);

  // Save system prompt
  async function handleSave() {
    setSaving(true);
    try {
      await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, systemPrompt);
      // Show success briefly
      setTimeout(() => setSaving(false), 1000);
    } catch (err) {
      console.error('Error saving system prompt:', err);
      setSaving(false);
    }
  }

  // Copy to clipboard
  function handleCopy() {
    navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Toggle expand/collapse
  function toggleOpen() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating button when collapsed */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="btn btn-primary btn-circle shadow-lg"
          title="System Prompt"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-base-200 border border-base-300 rounded-lg shadow-xl w-80 sm:w-96 animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-100 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">System Prompt</span>
              {activeAgentId && (
                <span className="badge badge-primary badge-sm">{activeAgentName}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="btn btn-ghost btn-xs"
                title="¿Qué es el System Prompt?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="btn btn-ghost btn-xs"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Help tooltip */}
          {showHelp && (
            <div className="p-3 bg-base-100 border-b border-base-300 text-xs">
              <p className="font-medium mb-1">¿Qué es el System Prompt?</p>
              <p className="opacity-70 mb-2">
                El system prompt son las instrucciones que definen cómo el asistente debe comportarse. 
                Incluyen su personalidad, objetivos y reglas.
              </p>
              <p className="opacity-70">
                Este prompt se enviará junto con tu próximo mensaje al asistente, 
                afectando cómo responde y qué puede hacer.
              </p>
            </div>
          )}

          {/* Editor */}
          <div className="p-3">
            <textarea
              className="textarea textarea-bordered w-full h-40 text-xs font-mono resize-none"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Escribe el system prompt aquí..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-3 border-t border-base-300 bg-base-100 rounded-b-lg">
            <button
              onClick={handleCopy}
              className="btn btn-ghost btn-xs"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={toggleOpen}
                className="btn btn-ghost btn-sm"
              >
                Cerrar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Info footer */}
          <div className="px-3 pb-3 text-xs opacity-50 text-center">
            Se utilizará en el próximo mensaje que envíes
          </div>
        </div>
      )}
    </div>
  );
}
