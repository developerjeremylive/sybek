/**
 * Sybek Mcporter API
 * API for MCP server installation and tool discovery
 */

interface McpServerConfig {
  name: string;
  package: string;
  command: string;
  args: string[];
  description: string;
}

// Known MCP servers that can be installed
const KNOWN_SERVERS: Record<string, McpServerConfig> = {
  puppeteer: {
    name: 'Puppeteer',
    package: '@modelcontextprotocol/server-puppeteer',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    description: 'Browser automation via Puppeteer',
  },
  filesystem: {
    name: 'Filesystem',
    package: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    description: 'File system operations',
  },
  github: {
    name: 'GitHub',
    package: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    description: 'GitHub API integration',
  },
};

interface InstallRequest {
  server: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

// Known tools for each MCP server
const SERVER_TOOLS: Record<string, ToolDefinition[]> = {
  puppeteer: [
    {
      name: 'puppeteer_navigate',
      description: 'Navigate to a URL in the browser',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to navigate to' },
        },
        required: ['url'],
      },
    },
    {
      name: 'puppeteer_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name for the screenshot' },
        },
      },
    },
    {
      name: 'puppeteer_click',
      description: 'Click on an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to click' },
        },
        required: ['selector'],
      },
    },
    {
      name: 'puppeteer_evaluate',
      description: 'Evaluate JavaScript in the browser context',
      inputSchema: {
        type: 'object',
        properties: {
          script: { type: 'string', description: 'JavaScript code to execute' },
        },
        required: ['script'],
      },
    },
  ],
  filesystem: [
    {
      name: 'read_directory',
      description: 'List files in a directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to read' },
        },
        required: ['path'],
      },
    },
    {
      name: 'read_file',
      description: 'Read contents of a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to read' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'create_directory',
      description: 'Create a new directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to create' },
        },
        required: ['path'],
      },
    },
  ],
  github: [
    {
      name: 'github_search_repositories',
      description: 'Search for GitHub repositories',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
    },
    {
      name: 'github_get_pull_request',
      description: 'Get details of a pull request',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          pullNumber: { type: 'number', description: 'Pull request number' },
        },
        required: ['owner', 'repo', 'pullNumber'],
      },
    },
  ],
};

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Route: POST /api/mcporter/install - Install an MCP server
    if (path === '/api/mcporter/install' && request.method === 'POST') {
      return handleInstall(request, corsHeaders);
    }

    // Route: GET /api/mcporter/:serverName/tools - Get tools for a server
    const toolsMatch = path.match(/^\/api\/mcporter\/([^/]+)\/tools$/);
    if (toolsMatch && request.method === 'GET') {
      const serverName = toolsMatch[1];
      return handleGetTools(serverName, corsHeaders);
    }

    // Route: GET /api/mcporter/servers - List available servers
    if (path === '/api/mcporter/servers' && request.method === 'GET') {
      return handleListServers(corsHeaders);
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mcporter API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function handleInstall(
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body: InstallRequest = await request.json();
  const { server } = body;

  if (!server) {
    return new Response(
      JSON.stringify({ error: 'Server name is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const serverConfig = KNOWN_SERVERS[server];
  if (!serverConfig) {
    return new Response(
      JSON.stringify({ 
        error: `Server '${server}' not found`,
        available: Object.keys(KNOWN_SERVERS),
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[Mcporter] Installing ${server}...`);

  return new Response(
    JSON.stringify({
      success: true,
      server: server,
      name: serverConfig.name,
      package: serverConfig.package,
      message: `${serverConfig.name} MCP server configured successfully`,
      tools: SERVER_TOOLS[server] || [],
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleGetTools(serverName: string, corsHeaders: Record<string, string>): Response {
  const tools = SERVER_TOOLS[serverName];

  if (!tools) {
    return new Response(
      JSON.stringify({ 
        error: `Server '${serverName}' not found or not installed`,
        available: Object.keys(SERVER_TOOLS),
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      server: serverName,
      tools: tools,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleListServers(corsHeaders: Record<string, string>): Response {
  const servers = Object.entries(KNOWN_SERVERS).map(([key, config]) => ({
    id: key,
    name: config.name,
    description: config.description,
    package: config.package,
  }));

  return new Response(
    JSON.stringify({ servers }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
