// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_GROUP_ID, DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint for AI chat - use Cloudflare Worker proxy
const CHAT_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/api/ai';

// Cloudflare Browser Rendering Worker URL
const CF_BROWSER_WORKER_URL = 'https://sybek-mcporter-worker.developerjeremylive.workers.dev';

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

// Helper to extract summary info from HTML
function extractHtmlSummary(html: string): string {
  const parts: string[] = [];
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) parts.push(`TÍTULO: ${titleMatch[1].trim()}`);
  
  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) 
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (descMatch) parts.push(`\nDESCRIPCIÓN: ${descMatch[1].trim()}`);
  
  // Extract ALL headings (h1-h6)
  const allHeadings: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const matches = html.match(new RegExp(`<h${i}[^>]*>([^<]+)<\\/h${i}>`, 'gi'));
    if (matches) {
      const texts = matches.map(m => m.replace(/<[^>]+>/g, '').trim());
      allHeadings.push(...texts);
    }
  }
  if (allHeadings.length > 0) {
    parts.push(`\nENCABEZADOS (${allHeadings.length}): ${allHeadings.join(' | ')}`);
  }
  
  // Extract ALL paragraphs (not just the first one)
  const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (pMatches) {
    const pTexts = pMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 20);
    if (pTexts.length > 0) {
      parts.push(`\nPÁRRAFOS (${pTexts.length} encontrados):`);
      pTexts.slice(0, 10).forEach((p, i) => {
        parts.push(`  ${i + 1}. ${p.slice(0, 500)}`);
      });
      if (pTexts.length > 10) {
        parts.push(`  ... y ${pTexts.length - 10} más`);
      }
    }
  }
  
  // Extract list items (ul/ol)
  const liMatches = html.match(/<li[^>]*>([^<]+)<\/li>/gi);
  if (liMatches) {
    const liTexts = liMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 2);
    if (liTexts.length > 0) {
      parts.push(`\nELEMENTOS DE LISTA (${liTexts.length}):`);
      liTexts.slice(0, 20).forEach((li, i) => {
        parts.push(`  • ${li.slice(0, 200)}`);
      });
      if (liTexts.length > 20) {
        parts.push(`  ... y ${liTexts.length - 20} más`);
      }
    }
  }
  
  // Extract links
  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi);
  if (linkMatches) {
    const links = linkMatches.map(m => {
      const hrefMatch = m.match(/href=["']([^"']+)["']/);
      const textMatch = m.match(/>([^<]+)</);
      return hrefMatch ? { text: textMatch ? textMatch[1].trim() : 'Sin texto', url: hrefMatch[1] } : null;
    }).filter(Boolean);
    
    if (links.length > 0) {
      // Show anchor text
      const linkTexts = links.slice(0, 15).map(l => l!.text);
      parts.push(`\nENLACES - Texto (${links.length}): ${linkTexts.join(' | ')}`);
      
      // Show full URLs separately (only external ones)
      const externalLinks = links.filter(l => l!.url.startsWith('http')).slice(0, 10).map(l => l!.url);
      if (externalLinks.length > 0) {
        parts.push(`\nENLACES - URLs Externas:\n${externalLinks.join('\n')}`);
      }
    }
  }
  
  // Extract contact info (email, phone)
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emailMatch) {
    parts.push(`\nEMAILS: ${[...new Set(emailMatch)].join(', ')}`);
  }
  const phoneMatch = html.match(/(\+?[\d\s\-().]{10,})/g);
  if (phoneMatch) {
    const phones = phoneMatch.filter(p => p.replace(/\D/g, '').length >= 10).slice(0, 5);
    if (phones.length > 0) {
      parts.push(`\nTELÉFONOS: ${phones.join(', ')}`);
    }
  }
  
  // Extract social media links
  const socialDomains = ['linkedin.com', 'github.com', 'twitter.com', 'facebook.com', 'instagram.com', 'youtube.com'];
  const socialLinks = linkMatches?.filter((l: string) => socialDomains.some(d => l.toLowerCase().includes(d))).slice(0, 10);
  if (socialLinks && socialLinks.length > 0) {
    parts.push(`\nREDES SOCIALES: ${socialLinks.join(' | ')}`);
  }
  
  // Extract image alt texts
  const imgMatches = html.match(/<img[^>]+alt=["']([^"']+)["']/gi);
  if (imgMatches) {
    const altTexts = imgMatches.map(m => m.match(/alt=["']([^"']+)["']/)?.[1]).filter(Boolean).slice(0, 10);
    if (altTexts.length > 0) {
      parts.push(`\nIMÁGENES: ${altTexts.join(', ')}`);
    }
  }
  
  // Extract skills (common patterns)
  const skillsMatch = html.match(/(?:skills|habilidades|technologies|technologies|stack)[\s:]+([^<]{10,200})/i);
  if (skillsMatch) {
    parts.push(`\nHABILIDADES/TECH: ${skillsMatch[1].trim()}`);
  }
  
  return parts.join('\n');
}

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
  // Save to localStorage and sessionStorage so FilesPage can read it
  try {
    localStorage.setItem('currentSessionFolder', folder);
    sessionStorage.setItem('currentSessionFolder', folder);
  } catch {}
}

// Load context folders from localStorage (will be set from main thread)
let contextFolders: string[] = [];

export function setContextFolders(folders: string[]): void {
  contextFolders = folders;
}

// Add a folder to context automatically when saving MCP HTML
function addFolderToContext(folder: string): void {
  if (!contextFolders.includes(folder)) {
    contextFolders = [...contextFolders, folder];
    // Save to localStorage so it persists
    try {
      localStorage.setItem('contextFolders', JSON.stringify(contextFolders));
    } catch {}
  }
}

// Generate a unique session folder based on timestamp
function getSessionFolder(): string {
  if (!currentSessionFolder) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    currentSessionFolder = `chat-${dateStr}-${timeStr}`;
    // Save to localStorage and sessionStorage so FilesPage can read it
    try {
      localStorage.setItem('currentSessionFolder', currentSessionFolder);
      sessionStorage.setItem('currentSessionFolder', currentSessionFolder);
    } catch {}
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
  console.log('[writeGroupFile] START', { groupId, filePath, contentLength: content.length });
  const dir = await getGroupDir(groupId);
  const { dirs, filename } = parsePath(filePath);
  
  let current = dir;
  for (const seg of dirs) {
    current = await current.getDirectoryHandle(seg, { create: true });
  }
  
  console.log('[writeGroupFile] About to create file', { filename });
  const fileHandle = await current.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  console.log('[writeGroupFile] DONE', { groupId, filePath });
}

async function listGroupFiles(groupId: string, dirPath: string = '.'): Promise<string[]> {
  console.log('[listGroupFiles] START', { groupId, dirPath });
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
  console.log('[listGroupFiles] DONE', { groupId, dirPath, entries });
  return entries.sort();
}

// ---------------------------------------------------------------------------
// Auto-save: Extract code from LLM response and save to files
// ---------------------------------------------------------------------------

async function autoSaveCodeFiles(groupId: string, aiResponse: string): Promise<string[]> {
  const savedFiles: string[] = [];
  const content = aiResponse;
  
  // Use session folder if available, otherwise use context folders
  const foldersToCheck = currentSessionFolder ? [currentSessionFolder] : [...contextFolders];
  
  // Check ALL folders for existing files
  for (const folder of foldersToCheck) {
    try {
      const existingFiles = await listGroupFiles(groupId, folder);
      // If any folder has files, skip auto-save entirely
      if (existingFiles.length > 0) {
        log(groupId, 'info', 'Auto-save skipped', `Folder "${folder}" already has files`);
        return savedFiles;
      }
    } catch {}
  }
  
  const targetFolder = foldersToCheck[0] || getSessionFolder();
  
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
  
  // Skip auto-saving index.html if MCP already saved an mcp-*.html file
  // (handled by early return above if existingFiles.length > 0)
  
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
  
  // Save sessionFolder to localStorage and sessionStorage so FilesPage can read it
  if (currentSessionFolder) {
    try {
      localStorage.setItem('currentSessionFolder', currentSessionFolder);
      sessionStorage.setItem('currentSessionFolder', currentSessionFolder);
    } catch {}
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
      
      // Get unique server names
      const serverNames = [...new Set(activeMcpTools.map(t => t.serverName))];
      if (serverNames.length > 0) {
        toolDescriptions.push('\n**HERRAMIENTAS MCP - FORMATO OBLIGATORIO:**');
        toolDescriptions.push(`Servidores disponibles: ${serverNames.join(', ')}`);
        
        // Add specific examples for Cloudflare Browser Rendering
        const cfTools = activeMcpTools.filter(t => t.serverName.toLowerCase().includes('cloudflare'));
        if (cfTools.length > 0) {
          toolDescriptions.push('\n**EJEMPLOS Cloudflare Browser Rendering:**');
          toolDescriptions.push('- [mcp] cloudflare | cf_html | {"url": "https://example.com"} [/mcp]');
          toolDescriptions.push('- [mcp] cloudflare | cf_screenshot | {"url": "https://example.com"} [/mcp]');
          toolDescriptions.push('- [mcp] cloudflare | cf_markdown | {"url": "https://example.com"} [/mcp]');
          toolDescriptions.push('- [mcp] cloudflare | cf_json | {"url": "https://example.com", "prompt": "extrae el título"} [/mcp]');
          toolDescriptions.push('\n**Tools disponibles:** ' + cfTools.map(t => t.name).join(', '));
        }
        
        toolDescriptions.push('\n**USA ESTE FORMATO EXACTO - NO OTRO:**');
        toolDescriptions.push(`[mcp] ${serverNames[0]} | nombre_de_tool | {"param": "valor"} [/mcp]`);
        toolDescriptions.push('**ERROR COMÚN: No pongas solo el nombre de la herramienta después de [mcp]**');
        toolDescriptions.push('**CORRECTO:** [mcp] Puppeteer | puppeteer_navigate | {"url": "youtube.com"} [/mcp]');
        toolDescriptions.push('**INCORRECTO:** [mcp] puppeteer_navigate | {"url": "youtube.com"} [/mcp]');
      }
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
      log(groupId, 'info', 'MCP Debug', `activeMcpTools: ${activeMcpTools.length}`);
      if (activeMcpTools.length > 0) {
        // Updated regex to handle spaces and special chars in server names
        const mcpRegex = /\[mcp\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\{[^}]*\})\s*\[\/mcp\]/g;
        let mcpMatch;
        while ((mcpMatch = mcpRegex.exec(responseContent)) !== null) {
          let serverName = mcpMatch[1].trim();
          const toolName = mcpMatch[2].trim();
          const argsStr = mcpMatch[3];
          
          // Normalize server name - try to match against active MCP servers
          const normalizedServerName = serverName.toLowerCase().replace(/\s+/g, '');
          const cfMatch = normalizedServerName.includes('cloudflare') || normalizedServerName === 'cf';
          
          if (cfMatch) {
            // Map "cloudflare", "cf", etc. to the CF Browser Rendering server
            const cfServer = mcpServers.find(s => 
              s.name.toLowerCase().includes('cloudflare') || s.url === 'cf-browser-rendering'
            );
            if (cfServer) {
              serverName = cfServer.name;
            }
          }
          
          try {
            const args = JSON.parse(argsStr);
            mcpToolCalls.push({ serverName, toolName, arguments: args });
            log(groupId, 'info', 'Extracted MCP tool from text', `${serverName}/${toolName}: ${argsStr}`);
          } catch {
            // Invalid JSON, skip
          }
        }
      }

      log(groupId, 'info', 'After MCP extraction', 'Continuing...');

      // Auto-save code files from response
      const savedFiles = await autoSaveCodeFiles(groupId, responseContent);
      log(groupId, 'info', 'After autoSaveCodeFiles', `saved ${savedFiles.length} files`);
      
      // Generate response - show LLM response AND saved files
      let finalText = responseContent;
      if (savedFiles.length > 0) {
        finalText = responseContent + '\n\n✅ Archivos guardados:\n' + savedFiles.map(f => `- ${f.split('/').pop()}`).join('\n');
      } else {
        // Remove code blocks from display
        finalText = responseContent.replace(/```[\s\S]*?```/g, '').trim();
      }

      // Only log if there are actual tool calls
      log(groupId, 'info', 'Tool check', `toolCalls.length=${toolCalls.length}, mcpToolCalls.length=${mcpToolCalls.length}`);
      if (toolCalls.length > 0 || mcpToolCalls.length > 0) {
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
        
        // Execute MCP tool calls (outside toolCalls check so they run even without regular tools)
        if (mcpToolCalls.length > 0) {
          log(groupId, 'info', 'MCP Before Loop', `mcpToolCalls=${JSON.stringify(mcpToolCalls.slice(0,2))}`);
          log(groupId, 'info', 'MCP Loop', `mcpToolCalls.length=${mcpToolCalls.length}`);
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

            // Special handling for Cloudflare Browser Rendering MCP
            if (serverName.toLowerCase().includes('cloudflare') || server.url === 'cf-browser-rendering') {
              try {
                log(groupId, 'mcp-tool', `CF Browser: ${toolName}`, 'Calling REST API...');
                
                const endpointMap: Record<string, { method: string, path: string }> = {
                  'cf_screenshot': { method: 'POST', path: '/rest/screenshot' },
                  'cf_html': { method: 'POST', path: '/rest/html' },
                  'cf_markdown': { method: 'POST', path: '/rest/markdown' },
                  'cf_pdf': { method: 'POST', path: '/rest/pdf' },
                  'cf_links': { method: 'POST', path: '/rest/links' },
                  'cf_json': { method: 'POST', path: '/rest/json' },
                  'cf_crawl': { method: 'POST', path: '/rest/crawl' },
                };
                
                // Handle status/cancel
                if (toolName === 'cf_crawl_status') {
                  const jobId = mcpArgs.jobId || mcpArgs[0];
                  const cfResponse = await fetch(`${CF_BROWSER_WORKER_URL}/rest/crawl/${jobId}?limit=${mcpArgs.limit || 10}`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(60000),
                  });
                  const cfResult = await cfResponse.json();
                  const resultText = JSON.stringify(cfResult, null, 2);
                  post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
                  post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: resultText } });
                  currentMessages.push({ role: 'user', content: `MCP Tool result: ${resultText}` });
                  continue;
                }
                
                if (toolName === 'cf_crawl_cancel') {
                  const jobId = mcpArgs.jobId || mcpArgs[0];
                  const cfResponse = await fetch(`${CF_BROWSER_WORKER_URL}/rest/crawl/${jobId}`, {
                    method: 'DELETE',
                    signal: AbortSignal.timeout(60000),
                  });
                  const cfResult = await cfResponse.json();
                  const resultText = JSON.stringify(cfResult, null, 2);
                  post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
                  post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: resultText } });
                  currentMessages.push({ role: 'user', content: `MCP Tool result: ${resultText}` });
                  continue;
                }
                
                const endpoint = endpointMap[toolName];
                if (!endpoint) {
                  throw new Error(`Unknown CF Browser tool: ${toolName}`);
                }
                
                const requestBody: Record<string, unknown> = {};
                if (mcpArgs.url) {
                  // Normalize URL - add https:// if missing
                  let url = mcpArgs.url;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  requestBody.url = url;
                }
                if (mcpArgs.options) requestBody.options = mcpArgs.options;
                if (mcpArgs.prompt) requestBody.prompt = mcpArgs.prompt;
                if (mcpArgs.response_format) requestBody.response_format = mcpArgs.response_format;
                if (mcpArgs.limit) requestBody.limit = mcpArgs.limit;
                if (mcpArgs.depth) requestBody.depth = mcpArgs.depth;
                
                log(groupId, 'mcp-tool', `CF Request`, `${CF_BROWSER_WORKER_URL}${endpoint.path} -> ${JSON.stringify(requestBody)}`);
                
                const cfResponse = await fetch(`${CF_BROWSER_WORKER_URL}${endpoint.path}`, {
                  method: endpoint.method,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestBody),
                  signal: AbortSignal.timeout(60000),
                });
                
                log(groupId, 'mcp-tool', `CF Response`, `status=${cfResponse.status}`);
                
                if (!cfResponse.ok) {
                  const error = await cfResponse.json();
                  throw new Error(error.error || `HTTP ${cfResponse.status}`);
                }
                
                const cfResult = await cfResponse.json();
                
                // For cf_html, check if response is too large and save to file
                let resultToShow = JSON.stringify(cfResult, null, 2);
                if (toolName === 'cf_html' && cfResult.success && cfResult.html) {
                  const htmlContent = cfResult.html;
                  const htmlSize = htmlContent.length;
                  
                  // Determine the saveFolder - prioritize sessionFolder from payload
                  let saveFolder = sessionFolder || currentSessionFolder;
                  
                  // If still empty, generate a new folder with timestamp based on URL domain
                  if (!saveFolder || saveFolder === '') {
                    let domain = 'page';
                    try {
                      const url = new URL(mcpArgs.url);
                      domain = url.hostname.replace(/\./g, '-');
                    } catch {}
                    saveFolder = `chat-${domain}-${Date.now()}`;
                  }
                  
                  // FORCE save to storage IMMEDIATELY before any file operation
                  try {
                    localStorage.setItem('currentSessionFolder', saveFolder);
                    sessionStorage.setItem('currentSessionFolder', saveFolder);
                    console.log('[agent-worker] Saved sessionFolder to storage:', saveFolder);
                  } catch (e) {
                    console.log('[agent-worker] Failed to save sessionFolder:', e);
                  }
                  log(groupId, 'mcp-tool', 'DEBUG saveFolder', `sessionFolder="${sessionFolder}", currentSessionFolder="${currentSessionFolder}", groupId="${groupId}" -> saveFolder="${saveFolder}"`);
                  
                  // If HTML is larger than 10KB, save directly in chat folder (no subfolder)
                  if (htmlSize > 10000) {
                    const timestamp = Date.now();
                    // Extract domain for filename
                    let domain = 'page';
                    try {
                      const url = new URL(mcpArgs.url);
                      domain = url.hostname.replace(/\./g, '-');
                    } catch {}
                    const fileName = `mcp-${domain}-${timestamp}.html`;
                    const summary = extractHtmlSummary(htmlContent);
                    const sizeInfo = `HTML muy grande (${Math.round(htmlSize/1024)}KB).`;
                    
                    try {
                      // Debug: log the folder being used
                      log(groupId, 'mcp-tool', 'DEBUG', `saveFolder="${saveFolder}", currentSessionFolder="${currentSessionFolder}"`);
                      
                      await writeGroupFile(saveFolder, fileName, htmlContent);
                      log(saveFolder, 'mcp-tool', 'HTML saved to chat folder', fileName);
                      
                      // Verify file was saved by listing files
                      try {
                        const files = await listGroupFiles(saveFolder, '.');
                        log(saveFolder, 'mcp-tool', 'Files in folder', files.join(', '));
                        // Notify FilesPage to refresh (large HTML)
                        try { 
                          window.dispatchEvent(new CustomEvent('obc-files-refresh')); 
                          console.log('[agent-worker] Dispatched obc-files-refresh event');
                        } catch {}
                      } catch (e) {
                        log(saveFolder, 'mcp-tool', 'List error', String(e));
                      }
                      
                      // Add folder to context automatically
                      addFolderToContext(saveFolder);
                      
                      resultToShow = `HTML GUARDADO EN ARCHIVO: ${fileName}\n\n${summary}\n\nLa carpeta "${saveFolder}" ha sido agregada al contexto del chat. El archivo HTML completo está disponible en Files > ${saveFolder} > ${fileName}. Lee el archivo completo para dar una respuesta más detallada sobre TODO el contenido de la página.`;
                    } catch (saveError) {
                      log(saveFolder, 'mcp-tool', 'Failed to save HTML', String(saveError));
                      resultToShow = `${sizeInfo}\n\n${summary}\n(Nota: No se pudo guardar el archivo)`;
                    }
                  } else {
                    // Small HTML - save directly in chat folder
                    const timestamp = Date.now();
                    let domain = 'page';
                    try {
                      const url = new URL(mcpArgs.url);
                      domain = url.hostname.replace(/\./g, '-');
                    } catch {}
                    const fileName = `mcp-${domain}-${timestamp}.html`;
                    try {
                      // Debug: log the folder being used
                      log(groupId, 'mcp-tool', 'DEBUG sm HTML', `saveFolder="${saveFolder}", currentSessionFolder="${currentSessionFolder}"`);
                      
                      await writeGroupFile(saveFolder, fileName, htmlContent);
                      log(saveFolder, 'mcp-tool', 'HTML saved to chat folder', fileName);
                      
                      // Verify file was saved by listing files
                      try {
                        const files = await listGroupFiles(saveFolder, '.');
                        log(saveFolder, 'mcp-tool', 'Files in folder', files.join(', '));
                        // Notify FilesPage to refresh (small HTML)
                        try { window.dispatchEvent(new CustomEvent('obc-files-refresh')); } catch {}
                      } catch (e) {
                        log(saveFolder, 'mcp-tool', 'List error', String(e));
                      }
                      
                      // Add folder to context automatically
                      addFolderToContext(saveFolder);
                      
                      const summary = extractHtmlSummary(htmlContent);
                      resultToShow = `HTML GUARDADO EN ARCHIVO: ${fileName}\n\n${summary}\n\nLa carpeta "${saveFolder}" ha sido agregada al contexto del chat. El archivo HTML completo está disponible en Files > ${saveFolder} > ${fileName}. Lee el archivo completo para dar una respuesta más detallada sobre TODO el contenido de la página.`;
                    } catch (saveError) {
                      resultToShow = `Contenido de la página:\n\n${htmlContent.slice(0, 5000)}\n\nNota: Si necesitas más detalle, puedo volver a pedir la página completa.`;
                    }
                  }
                }
                
                post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
                post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: resultToShow } });
                currentMessages.push({ role: 'user', content: `MCP Tool result: ${resultToShow}` });
              } catch (cfError: any) {
                const errorText = `Error CF Browser: ${cfError.message}`;
                log(groupId, 'mcp-tool', `CF Error`, errorText);
                post({ type: 'tool-activity', payload: { groupId, tool: `${serverName}/${toolName}`, status: 'done' } });
                post({ type: 'tool-result', payload: { groupId, tool: `${serverName}/${toolName}`, result: errorText } });
                currentMessages.push({ role: 'user', content: `MCP Tool error: ${errorText}` });
              }
              continue;
            }

            try {
              // Call MCP tool via mcporter Worker API
              // Note: The worker doesn't actually execute Puppeteer - it just returns metadata
              // For actual browser automation, we'd need a different architecture
              const mcpWorkerUrl = 'https://sybek-mcporter-worker.developerjeremylive.workers.dev';
              const mcpResponse = await fetch(`${mcpWorkerUrl}/call`, {
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
        }
        
        // Make another API call with tool results to get final response
        if (toolCalls.length > 0 || mcpToolCalls.length > 0) {
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
        }
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
