# MCP Manager Skill

Manage MCP (Model Context Protocol) servers using mcporter.

## Tools

- `mcp_list` - List all configured MCP servers
- `mcp_add` - Add a new MCP server
- `mcp_remove` - Remove an MCP server
- `mcp_call` - Call a tool from an MCP server

## Usage

### List MCP servers
```
List all available MCP servers
```

### Add MCP server
```
Add the filesystem MCP server with root directory /root
```

### Call MCP tool
```
Use the filesystem MCP to list files in /root
```

## Available MCP Servers (no credentials needed)

- `filesystem` - File system access (needs directory path)
- `sequentialthinking` - Sequential thinking tools
- `memory` - Memory/vector storage
- `fetch` - Web fetching
- `time` - Time/date utilities
- `sqlite` - SQLite database
- `git` - Git operations

## MCP Servers (need credentials)

- `github` - GitHub API (needs GITHUB_TOKEN)
- `notion` - Notion API (needs NOTION_API_KEY)
- `postgres` - PostgreSQL (needs connection string)
- `sentry` - Sentry (needs SENTRY_AUTH_TOKEN)
- `slack` - Slack (needs SLACK_BOT_TOKEN)
- `google-drive` - Google Drive (needs credentials)
- `linear` - Linear (needs LINEAR_API_KEY)

## Config Location

MCP servers are configured in: `/root/.openclaw/workspace/config/mcporter.json`
