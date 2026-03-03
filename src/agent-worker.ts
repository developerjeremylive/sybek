// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_GROUP_ID, DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint for AI chat - use Workers AI directly
const CHAT_URL = '/api/ai';

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

async function getGroupDir(groupId: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const safeId = groupId.replace(/:/g, '-');
  
  let current = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  current = await current.getDirectoryHandle('groups', { create: true });
  current = await current.getDirectoryHandle(safeId, { create: true });
  return current.getDirectoryHandle('workspace', { create: true });
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

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model}`);

  try {
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      // Build messages with tools
      const chatMessages = [
        { role: 'system', content: systemPrompt },
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

function log(groupId: string, kind: string, title: string, text: string): void {
  const entry: any = { id: ulid(), timestamp: Date.now(), kind, title, text };
  post({ type: 'thinking-log', payload: entry } as any);
}
