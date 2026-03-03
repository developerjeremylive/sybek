// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint
const MCP_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/mcp';

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

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId, messages, systemPrompt, model, maxTokens } = payload;

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model || 'default'}`);

  try {
    const currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      // Send to MCP server as JSON-RPC
      const lastUserMsg = currentMessages.filter(m => m.role === 'user').pop();
      const userContent = lastUserMsg ? (typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '') : '';
      
      const requestBody = {
        jsonrpc: '2.0',
        method: 'anthropic.messages',
        params: {
          model: '@cf/meta/llama-3.1-8b-instruct',
          max_tokens: maxTokens || 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            ...currentMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
          ],
          tools: [
            { name: 'get_current_time', description: 'Get current time', input_schema: { type: 'object', properties: {} } },
            { name: 'get_weather', description: 'Get weather', input_schema: { type: 'object', properties: {} } },
            { name: 'hackernews', description: 'Get hacker news', input_schema: { type: 'object', properties: {} } },
            { name: 'joke', description: 'Get a joke', input_schema: { type: 'object', properties: {} } },
            { name: 'cat_fact', description: 'Get a cat fact', input_schema: { type: 'object', properties: {} } }
          ]
        },
        id: crypto.randomUUID()
      };

      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`MCP error ${res.status}: ${errBody}`);
      }

      const result = await res.json();

      // Handle JSON-RPC response
      let responseContent = '';
      
      if (result.result?.content) {
        responseContent = result.result.content;
      } else if (result.error) {
        throw new Error(`MCP error: ${result.error.message}`);
      }

      const preview = responseContent.length > 200 ? responseContent.slice(0, 200) + '…' : responseContent;
      log(groupId, 'text', 'Response', preview);

      // Check for tool calls in response
      const toolMatch = responseContent.match(/<tool_call>(.*?)<\/tool_call>/s);
      
      if (toolMatch) {
        const toolName = toolMatch[1].trim();
        log(groupId, 'tool-call', `Tool: ${toolName}`, 'Executing...');
        
        post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

        // Call the tool via MCP
        const toolResult = await callMcpTool(toolName, groupId);
        
        log(groupId, 'tool-result', `Result: ${toolName}`, toolResult.slice(0, 200));
        
        post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

        currentMessages.push({ role: 'assistant', content: responseContent });
        currentMessages.push({ role: 'user', content: `Tool result: ${toolResult}` });
        
        post({ type: 'typing', payload: { groupId } });
      } else {
        // Final response
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

async function callMcpTool(toolName: string, groupId: string): Promise<string> {
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: `tools/${toolName}`,
        params: {},
        id: crypto.randomUUID()
      }),
    });

    if (!res.ok) {
      return `Error: ${res.status}`;
    }

    const result = await res.json();
    return result.result?.content || JSON.stringify(result);
  } catch (err) {
    return `Error: ${err}`;
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
