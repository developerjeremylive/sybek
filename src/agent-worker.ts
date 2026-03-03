// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_GROUP_ID, DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint for AI chat - use Cloudflare Worker proxy
const CHAT_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/api/ai';

const OPFS_ROOT = 'openbrowserclaw';

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'invoke':
      await handleInvoke(payload as InvokePayload);
      break;
    case 'compact':
      await handleCompact(payload as CompactPayload);
      break;
    case 'cancel':
      break;
  }
};

// ---------------------------------------------------------------------------
// Tool definitions for the AI
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'read_file',
    description: 'Read content from a file in the workspace',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file', 
    description: 'Write content to a file in the workspace. Creates or overwrites.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (empty for root)' }
      }
    }
  }
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function executeTool(name: string, input: any, groupId: string): Promise<string> {
  try {
    switch (name) {
      case 'read_file': {
        const content = await readGroupFile(groupId, input.path);
        return `File ${input.path}:\n${content}`;
      }
      case 'write_file': {
        await writeGroupFile(groupId, input.path, input.content);
        return `File saved: ${input.path}`;
      }
      case 'list_files': {
        const files = await listGroupFiles(groupId, input.path || '.');
        return `Files in ${input.path || '/'}: ${files.join(', ')}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ---------------------------------------------------------------------------
// OPFS helpers
// ---------------------------------------------------------------------------

// Store current session folder - persists across messages in same conversation
let currentSessionFolder = '';
let isNewConversation = true;

// Generate a unique session folder based on timestamp
function getSessionFolder(): string {
  if (!currentSessionFolder) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    currentSessionFolder = `chat-${dateStr}-${timeStr}`;
  }
  return currentSessionFolder;
}

// Get context about existing files in the session folder
async function getSessionFolderContext(groupId: string): Promise<string> {
  if (!currentSessionFolder) return '';
  
  try {
    const files = await listGroupFiles(groupId, currentSessionFolder);
    if (files.length === 0) return '';
    
    let context = `\n\n## Archivos existentes en este proyecto:\n`;
    for (const file of files) {
      if (!file.endsWith('/')) {
        const content = await readGroupFile(groupId, `${currentSessionFolder}/${file}`);
        context += `\n### ${file}\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\`\n`;
      }
    }
    return context;
  } catch (e) {
    return '';
  }
}

// Auto-save code files from AI response
async function autoSaveCodeFiles(groupId: string, content: string): Promise<string[]> {
  const savedFiles: string[] = [];
  const sessionFolder = getSessionFolder();
  
  // Patterns to detect code that should be saved
  const patterns = [
    { regex: /<!DOCTYPE html>[\s\S]*?<\/html>/gi, ext: 'html', name: 'index.html' },
    { regex: /<html[\s\S]*?<\/html>/gi, ext: 'html', name: 'index.html' },
    { regex: /<style>[\s\S]*?<\/style>/gi, ext: 'css', name: 'styles.css' },
    { regex: /<script>[\s\S]*?<\/script>/gi, ext: 'js', name: 'script.js' },
  ];
  
  // Also check for marked code blocks
  const codeBlockRegex = /```(?:html|css|javascript|js)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code.length < 50) continue; // Skip too short blocks
    
    // Determine file type from content
    let fileName = 'code.txt';
    if (code.includes('<html') || code.includes('<!DOCTYPE')) fileName = 'index.html';
    else if (code.includes('<style') || (code.includes('{') && code.includes(';') && !code.includes('function'))) fileName = 'styles.css';
    else if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>')) fileName = 'script.js';
    else if (code.includes('import ') || code.includes('export ')) fileName = 'module.js';
    
    try {
      const filePath = `${sessionFolder}/${fileName}`;
      await writeGroupFile(groupId, filePath, code);
      savedFiles.push(filePath);
      log(groupId, 'file-saved', 'Auto-saved', filePath);
    } catch (e) {
      log(groupId, 'file-error', 'Failed to save', fileName);
    }
  }
  
  // Check for inline HTML/CSS/JS
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const code of matches) {
        const cleanCode = code.replace(/<\/?(style|script)[^>]*>/gi, '');
        if (cleanCode.length < 50) continue;
        
        try {
          const filePath = `${sessionFolder}/${pattern.name}`;
          await writeGroupFile(groupId, filePath, cleanCode);
          if (!savedFiles.includes(filePath)) {
            savedFiles.push(filePath);
            log(groupId, 'file-saved', 'Auto-saved', filePath);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }
  
  return savedFiles;
}

async function getGroupDir(groupId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const safeId = groupId.replace(/:/g, '-');
  
  let current = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  current = await current.getDirectoryHandle('groups', { create: true });
  current = await current.getDirectoryHandle(safeId, { create: true });
  // Files directly in group folder, not in workspace subfolder
  return current;
}

function parsePath(filePath: string): { dirs: string[]; filename: string } {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('Empty file path');
  const filename = parts.pop()!;
  return { dirs: parts, filename };
}

async function readGroupFile(groupId: string, filePath: string): Promise<string> {
  const dir = await getGroupDir(groupId);
  const { dirs, filename } = parsePath(filePath);
  
  let current = dir;
  for (const seg of dirs) {
    current = await current.getDirectoryHandle(seg);
  }
  
  const fileHandle = await current.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
}

async function writeGroupFile(groupId: string, filePath: string, content: string): Promise<void> {
  const dir = await getGroupDir(groupId);
  const { dirs, filename } = parsePath(filePath);
  
  let current = dir;
  for (const seg of dirs) {
    current = await current.getDirectoryHandle(seg, { create: true });
  }
  
  const fileHandle = await current.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function listGroupFiles(groupId: string, dirPath: string = '.'): Promise<string[]> {
  const dir = await getGroupDir(groupId);
  
  let current = dir;
  if (dirPath && dirPath !== '.') {
    const parts = dirPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean);
    for (const seg of parts) {
      current = await current.getDirectoryHandle(seg);
    }
  }
  
  const entries: string[] = [];
  for await (const [name, handle] of current.entries()) {
    entries.push(handle.kind === 'directory' ? `${name}/` : name);
  }
  return entries.sort();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId = DEFAULT_GROUP_ID, messages, systemPrompt, model = DEFAULT_MODEL, maxTokens = 4096 } = payload;

  // Only reset session folder for truly new conversations
  if (isNewConversation) {
    currentSessionFolder = '';
    getSessionFolder(); // Generate new folder
    isNewConversation = false;
  }

  // Get existing files context for this session
  const folderContext = await getSessionFolderContext(groupId);
  
  // Append folder context to system prompt
  const fullSystemPrompt = systemPrompt + folderContext;

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model}, Session: ${currentSessionFolder}, Files: ${folderContext ? 'yes' : 'no'}`);

  try {
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      // Build messages with tools
      const chatMessages = [
        { role: 'system', content: fullSystemPrompt },
        ...currentMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
      ];

      const requestBody: any = {
        messages: chatMessages,
        model,
        max_tokens: maxTokens,
      };

      // Note: Workers AI doesn't support tools in the same way as Anthropic
      // Tools are handled separately
      // if (iterations === 1) {
      //   requestBody.tools = TOOLS;
      // }

      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`API error ${res.status}: ${errBody}`);
      }

      const result = await res.json();
      
      // Try multiple response formats (Workers AI returns different format)
      let responseContent = '';
      if (result.response) {
        // Anthropic-style or custom format
        responseContent = typeof result.response === 'string' ? result.response : JSON.stringify(result.response);
      } else if (result.result && result.result.response) {
        // Workers AI format
        responseContent = typeof result.result.response === 'string' ? result.result.response : JSON.stringify(result.result.response);
      } else if (result.messages && result.messages.length > 0) {
        // Array of messages
        responseContent = result.messages.map((m: any) => m.content || m.response || '').join('');
      } else if (result.choices && result.choices.length > 0) {
        // OpenAI-style
        responseContent = result.choices[0].message?.content || '';
      } else if (typeof result === 'string') {
        responseContent = result;
      } else {
        // Fallback: stringify everything
        responseContent = JSON.stringify(result);
      }
      
      log(groupId, 'text', 'Response', responseContent.slice(0, 200));

      // AUTO-SAVE FILES: Extract code blocks and save them automatically
      const savedFiles = await autoSaveCodeFiles(groupId, responseContent);
      if (savedFiles.length > 0) {
        responseContent += '\n\n📁 Archivos guardados en Files:\n' + savedFiles.map(f => `- ${f}`).join('\n');
      }

      // Check for tool calls - try multiple formats
      let toolCalls: any[] = [];
      
      if (result.tool_calls && Array.isArray(result.tool_calls)) {
        toolCalls = result.tool_calls;
      } else if (result.tools && Array.isArray(result.tools)) {
        toolCalls = result.tools;
      }
      
      // Also check for tool calls in response content (some APIs return them as text)
      const toolCallMatch = responseContent.match(/<tool_call>(.*?)<\/tool_call>/);
      if (toolCallMatch) {
        try {
          toolCalls = JSON.parse(toolCallMatch[1]);
        } catch {}
      }

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          let toolName = '';
          let toolInput: Record<string, any> = {};
          
          // Handle different tool call formats
          if (typeof toolCall === 'string') {
            toolName = toolCall;
          } else if (toolCall && typeof toolCall === 'object') {
            toolName = (toolCall as any).name || (toolCall as any).tool || '';
            toolInput = (toolCall as any).input || {};
          }
          
          if (!toolName) continue;
          
          log(groupId, 'tool-call', `Tool: ${toolName}`, JSON.stringify(toolInput).slice(0, 100));
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

          // Execute tool
          const toolResult = await executeTool(toolName, toolInput, groupId);
          
          log(groupId, 'tool-result', `Result: ${toolName}`, toolResult.slice(0, 200));
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

          currentMessages.push({ role: 'assistant', content: responseContent });
          currentMessages.push({ role: 'user', content: `Tool ${toolName} result: ${toolResult}` });
        }
        
        post({ type: 'typing', payload: { groupId } });
      } else {
        // Final response - no tools
        const cleaned = responseContent.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
        post({ type: 'response', payload: { groupId, text: cleaned || '(no response)' } });
        return;
      }
    }

    post({ type: 'response', payload: { groupId, text: '(max iterations reached)' } });
  } catch (err) {
    console.error('[agent-worker] Error:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    post({ type: 'error', payload: { groupId, error: errorMsg } });
  }
}

async function handleCompact(payload: CompactPayload): Promise<void> {
  const { groupId } = payload;
  post({ type: 'compact-done', payload: { groupId, summary: 'Compacted' } });
}

function post(msg: WorkerOutbound): void {
  self.postMessage(msg);
}

function log(groupId: string, kind: 'api-call' | 'tool-call' | 'tool-result' | 'text' | 'info' | 'file-saved' | 'file-error', label: string, detail: string): void {
  const entry = { groupId, id: ulid(), timestamp: Date.now(), kind, label, detail };
  post({ type: 'thinking-log', payload: entry });
}
