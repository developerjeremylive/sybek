// Netlify function - Cloudflare Workers AI
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Use POST method' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { messages, model } = body;
    
    const aiModel = model || '@cf/meta/llama-3.1-8b-instruct';
    const system = 'You are a helpful AI assistant. Answer in Spanish or English.';
    
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts/b7a628f29ce7b9e4d28128bf5b4442b6/ai/run/' + aiModel, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer bJgDknDpGEsDJqukdrGK3IO9DEmInpaLmyqjTN6z'
      },
      body: JSON.stringify({ 
        messages: [{ role: 'system', content: system }, ...(messages || [])], 
        max_tokens: 512 
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: data.errors?.[0]?.message || 'API Error' }) 
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: data.result?.response || 'No response' })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
