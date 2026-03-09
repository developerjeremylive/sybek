// Cloudflare Pages Worker for MCP API
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  // API routes
  if (url.pathname.startsWith('/api/')) {
    // Install endpoint
    if (url.pathname === '/api/mcporter/install') {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Server puppeteer installation initiated',
        server: 'puppeteer'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Tools endpoint
    if (url.pathname.startsWith('/api/mcporter/')) {
      return new Response(JSON.stringify({ tools: [
        { name: 'browser_navigate', description: 'Navega a una URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
        { name: 'browser_screenshot', description: 'Toma screenshot', inputSchema: { type: 'object', properties: { selector: { type: 'string' } } } },
        { name: 'browser_click', description: 'Click en elemento', inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] } },
        { name: 'browser_type', description: 'Escribe texto', inputSchema: { type: 'object', properties: { selector: { type: 'string' }, text: { type: 'string' } }, required: ['selector', 'text'] } },
        { name: 'browser_evaluate', description: 'Ejecuta JS', inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] } },
        { name: 'browser_snapshot', description: 'Obtiene HTML', inputSchema: { type: 'object', properties: {} } },
        { name: 'browser_urls', description: 'Lista pestañas', inputSchema: { type: 'object', properties: {} } },
        { name: 'browser_new_tab', description: 'Nueva pestaña', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
        { name: 'browser_close_tab', description: 'Cierra pestaña', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } } } }
      ]}), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }
  
  // For all other requests, fetch from origin (static files)
  return fetch(request);
}
