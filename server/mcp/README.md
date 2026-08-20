# SiteSync MCP Server

This directory contains the Model Context Protocol (MCP) server for SiteSync. It exposes an MCP-compliant tool allowing LLM clients (such as Claude Desktop or any MCP host) to perform natural-language operational queries against the live construction site database.

## Exposed Tools

### `queryOperationalData`
- **Description**: Ask a natural-language question about construction site operations — inventory levels, purchase orders, deliveries, equipment utilization, project tasks, vendors, budgets, or active alerts. Returns a grounded answer with citations to specific database records.
- **Parameters**:
  - `question` *(string, required)*: The natural language operational question.
  - `siteId` *(string, optional)*: Optional site ID to scope the query (e.g., `SITE-002`).

---

## Testing / Running Manually

You can test running the MCP server locally via:

```bash
# From the server directory
npm run mcp

# Or directly with node
node mcp/sitesyncMcpServer.js
```

When started, it runs on standard I/O (stdio) and outputs:
```
SiteSync MCP server running on stdio
```

---

## Connecting to Claude Desktop

To connect this MCP server to Claude Desktop:

1. Locate your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the `sitesync` server configuration to the `mcpServers` object in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sitesync": {
      "command": "node",
      "args": [
        "ABSOLUTE_PATH_TO/server/mcp/sitesyncMcpServer.js"
      ],
      "env": {
        "GROQ_API_KEY": "your_groq_api_key_here",
        "DATABASE_URL": "postgresql://postgres:password@host:port/database"
      }
    }
  }
}
```

> [!NOTE]
> - Replace `ABSOLUTE_PATH_TO` with the actual absolute path to `server/mcp/sitesyncMcpServer.js` on your machine (e.g. `d:/SiteSync/server/mcp/sitesyncMcpServer.js`).
> - Since MCP servers over stdio do not automatically inherit shell profile environment variables when spawned by desktop applications, include any necessary credentials (such as `GROQ_API_KEY` and `DATABASE_URL`) in the `env` block.

3. Restart Claude Desktop. The `queryOperationalData` tool will be available for queries.
