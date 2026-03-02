const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const KILOCODE_BASE_URL = 'https://api.kilocode.ai/v1';

// Store API keys in memory (in production, use a database)
const apiKeys = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, tools, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const requestBody = {
      model: model || 'kilocode/anthropic/claude-haiku-3.5',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || { type: 'object', properties: {}, required: [] }
        }
      }));
      requestBody.tool_choice = "auto";
    }

    const response = await fetch(`${KILOCODE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3457;
app.listen(PORT, () => {
  console.log(`MCP Proxy running on port ${PORT}`);
});
