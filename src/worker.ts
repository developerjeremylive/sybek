// Cloudflare Worker - AI Proxy
// Proxies requests to Cloudflare Workers AI

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/ai')) {
      const accountId = env.CF_ACCOUNT_ID || 'b7a628f29ce7b9e4d28128bf5b4442b6';
      
      const body = await request.text();
      let jsonBody: any;
      try {
        jsonBody = JSON.parse(body);
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }
      
      const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
      
      const modelEndpoints: Record<string, string> = {
        '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
        '@cf/google/gemma-2-2b': '/ai/run/@cf/google/gemma-2-2b',
      };
      
      const endpoint = modelEndpoints[model] || `/ai/run/${model}`;
      const workersAiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}${endpoint}`;
      
      console.log('[AI Proxy] Calling:', workersAiUrl);
      
      const response = await fetch(workersAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
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
    
    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
