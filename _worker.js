// Cloudflare Worker - AI Proxy for Workers AI

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Proxy /api/ai to Workers AI
    if (url.pathname.startsWith('/api/ai')) {
      const accountId = env.CF_ACCOUNT_ID || 'b7a628f29ce7b9e4d28128bf5b4442b6';
      const apiToken = env.CF_API_TOKEN;
      
      const body = await request.text();
      let jsonBody;
      try {
        jsonBody = JSON.parse(body);
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }
      
      const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
      
      // Map model names to Workers AI endpoints
      const modelEndpoints = {
        '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
        '@cf/google/gemma-2-2b': '/ai/run/@cf/google/gemma-2-2b',
      };
      
      const endpoint = modelEndpoints[model] || `/ai/run/${model}`;
      const workersAiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}${endpoint}`;
      
      const response = await fetch(workersAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          messages: jsonBody.messages,
          max_tokens: jsonBody.max_tokens,
          tools: jsonBody.tools,
        }),
      });
      
      const responseData = await response.json();
      
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Handle CORS preflight
    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // For all other routes, return 404
    return new Response('Not Found', { status: 404 });
  },
};
