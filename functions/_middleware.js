export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Handle root path - serve the built index.html
  if (pathname === '/') {
    try {
      const indexHtml = await context.env.ASSETS.fetch(new Request('/index.html'));
      const response = await indexHtml.text();
      
      // Replace the script source to point to the built assets
      const updatedResponse = response.replace(
        '<script type="module" src="/src/main.tsx"></script>',
        '<script type="module" crossorigin src="/assets/index-D4P5b4Ki.js"></script><link rel="stylesheet" crossorigin href="/assets/index-BN0zOvjq.css">'
      );
      
      return new Response(updatedResponse, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        }
      });
    } catch (error) {
      // If index.html doesn't exist in assets, fall back to next
      return context.next();
    }
  }

  // Set correct MIME types for JavaScript files
  if (pathname.endsWith('.js')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'application/javascript');
    return newResponse;
  }

  // Set correct MIME types for CSS files
  if (pathname.endsWith('.css')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'text/css');
    return newResponse;
  }

  // Set correct MIME types for WASM files
  if (pathname.endsWith('.wasm')) {
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Content-Type', 'application/wasm');
    return newResponse;
  }

  return context.next();
}
