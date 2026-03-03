// Cloudflare Worker - AI Proxy for Workers AI
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle CORS preflight for /api/ routes
  if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  // Proxy /api/ai to Workers AI
  if (url.pathname.startsWith('/api/ai')) {
    const accountId = 'b7a628f29ce7b9e4d28128bf5b4442b6';
    const apiToken = 'EmLAmGq9ejsEaa7VHjxH6aGJgjoe2woyKfMXCu93';
    
    const body = await request.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(body);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }
    
    const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
    
    const modelEndpoints = {
      '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
      '@cf/google/gemma-2-2b': '/ai/run/@cf/google/gemma-2-2b',
    };
    
    const endpoint = modelEndpoints[model] || '/ai/run/' + model;
    const workersAiUrl = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + endpoint;
    
    const response = await fetch(workersAiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiToken,
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  return new Response('Not Found', { status: 404 });
}
