// ---------------------------------------------------------------------------
// OpenBrowserClaw — Agent Worker
// ---------------------------------------------------------------------------
//
// Runs in a dedicated Web Worker. Uses Cloudflare Workers AI for the agent.
// Supports function calling with Llama models.

import type { WorkerInbound, WorkerOutbound, InvokePayload, CompactPayload, ConversationMessage, ThinkingLogEntry, TokenUsage } from './types.js';
import { TOOL_DEFINITIONS } from './tools.js';
import { DEFAULT_MODEL } from './config.js';
import { readGroupFile, writeGroupFile, listGroupFiles } from './storage.js';
import { executeShell } from './shell.js';
import { ulid } from './ulid.js';

// Workers AI endpoint (via the worker proxy)
const WORKERS_AI_URL = '/api/ai';

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

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
// Agent invocation — tool-use loop with Workers AI
// ---------------------------------------------------------------------------

async function handleInvoke(payload: InvokePayload): Promise<void> {
  const { groupId, messages, systemPrompt, apiKey, model, maxTokens } = payload;

  post({ type: 'typing', payload: { groupId } });
  log(groupId, 'info', 'Starting', `Model: ${model} · Max tokens: ${maxTokens}`);

  const actualModel = model || DEFAULT_MODEL;

  try {
    let currentMessages: ConversationMessage[] = [...messages];
    let iterations = 0;
    const maxIterations = 25;

    while (iterations < maxIterations) {
      iterations++;

      log(groupId, 'api-call', `API call #${iterations}`, `${currentMessages.length} messages in context`);

      const aiMessages = [
        { role: 'system', content: systemPrompt },
        ...currentMessages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content.map(c => c.type === 'text' ? c.text : '').join('')
        }))
      ];

      const tools = TOOL_DEFINITIONS.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }));

      const body = {
        model: actualModel,
        messages: aiMessages,
        max_tokens: maxTokens,
        tools: tools.length > 0 ? tools : undefined,
      };

      const res = await fetch(WORKERS_AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Workers AI error ${res.status}: ${errBody}`);
      }

      const result = await res.json();

      const responseMessage = result.response || result.messages?.[result.messages.length - 1];
      const responseContent = responseMessage?.content || '';
      const toolCalls = responseMessage?.tool_calls || [];

      if (result.usage) {
        post({
          type: 'token-usage',
          payload: {
            groupId,
            inputTokens: result.usage.prompt_tokens || 0,
            outputTokens: result.usage.completion_tokens || 0,
            contextLimit: 128000,
          },
        });
      }

      if (responseContent) {
        const preview = responseContent.length > 200 ? responseContent.slice(0, 200) + '…' : responseContent;
        log(groupId, 'text', 'Response', preview);
      }

      if (toolCalls && toolCalls.length > 0) {
        const toolResults = [];
        
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function?.name || toolCall.name;
          const toolArgs = typeof toolCall.function?.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function?.arguments || {};
          
          const inputPreview = JSON.stringify(toolArgs);
          const inputShort = inputPreview.length > 300 ? inputPreview.slice(0, 300) + '…' : inputPreview;
          log(groupId, 'tool-call', `Tool: ${toolName}`, inputShort);

          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'running' } });

          const output = await executeTool(toolName, toolArgs, groupId);

          const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
          const outputShort = outputStr.length > 500 ? outputStr.slice(0, 500) + '…' : outputStr;
          log(groupId, 'tool-result', `Result: ${toolName}`, outputShort);

          post({ type: 'tool-activity', payload: { groupId, tool: toolName, status: 'done' } });

          toolResults.push({
            tool_call_id: toolCall.id || crypto.randomUUID(),
            name: toolName,
            content: typeof output === 'string' ? output.slice(0, 100_000) : JSON.stringify(output).slice(0, 100_000),
          });
        }

        currentMessages.push({ 
          role: 'assistant', 
          content: responseContent + (toolCalls.length > 0 ? '\n' + JSON.stringify(toolCalls.map((tc: any) => ({ name: tc.function?.name || tc.name, arguments: tc.function?.arguments }))) : '')
        });
        currentMessages.push({ 
          role: 'tool', 
          content: toolResults.map(r => `Tool ${r.name}: ${r.content}`).join('\n\n')
        });

        post({ type: 'typing', payload: { groupId } });
      } else {
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
  const { groupId, systemPrompt } = payload;

  try {
    const messages: ConversationMessage[] = [
      { role: 'user', content: 'Compact the conversation context. Keep all important information.' },
    ];

    post({
      type: 'compacted',
      payload: { groupId, systemPrompt, messages },
    });
  } catch (err) {
    console.error('[agent-worker] Compact error:', err);
  }
}

function post(msg: WorkerOutbound): void {
  self.postMessage(msg);
}

function log(groupId: string, kind: string, title: string, text: string): void {
  const entry: ThinkingLogEntry = {
    id: ulid(),
    timestamp: Date.now(),
    kind: kind as any,
    title,
    text,
  };
  post({ type: 'thinking', payload: { groupId, entry } });
}
