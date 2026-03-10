export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

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
