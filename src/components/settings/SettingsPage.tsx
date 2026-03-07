// ---------------------------------------------------------------------------
// OpenBrowserClaw — Settings page
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import {
  Palette, KeyRound, Eye, EyeOff, Bot, MessageSquare,
  Smartphone, HardDrive, Lock, Check,
} from 'lucide-react';
import { getConfig, setConfig } from '../../db.js';
import { CONFIG_KEYS, MODELS } from '../../config.js';
import { getStorageEstimate, requestPersistentStorage } from '../../storage.js';
import { decryptValue } from '../../crypto.js';
import { getOrchestrator } from '../../stores/orchestrator-store.js';
import { useThemeStore, type ThemeChoice } from '../../stores/theme-store.js';
import { ModelSelector } from '../chat/ChatInput.js';


function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function SettingsPage() {
  const orch = getOrchestrator();

  // API Key
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState(true);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showV2Notification, setShowV2Notification] = useState(false);

  // Model
  const [model, setModel] = useState(orch.getModel());

  // Assistant name
  const [assistantName, setAssistantName] = useState(orch.getAssistantName());

  // Telegram
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatIds, setTelegramChatIds] = useState('');
  const [telegramSaved, setTelegramSaved] = useState(false);

  // Storage
  const [storageUsage, setStorageUsage] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [isPersistent, setIsPersistent] = useState(false);

  // Theme
  const { theme, setTheme } = useThemeStore();

  // Load current values
  useEffect(() => {
    async function load() {
      // API key
      const encKey = await getConfig(CONFIG_KEYS.ANTHROPIC_API_KEY);
      if (encKey) {
        try {
          const dec = await decryptValue(encKey);
          setApiKey(dec);
        } catch {
          setApiKey('');
        }
      }

      // Telegram
      const token = await getConfig(CONFIG_KEYS.TELEGRAM_BOT_TOKEN);
      if (token) setTelegramToken(token);
      const chatIds = await getConfig(CONFIG_KEYS.TELEGRAM_CHAT_IDS);
      if (chatIds) {
        try {
          setTelegramChatIds(JSON.parse(chatIds).join(', '));
        } catch {
          setTelegramChatIds(chatIds);
        }
      }

      // Storage
      const est = await getStorageEstimate();
      setStorageUsage(est.usage);
      setStorageQuota(est.quota);
      if (navigator.storage?.persisted) {
        setIsPersistent(await navigator.storage.persisted());
      }
    }
    load();
  }, []);

  async function handleSaveApiKey() {
    // Show V2 notification - API key feature coming in v2
    setShowV2Notification(true);
    setTimeout(() => setShowV2Notification(false), 3000);
    // Note: API key is optional now, so we don't actually save it
    // setApiKeySaved(true);
    // setTimeout(() => setApiKeySaved(false), 2000);
  }

  async function handleModelChange(value: string) {
    setModel(value);
    await orch.setModel(value);
  }

  async function handleNameSave() {
    await orch.setAssistantName(assistantName.trim());
  }

  async function handleTelegramSave() {
    const ids = telegramChatIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await orch.configureTelegram(telegramToken.trim(), ids);
    setTelegramSaved(true);
    setTimeout(() => setTelegramSaved(false), 2000);
  }

  async function handleRequestPersistent() {
    const granted = await requestPersistentStorage();
    setIsPersistent(granted);
  }

  const storagePercent = storageQuota > 0 ? (storageUsage / storageQuota) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto p-2 sm:p-4 max-w-2xl mx-auto space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Configuración</h2>
          <p className="text-xs sm:text-sm opacity-50">Personaliza tu experiencia</p>
        </div>
      </div>

      {/* Section: Apariencia */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
          <Palette className="w-3 h-3" /> Apariencia
        </h3>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-sm">Tema</span>
              <select
                className="select select-bordered select-sm w-28"
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeChoice)}
              >
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Section: Modelo */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
          <Bot className="w-3 h-3" /> Modelo de IA
        </h3>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <ModelSelector />
          </div>
        </div>
      </section>

      {/* Section: Asistente */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
          <MessageSquare className="w-3 h-3" /> Asistente
        </h3>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                placeholder="Sybek"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNameSave}
                disabled={!assistantName.trim()}
              >
                Guardar
              </button>
            </div>
            <p className="text-xs opacity-40">
              Menciona @{assistantName} para activar una respuesta
            </p>
          </div>
        </div>
      </section>

      {/* Section: API Keys */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
          <KeyRound className="w-3 h-3" /> API Keys
        </h3>
        
        {/* Anthropic API */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Anthropic API</span>
                <span className="badge badge-outline badge-xs">Opcional</span>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setApiKeyMasked(!apiKeyMasked)}
              >
                {apiKeyMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <input
              type={apiKeyMasked ? 'password' : 'text'}
              className="input input-bordered input-sm w-full font-mono text-xs"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-40">
                Se encripta y guarda localmente
              </p>
              <div className="flex items-center gap-2">
                {apiKeySaved && (
                  <span className="text-success text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Guardado
                  </span>
                )}
                <button
                  className="btn btn-primary btn-xs"
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim()}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Telegram Bot</span>
            </div>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Bot Token</span>
              <input
                type="password"
                className="input input-bordered input-sm w-full font-mono text-xs"
                placeholder="123456:ABC-DEF..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Chat IDs</span>
              <input
                type="text"
                className="input input-bordered input-sm w-full font-mono text-xs"
                placeholder="-100123456, 789012"
                value={telegramChatIds}
                onChange={(e) => setTelegramChatIds(e.target.value)}
              />
              <span className="label-text-alt opacity-40">Separados por coma</span>
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              {telegramSaved && (
                <span className="text-success text-xs flex items-center gap-1">
                  <Check className="w-3 h-3" /> Guardado
                </span>
              )}
              <button
                className="btn btn-primary btn-xs"
                onClick={handleTelegramSave}
                disabled={!telegramToken.trim()}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Almacenamiento */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 px-1 flex items-center gap-2">
          <HardDrive className="w-3 h-3" /> Almacenamiento
        </h3>
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4 gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Uso</span>
              <span className="opacity-60">{formatBytes(storageUsage)} / {formatBytes(storageQuota)}</span>
            </div>
            <progress
              className="progress progress-primary h-2"
              value={storagePercent}
              max={100}
            />
            <div className="flex items-center justify-between pt-2">
              {isPersistent ? (
                <div className="badge badge-success gap-1.5 text-xs">
                  <Lock className="w-3 h-3" /> Persistente activo
                </div>
              ) : (
                <button
                  className="btn btn-outline btn-xs"
                  onClick={handleRequestPersistent}
                >
                  <Lock className="w-3 h-3" /> Solicitar persistente
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
