// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agents page (AGENTS.md editor)
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { FileText, Save, RotateCcw, FolderOpen, Plus, Trash2, Check, X, Info } from 'lucide-react';
import { DEFAULT_GROUP_ID, CONFIG_KEYS } from '../../config.js';
import { readGroupFile, writeGroupFile, listGroupFiles } from '../../storage.js';
import { getConfig, setConfig } from '../../db.js';

interface AgentFile {
  name: string;
  path: string;
}

const DEFAULT_AGENTS_PATH = 'AGENTS.md';

export function AgentsPage() {
  const [agentsPath, setAgentsPath] = useState<string>(DEFAULT_AGENTS_PATH);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useAgentsFile, setUseAgentsFile] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  // Load saved configuration
  useEffect(() => {
    async function loadConfig() {
      const savedPath = await getConfig(CONFIG_KEYS.AGENTS_FILE_PATH);
      const savedUseAgents = await getConfig(CONFIG_KEYS.USE_AGENTS_FILE);
      const savedSystemPrompt = await getConfig(CONFIG_KEYS.SYSTEM_PROMPT);
      
      if (savedPath) setAgentsPath(savedPath);
      setUseAgentsFile(savedUseAgents !== 'false');
      if (savedSystemPrompt) setSystemPrompt(savedSystemPrompt);
    }
    loadConfig();
  }, []);

  // Load AGENTS.md content
  const loadAgentsFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fileContent = await readGroupFile(DEFAULT_GROUP_ID, agentsPath);
      setContent(fileContent);
    } catch (err) {
      // File doesn't exist yet - provide default template
      if ((err as Error)?.name === 'NotFoundError') {
        setContent(getDefaultAgentsTemplate());
      } else {
        setError('Failed to load AGENTS.md file');
      }
    } finally {
      setLoading(false);
    }
  }, [agentsPath]);

  useEffect(() => {
    loadAgentsFile();
  }, [loadAgentsFile]);

  // Save AGENTS.md content
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await writeGroupFile(DEFAULT_GROUP_ID, agentsPath, content);
      setSuccess('AGENTS.md saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save AGENTS.md');
    } finally {
      setSaving(false);
    }
  }

  // Save configuration
  async function handleSaveConfig() {
    try {
      await setConfig(CONFIG_KEYS.AGENTS_FILE_PATH, agentsPath);
      await setConfig(CONFIG_KEYS.USE_AGENTS_FILE, String(useAgentsFile));
      if (systemPrompt) {
        await setConfig(CONFIG_KEYS.SYSTEM_PROMPT, systemPrompt);
      }
      setSuccess('Configuration saved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save configuration');
    }
  }

  // Reset to default template
  function handleReset() {
    setContent(getDefaultAgentsTemplate());
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">Agents Configuration</span>
            <span className="text-xs opacity-50 ml-1">(AGENTS.md Protocol)</span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              title="Edit System Prompt"
            >
              <Info className="w-4 h-4" />
              {showSystemPrompt ? 'Hide' : 'System Prompt'}
            </button>
          </div>
        </div>
      </div>

      {/* System Prompt Editor (collapsible) */}
      {showSystemPrompt && (
        <div className="border-b border-base-300 bg-base-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium flex items-center gap-2">
              Custom System Prompt
              <span className="text-xs opacity-50">(overrides default)</span>
            </label>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSaveConfig}
            >
              <Save className="w-4 h-4" />
              Save Config
            </button>
          </div>
          <textarea
            className="textarea textarea-bordered w-full h-24 font-mono text-sm"
            placeholder="Enter custom system prompt that will be used instead of the default..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              id="useAgentsFile"
              checked={useAgentsFile}
              onChange={(e) => setUseAgentsFile(e.target.checked)}
            />
            <label htmlFor="useAgentsFile" className="text-sm">
              Use AGENTS.md content in system prompt
            </label>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File path selector */}
          <div className="px-4 py-2 bg-base-100 border-b border-base-300 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 opacity-50" />
            <span className="text-sm">File:</span>
            <input
              type="text"
              className="input input-sm input-bordered flex-1 max-w-xs"
              value={agentsPath}
              onChange={(e) => setAgentsPath(e.target.value)}
              placeholder="AGENTS.md"
            />
            <button
              className="btn btn-sm btn-ghost"
              onClick={loadAgentsFile}
              title="Reload file"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-hidden p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : error ? (
              <div role="alert" className="alert alert-error">{error}</div>
            ) : (
              <textarea
                className="textarea textarea-bordered w-full h-full font-mono text-sm resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={getDefaultAgentsTemplate()}
              />
            )}
          </div>

          {/* Actions bar */}
          <div className="px-4 py-2 bg-base-200 border-t border-base-300 flex items-center justify-between">
            <div className="text-xs opacity-50">
              Protocol: <a href="https://agents.md/" target="_blank" rel="noopener" className="link">agents.md</a>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleReset}
                title="Reset to default template"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save AGENTS.md
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error toasts */}
      {success && (
        <div className="toast toast-end">
          <div className="alert alert-success">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultAgentsTemplate(): string {
  return `# AGENTS.md - Project Instructions

This file contains instructions for AI agents working on this project.

## Project Overview

Brief description of what this project does.

## Setup Commands

- Install dependencies: \`npm install\`
- Start development: \`npm run dev\`
- Build: \`npm run build\`

## Code Style

- Use TypeScript strict mode
- Prefer functional patterns
- Keep components small and focused

## Testing

- Run tests: \`npm test\`
- Add tests for new features

## Guidelines

- Be concise and direct
- Use tools proactively
- Update this file when project conventions change
`;
}
