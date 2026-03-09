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
  },
  {
    name: 'fetch_url',
    description: 'Fetch content from a URL via HTTP. Use for getting web page content.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        method: { type: 'string', description: 'HTTP method (GET, POST, etc.)' }
      },
      required: ['url']
    }
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'duckduckgo',
    description: 'Search DuckDuckGo for web results - use this for web searches',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_weather',
    description: 'Get weather information for a city',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' }
      },
      required: ['city']
    }
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time',
    input_schema: {
      type: 'object',
      properties: {
        timezone: { type: 'string', description: 'Timezone (e.g., UTC, America/New_York)' }
      }
    }
  },
  {
    name: 'joke',
    description: 'Get a random joke',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'cat_fact',
    description: 'Get a random cat fact',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'hackernews',
    description: 'Get top stories from Hacker News',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of stories (default 10)' }
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
        log(groupId, 'file-saved', 'Archivo guardado', input.path);
        return `File saved: ${input.path}`;
      }
      case 'list_files': {
        const files = await listGroupFiles(groupId, input.path || '.');
        return `Files in ${input.path || '/'}: ${files.join(', ')}`;
      }
      // MCP Tools - call the proxy API
      case 'hackernews': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'hackernews', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'get_weather': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'get_weather', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'joke': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'joke', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'cat_fact': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'cat_fact', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'get_current_time': {
        // Get current time directly - no external API needed
        const timezone = input?.timezone || 'UTC';
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          timeZoneName: 'short',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return JSON.stringify({
          timezone,
          iso: now.toISOString(),
          formatted: formatter.format(now),
          unix: Math.floor(now.getTime() / 1000)
        });
      }
      case 'web_search': {
        // Model may send 'q' but API expects 'query' - normalize it
        const searchQuery = input?.query || input?.q || '';
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'web_search', args: { query: searchQuery } }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'duckduckgo': {
        // Use the new duckduckgo tool
        const searchQuery = input?.query || input?.q || '';
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'duckduckgo', args: { query: searchQuery } }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'reddit': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'reddit', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'dog_fact': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'dog_fact', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'quote': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'quote', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'wikipedia': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'wikipedia', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'word_of_day': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'word_of_day', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'define_word': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'define_word', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'convert_currency': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'convert_currency', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'get_ip': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'get_ip', args: {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
      }
      case 'fetch_url': {
        const res = await fetch('https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'fetch_url', args: input || {} }),
        });
        const data = await res.json();
        return JSON.stringify(data);
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
    // Time & Weather
    'get_current_time': 'Get the current date and time',
    'get_weather': 'Get weather for a city - accepts {city: "CityName"}',
    // News & Tech
    'hackernews': 'Get top stories from Hacker News',
    'reddit': 'Get top posts from a subreddit - accepts {subreddit: "technology"}',
    // Fun
    'joke': 'Get a random joke',
    'cat_fact': 'Get a random cat fact',
    'dog_fact': 'Get a random dog fact',
    'quote': 'Get an inspirational quote',
    // Knowledge
    'wikipedia': 'Search Wikipedia - accepts {query: "search term"}',
    'word_of_day': 'Get the Word of the Day',
    'define_word': 'Define a word - accepts {word: "example"}',
    // Utilities
    'web_search': 'Search the web - accepts {query: "search term"}',
    'convert_currency': 'Convert currency - accepts {from: "USD", to: "EUR", amount: 100}',
    'get_ip': 'Get your current IP address',
    // Native
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

// MCP Tool type
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
  serverName: string;
}

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId = DEFAULT_GROUP_ID, messages, systemPrompt, model = DEFAULT_MODEL, maxTokens = 4096, sessionFolder, contextFolders, fileContext, tools, mcpTools, mcpServers = [] } = payload;

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
  
  // Get active tools from payload
  const activeTools = tools || [];
  const activeMcpTools: MCPTool[] = mcpTools || [];
  
  // Build tools description for system prompt
  let toolsSection = '';
  if (activeTools.length > 0 || activeMcpTools.length > 0) {
    const toolDescriptions: string[] = [];
    
    // Native tools - these are built-in and work directly, NO need for MCP format!
    if (activeTools.length > 0) {
      toolDescriptions.push('\n### Herramientas NATIVAS (disponibles inmediatamente - NO uses formato MCP):');
      activeTools.forEach((id: string) => {
        const tool = TOOLS.find(t => t.name === id);
        if (!tool) return;
        const params = Object.entries(tool.input_schema.properties || {})
          .map(([k, v]) => `${k}: ${(v as any).description || k}`)
          .join(', ');
        toolDescriptions.push(`- ${tool.name}(${params}): ${tool.description} [NATIVO]`);
      });
      toolDescriptions.push('\n**IMPORTANTE - Herramientas NATIVAS:** Usa este formato EXACTO:\n[herramienta] nombre | {"param": "valor"} [/herramienta]\nEjemplos:\n- [herramienta] get_current_time | {"timezone": "America/Mexico_City"} [/herramienta]\n- [herramienta] get_weather | {"city": "Leon"} [/herramienta]\n- [herramienta] hackernews | {"limit": 5} [/herramienta]');
    }
    
    // MCP tools - only use if servers are actually running and accessible
    if (activeMcpTools.length > 0) {
      toolDescriptions.push('\n### Herramientas MCP EXTERNAS (solo si el servidor está corriendo y accesible):');
      activeMcpTools.forEach((tool) => {
        const params = Object.entries(tool.inputSchema?.properties || {})
          .map(([k, v]) => `${k}: ${(v as any).description || k}`)
          .join(', ');
        toolDescriptions.push(`- ${tool.name}(${params}): ${tool.description} [MCP: ${tool.serverName}]`);
      });
      toolDescriptions.push('\n**Cómo usar herramientas MCP (solo si el servidor está corriendo):**\nUsa: [mcp] servidor | herramienta | {"param": "valor"} [/mcp]');
    }
    
    toolsSection = `\n\n## Herramientas disponibles:\n${toolDescriptions.join('\n')}`;
  }
  
  const fullSystemPrompt = folderContext 
    ? systemPrompt + '\n\n## Archivos existentes:\n' + folderContext + toolsSection
    : systemPrompt + toolsSection;

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
      
      // Debug: log full API response
      log(groupId, 'info', 'API response', JSON.stringify(result).slice(0, 500));
      
      let responseContent = '';
      let toolCalls: any[] = [];
      
      // Handle Workers AI response format with tool_calls
      // Check for tool_calls at top level first (but only if it has items)
      if (result.tool_calls && Array.isArray(result.tool_calls) && result.tool_calls.length > 0) {
        toolCalls = result.tool_calls;
        responseContent = '';
      } else if (result.response !== undefined && result.response !== null) {
        responseContent = typeof result.response === 'string' ? result.response : JSON.stringify(result.response);
        // Check for tool_calls in response
        if (result.response?.tool_calls) {
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
      
      // Send API response to store for UI display
      post({ type: 'api-response', payload: { groupId, response: responseContent.slice(0, 2000) } });

      // Extract tool calls from text response if none from function calling
      if (toolCalls.length === 0 && activeTools.length > 0) {
        // Try format: [toolname] tool_name | {"args"} [/toolname]
        const toolCallRegex = /\[(\w+)\]\s*(\w+)\s*\|\s*(\{[^}]*\})\s*\[\/\1\]/g;
        let match;
        while ((match = toolCallRegex.exec(responseContent)) !== null) {
          const toolName = match[2];
          const argsStr = match[3];
          try {
            const toolInput = JSON.parse(argsStr);
            toolCalls.push({ name: toolName, arguments: toolInput });
            log(groupId, 'info', 'Extracted tool from text', `${toolName}: ${argsStr}`);
          } catch {
            // Invalid JSON, skip
          }
        }
        // Also try format: [TOOL_CALL] tool_name | {"args"} [/TOOL_CALL]
        if (toolCalls.length === 0) {
          const altRegex = /\[TOOL_CALL\]\s*(\w+)\s*\|\s*(\{[^}]*\})\s*\[\/TOOL_CALL\]/g;
          while ((match = altRegex.exec(responseContent)) !== null) {
            const toolName = match[1];
            const argsStr = match[2];
            try {
              const toolInput = JSON.parse(argsStr);
              toolCalls.push({ name: toolName, arguments: toolInput });
            } catch {}
          }
        }
      }

      // Extract MCP tool calls from text response
      // Format: [mcp] server_name | tool_name | {"args"} [/mcp]
      const mcpToolCalls: Array<{serverName: string, toolName: string, arguments: Record<string, any>}> = [];
      if (activeMcpTools.length > 0) {
        const mcpRegex = /\[mcp\]\s*(\w+)\s*\|\s*(\w+)\s*\|\s*(\{[^}]*\})\s*\[\/mcp\]/g;
        let mcpMatch;
        while ((mcpMatch = mcpRegex.exec(responseContent)) !== null) {
          const serverName = mcpMatch[1];
          const toolName = mcpMatch[2];
          const argsStr = mcpMatch[3];
          try {
            const args = JSON.parse(argsStr);
            mcpToolCalls.push({ serverName, toolName, arguments: args });
            log(groupId, 'info', 'Extracted MCP tool from text', `${serverName}/${toolName}: ${argsStr}`);
          } catch {
            // Invalid JSON, skip
          }
        }
      }

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

      // Only log if there are actual tool calls
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
          post({ type: 'tool-result', payload: { groupId, tool: toolName, result: toolResult } });

          currentMessages.push({ role: 'assistant', content: responseContent });
          currentMessages.push({ role: 'user', content: `Tool result: ${toolResult}` });
        }
        
        // Execute MCP tool calls
        for (const mcpCall of mcpToolCalls) {
          const { serverName, toolName, arguments: mcpArgs } = mcpCall;
          
          log(groupId, 'mcp-tool', `MCP: ${serverName}/${toolName}`, JSON.stringify(mcpArgs).slice(0, 100));
          post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'running' } });

          // Find the server config from mcpServers in payload
          const server = mcpServers.find(s => s.name.toLowerCase() === serverName.toLowerCase());
          
          if (!server) {
            const errorResult = `Error: MCP server "${serverName}" not found. Available: ${mcpServers.map(s => s.name).join(', ')}`;
            log(groupId, 'mcp-tool', `Error: ${serverName}`, errorResult);
            post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
            post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: errorResult } });
            currentMessages.push({ role: 'user', content: `MCP Tool error: ${errorResult}` });
            continue;
          }

          try {
            // Call MCP tool via mcporter API
            const mcpResponse = await fetch('/api/mcporter/call', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                server: serverName,
                tool: toolName,
                args: mcpArgs,
              }),
              signal: AbortSignal.timeout(60000), // Longer timeout for mcporter
            });

            if (!mcpResponse.ok) {
              throw new Error(`HTTP ${mcpResponse.status}: ${mcpResponse.statusText}`);
            }

            const mcpResult = await mcpResponse.json();
            
            if (mcpResult.error) {
              throw new Error(mcpResult.error);
            }

            const resultText = mcpResult.result || JSON.stringify(mcpResult);
            log(groupId, 'mcp-tool', `Result: ${serverName}/${toolName}`, resultText.slice(0, 200));
            post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
            post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: resultText } });
            currentMessages.push({ role: 'user', content: `MCP Tool result (${serverName}/${toolName}): ${resultText}` });
          } catch (mcpError: any) {
            const errorText = `Error calling MCP tool: ${mcpError.message}`;
            log(groupId, 'mcp-tool', `Error: ${serverName}/${toolName}`, errorText);
            post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
            post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: errorText } });
            currentMessages.push({ role: 'user', content: `MCP Tool error: ${errorText}` });
          }
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
        
        let cleaned = finalResponseContent.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
        // If cleaned is empty, try extracting content from inside <internal> tags
        if (!cleaned) {
          const internalMatch = finalResponseContent.match(/<internal>([\s\S]*?)<\/internal>/);
          if (internalMatch && internalMatch[1]) {
            cleaned = internalMatch[1].trim();
          }
        }
        // If still empty, show raw response for debugging
        if (!cleaned) {
          cleaned = finalResponseContent.trim() || '(sin respuesta - response vacía)';
        }
        post({ type: 'response', payload: { groupId, text: cleaned } });
        return;
      } else {
        // Final response - extract content from <internal> tags if response is empty
        let cleaned = finalText.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
        // If cleaned is empty, try extracting content from inside <internal> tags
        if (!cleaned) {
          const internalMatch = finalText.match(/<internal>([\s\S]*?)<\/internal>/);
          if (internalMatch && internalMatch[1]) {
            cleaned = internalMatch[1].trim();
          }
        }
        // If still empty, show raw response for debugging
        if (!cleaned) {
          cleaned = finalText.trim() || '(sin respuesta - response vacía)';
        }
        post({ type: 'response', payload: { groupId, text: cleaned } });
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

function log(groupId: string, kind: 'api-call' | 'tool-call' | 'tool-result' | 'text' | 'info' | 'file-saved' | 'file-error' | 'mcp-tool', label: string, detail: string): void {
  const entry = { groupId, id: ulid(), timestamp: Date.now(), kind, label, detail };
  post({ type: 'thinking-log', payload: entry });
}
