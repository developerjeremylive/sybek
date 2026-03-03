// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage } from './types.js';
import { DEFAULT_MODEL } from './config.js';
import { ulid } from './ulid.js';

// MCP endpoint
const CHAT_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/api/chat';
const TOOL_URL = 'https://kilocode-proxy-live.developerjeremylive.workers.dev/api/execute-tool';

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
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages`);

      // Send to chat API
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...currentMessages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
      ];

      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`API error ${res.status}: ${errBody}`);
      }

      const result = await res.json();
      
      const responseContent = result.response || '';
      
      log(groupId, 'text', 'Response', responseContent.slice(0, 200));

      // Check for tool calls
      if (result.tool_calls && result.tool_calls.length > 0) {
        for (const toolCall of result.tool_calls) {
          const toolName = toolCall;
          log(groupId, 'tool-call', `Tool: ${toolName}`, 'Executing...');
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

          // Call tool
          const toolRes = await fetch(TOOL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName, input: {} }),
          });

          const toolResult = await toolRes.json();
          const toolResultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
          
          log(groupId, 'tool-result', `Result: ${toolName}`, toolResultStr.slice(0, 200));
          
          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

          currentMessages.push({ role: 'assistant', content: responseContent });
          currentMessages.push({ role: 'user', content: `Tool ${toolName} result: ${toolResultStr}` });
        }
        
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
