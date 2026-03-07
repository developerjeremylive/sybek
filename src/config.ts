// ---------------------------------------------------------------------------
// OpenBrowserClaw — Configuration constants
// ---------------------------------------------------------------------------

/** Default assistant name (used in trigger pattern) */
export const ASSISTANT_NAME = 'Andy';

/** Trigger pattern — messages must match this to invoke the agent */
export function buildTriggerPattern(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)@${escaped}\\b`, 'i');
}

export const TRIGGER_PATTERN = buildTriggerPattern(ASSISTANT_NAME);

/** How many recent messages to include in agent context */
export const CONTEXT_WINDOW_SIZE = 50;

/** Max tokens for AI response */
export const DEFAULT_MAX_TOKENS = 4096;

/** Default model - using Workers AI with function calling */
export const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

/** Available models with function calling support */
export const MODELS = [
  // Meta (Llama)
  { value: '@cf/meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { value: '@cf/meta/llama-3-8b-instruct', label: 'Llama 3 8B' },
  { value: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', label: 'Llama 3.3 70B' },
  { value: 'llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B', premium: true },
  // Google (Gemma)
  { value: '@cf/google/gemma-2-2b', label: 'Gemma 2 2B' },
  { value: '@cf/google/gemma-3-12b-it', label: 'Gemma 3 12B' },
  // GLAB (GLM)
  { value: 'glm-4.7-flash', label: 'GLM-4.7 Flash', premium: true },
  // HuggingFace (Hermes)
  { value: 'hermes-2-pro-mistral-7b', label: 'Hermes 2 Pro Mistral 7B', premium: true },
  // Qwen
  { value: 'qwen3-30b-a3b-fp8', label: 'Qwen 3 30B A3B', premium: true },
  // Mistral
  { value: 'mistral-small-3.1-24b-instruct', label: 'Mistral Small 3.1 24B', premium: true },
];

/** Anthropic API endpoint */
export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/** Anthropic API version header */
export const ANTHROPIC_API_VERSION = '2023-06-01';

/** Telegram Bot API base URL */
export const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/** Telegram message length limit */
export const TELEGRAM_MAX_LENGTH = 4096;

/** Telegram long-poll timeout in seconds */
export const TELEGRAM_POLL_TIMEOUT = 30;

/** Task scheduler check interval (ms) */
export const SCHEDULER_INTERVAL = 60_000;

/** Message processing loop interval (ms) */
export const PROCESS_LOOP_INTERVAL = 100;

/** Fetch tool response truncation limit */
export const FETCH_MAX_RESPONSE = 20_000;

/** IndexedDB database name */
export const DB_NAME = 'openbrowserclaw';

/** IndexedDB version */
export const DB_VERSION = 1;

/** OPFS root directory name */
export const OPFS_ROOT = 'openbrowserclaw';

/** Default group for browser chat */
export const DEFAULT_GROUP_ID = 'br:main';

/** Config keys */
export const CONFIG_KEYS = {
  ANTHROPIC_API_KEY: 'anthropic_api_key',
  TELEGRAM_BOT_TOKEN: 'telegram_bot_token',
  TELEGRAM_CHAT_IDS: 'telegram_chat_ids',
  TRIGGER_PATTERN: 'trigger_pattern',
  MODEL: 'model',
  MAX_TOKENS: 'max_tokens',
  PASSPHRASE_SALT: 'passphrase_salt',
  PASSPHRASE_VERIFY: 'passphrase_verify',
  ASSISTANT_NAME: 'assistant_name',
  SYSTEM_PROMPT: 'system_prompt',
  AGENTS_FILE_PATH: 'agents_file_path',
  USE_AGENTS_FILE: 'use_agents_file',
} as const;
