import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const mcp_list = {
  description: 'List all configured MCP servers',
  parameters: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    try {
      const { stdout } = await execAsync('mcporter config list 2>&1', { timeout: 30000 });
      return { success: true, servers: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export const mcp_add = {
  description: 'Add a new MCP server',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the MCP server' },
      command: { type: 'string', description: 'Command to run the MCP server' },
    },
    required: ['name', 'command'],
  },
  handler: async (args) => {
    try {
      const { stdout } = await execAsync(`mcporter config add ${args.name} "${args.command}" 2>&1`, { timeout: 30000 });
      return { success: true, result: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export const mcp_remove = {
  description: 'Remove an MCP server',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name of the MCP server to remove' },
    },
    required: ['name'],
  },
  handler: async (args) => {
    try {
      const { stdout } = await execAsync(`mcporter config remove ${args.name} 2>&1`, { timeout: 30000 });
      return { success: true, result: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export const mcp_call = {
  description: 'Call a tool from an MCP server',
  parameters: {
    type: 'object',
    properties: {
      server: { type: 'string', description: 'MCP server name' },
      tool: { type: 'string', description: 'Tool name to call' },
      args: { type: 'object', description: 'Arguments to pass to the tool' },
    },
    required: ['server', 'tool'],
  },
  handler: async (args) => {
    try {
      const argsStr = Object.entries(args.args || {})
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');
      const { stdout } = await execAsync(`mcporter call ${args.server}.${args.tool} ${argsStr} 2>&1`, { timeout: 60000 });
      return { success: true, result: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export const mcp_tools = {
  description: 'List tools available from an MCP server',
  parameters: {
    type: 'object',
    properties: {
      server: { type: 'string', description: 'MCP server name' },
    },
    required: ['server'],
  },
  handler: async (args) => {
    try {
      const { stdout } = await execAsync(`mcporter list ${args.server} --schema 2>&1`, { timeout: 30000 });
      return { success: true, tools: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
