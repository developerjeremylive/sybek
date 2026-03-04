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

// Store current session folder - persists in localStorage
let currentSessionFolder = '';

// Load session folder from localStorage (will be set from main thread)
export function setSessionFolder(folder: string): void {
  currentSessionFolder = folder;
}

// Load context folders from localStorage (will be set from main thread)
let contextFolders: string[] = [];

export function setContextFolders(folders: string[]): void {
  contextFolders = folders;
}

// Generate a unique session folder based on timestamp
function getSessionFolder(): string {
  if (!currentSessionFolder) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    currentSessionFolder = `chat-${dateStr}-${timeStr}`;
  }
  return currentSessionFolder;
}

async function getGroupDir(groupId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const safeId = groupId.replace(/:/g, '-');
  
  let current = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  current = await current.getDirectoryHandle('groups', { create: true });
  current = await current.getDirectoryHandle(safeId, { create: true });
  return current;
}

function parsePath(filePath: string): { dirs: string[]; filename: string } {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('Empty file path');
  const filename = parts.pop()!;
  return { dirs: parts, filename };
}

function getToolDescription(toolId: string): string {
  const TOOL_DESCRIPTIONS: Record<string, string> = {
    'get_current_time': 'Get the current date and time',
    'get_weather': 'Get weather for a city - accepts {city: "CityName"}',
    'hackernews': 'Get top stories from Hacker News',
    'joke': 'Get a random joke',
    'cat_fact': 'Get a random cat fact',
    'web_search': 'Search the web - accepts {query: "search term"}',
    'fetch_url': 'Fetch content from a URL - native Workers AI tool',
    'browser': 'Browser automation - native Workers AI tool',
  };
  return TOOL_DESCRIPTIONS[toolId] || 'Tool description';
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
// Auto-save: Extract code from LLM response and save to files
// ---------------------------------------------------------------------------

async function autoSaveCodeFiles(groupId: string, aiResponse: string): Promise<string[]> {
  const savedFiles: string[] = [];
  const content = aiResponse;
  
  // Use context folders if available, otherwise use session folder
  let targetFolders = [...contextFolders];
  if (currentSessionFolder && !targetFolders.includes(currentSessionFolder)) {
    targetFolders = [currentSessionFolder, ...targetFolders];
  }
  
  if (targetFolders.length === 0) {
    targetFolders = [getSessionFolder()];
  }
  
  const targetFolder = targetFolders[0];
  
  // Check what files already exist
  let existingFiles: string[] = [];
  try {
    existingFiles = await listGroupFiles(groupId, targetFolder);
  } catch {}
  
  // Extract code blocks from response
  const codeBlockRegex = /```(?:html|css|javascript|js|typescript)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code.length < 30) continue;
    
    // Determine file type
    let fileName = 'code.txt';
    if (code.includes('<!DOCTYPE html') || code.includes('<html') || code.includes('<header') || code.includes('<body') || code.includes('<footer') || code.includes('<section')) {
      fileName = 'index.html';
    } else if (code.includes('{') && code.includes(';') && (code.includes('color:') || code.includes('margin:') || code.includes('padding:') || code.includes('display:') || code.includes('@media')) ) {
      fileName = 'styles.css';
    } else if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>') || code.includes('document.') || code.includes('window.')) {
      fileName = 'script.js';
    }
    
    try {
      const filePath = `${targetFolder}/${fileName}`;
      await writeGroupFile(groupId, filePath, code);
      savedFiles.push(filePath);
      log(groupId, 'file-saved', 'Saved', filePath);
    } catch (e) {
      log(groupId, 'file-error', 'Failed to save', fileName);
    }
  }
  
  // Also check for inline HTML/CSS/JS
  const htmlRegex = /<!DOCTYPE html>[\s\S]*?<\/html>/gi;
  const htmlMatches = content.match(htmlRegex) || [];
  
  for (const html of htmlMatches) {
    if (html.length < 100) continue;
    try {
      const filePath = `${targetFolder}/index.html`;
      await writeGroupFile(groupId, filePath, html);
      if (!savedFiles.includes(filePath)) {
        savedFiles.push(filePath);
        log(groupId, 'file-saved', 'Saved HTML', filePath);
      }
    } catch {}
  }
  
  return savedFiles;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId = DEFAULT_GROUP_ID, messages, systemPrompt, model = DEFAULT_MODEL, maxTokens = 4096, sessionFolder, contextFolders, fileContext, tools } = payload;

  // Use first context folder as working folder if available, otherwise use sessionFolder
  if (contextFolders && contextFolders.length > 0) {
    currentSessionFolder = contextFolders[0];
  } else if (sessionFolder) {
    currentSessionFolder = sessionFolder;
  } else if (!currentSessionFolder) {
    getSessionFolder();
  }
  
  // Set context folders from payload
  if (contextFolders) {
    setContextFolders(contextFolders);
  }

  // Use fileContext from payload if available
  const folderContext = fileContext || '';
  
  // Add context to system prompt
  const fullSystemPrompt = folderContext 
    ? systemPrompt + '\n\n## Archivos existentes:\n' + folderContext
    : systemPrompt;

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model}, Folder: ${currentSessionFolder}`);

  try {
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      const chatMessages = [
        { role: 'system', content: fullSystemPrompt },
        ...currentMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
      ];

      const requestBody: any = {
        messages: chatMessages,
        model,
        max_tokens: maxTokens,
      };

      // Add tools if provided - Workers AI expects {id, desc}
      const activeTools = tools || [];
      if (activeTools.length > 0) {
        requestBody.tools = activeTools.map((id: string) => ({
          id,
          desc: getToolDescription(id),
        }));
      }

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
      
      let responseContent = '';
      let toolCalls: any[] = [];
      
      // Handle Workers AI response format with tool_calls
      if (result.response !== undefined && result.response !== null) {
        responseContent = typeof result.response === 'string' ? result.response : JSON.stringify(result.response);
        // Check for tool_calls in response
        if (result.response.tool_calls) {
          toolCalls = result.response.tool_calls;
        }
      } else if (result.result !== undefined && result.result !== null) {
        if (result.result.response) {
          responseContent = typeof result.result.response === 'string' ? result.result.response : JSON.stringify(result.result.response);
        }
        if (result.result.tool_calls) {
          toolCalls = result.result.tool_calls;
        }
      } else if (result.messages && result.messages.length > 0) {
        responseContent = result.messages.map((m: any) => m.content || m.response || '').join('');
      } else if (result.choices && result.choices.length > 0) {
        responseContent = result.choices[0].message?.content || '';
        if (result.choices[0].message?.tool_calls) {
          toolCalls = result.choices[0].message.tool_calls;
        }
      } else if (typeof result === 'string') {
        responseContent = result;
      } else {
        // Only stringify if there's no response at all
        const str = JSON.stringify(result);
        // Don't show raw JSON if it contains tool_calls
        if (str.includes('tool_calls')) {
          responseContent = '';
        } else {
          responseContent = str;
        }
      }
      
      log(groupId, 'text', 'Response', responseContent.slice(0, 200));

      // Auto-save code files from response
      const savedFiles = await autoSaveCodeFiles(groupId, responseContent);
      
      // Generate response - show LLM response AND saved files
      let finalText = responseContent;
      if (savedFiles.length > 0) {
        finalText = responseContent + '\n\n✅ Archivos guardados:\n' + savedFiles.map(f => `- ${f.split('/').pop()}`).join('\n');
      } else {
        // Remove code blocks from display
        finalText = responseContent.replace(/```[\s\S]*?```/g, '').trim();
      }

      // Already extracted toolCalls above
      log(groupId, 'info', 'Tool calls found', `${toolCalls.length}`);

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          let toolName = '';
          let toolInput: Record<string, any> = {};
          
          if (typeof toolCall === 'string') {
            toolName = toolCall;
          } else if (toolCall && typeof toolCall === 'object') {
            // Handle both {name, arguments} and {function: {name, arguments}} formats
            const tc = toolCall as any;
            toolName = tc.name || tc.function?.name || '';
            const args = tc.arguments || tc.function?.arguments || {};
            // Parse arguments if they're a string
            if (typeof args === 'string') {
              try {
                toolInput = JSON.parse(args);
              } catch {
                toolInput = {};
              }
            } else {
              toolInput = args;
            }
          }
          
          if (!toolName) continue;
          
          log(groupId, 'tool-call', `Tool: ${toolName}`, JSON.stringify(toolInput).slice(0, 100));
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

          const toolResult = await executeTool(toolName, toolInput, groupId);
          
          log(groupId, 'tool-result', `Result: ${toolName}`, toolResult.slice(0, 200));
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

          currentMessages.push({ role: 'assistant', content: responseContent });
          currentMessages.push({ role: 'user', content: `Tool result: ${toolResult}` });
        }
        
        // Make another API call with tool results to get final response
        post({ type: 'typing', payload: { groupId } });
        
        const finalRequestBody = {
          messages: currentMessages,
          model,
          max_tokens: maxTokens,
        };
        
        const finalRes = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalRequestBody),
        });
        
        const finalResult = await finalRes.json();
        log(groupId, 'info', 'Final API result', JSON.stringify(finalResult).slice(0, 200));
        let finalResponseContent = '';
        
        if (finalResult.response) {
          finalResponseContent = typeof finalResult.response === 'string' ? finalResult.response : JSON.stringify(finalResult.response);
        } else if (finalResult.result?.response) {
          finalResponseContent = typeof finalResult.result.response === 'string' ? finalResult.result.response : JSON.stringify(finalResult.result.response);
        } else {
          finalResponseContent = JSON.stringify(finalResult).slice(0, 500);
        }
        
        const cleaned = finalResponseContent.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
        post({ type: 'response', payload: { groupId, text: cleaned || '(sin respuesta)' }});
        return;
      } else {
        // Final response
        const cleaned = finalText.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
        post({ type: 'response', payload: { groupId, text: cleaned || '(sin respuesta)' } });
        return;
      }
    }

    post({ type: 'response', payload: { groupId, text: '(máximo de iteraciones alcanzado)' } });
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
