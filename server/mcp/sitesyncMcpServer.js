import '../config.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { runRagAssistant } from '../rag/assistant.js'

// Create an McpServer instance named "sitesync-operations"
const server = new McpServer({
  name: 'sitesync-operations',
  version: '1.0.0',
})

// Register the operational query tool
server.tool(
  'queryOperationalData',
  'Ask a natural-language question about construction site operations — inventory levels, purchase orders, deliveries, equipment utilization, project tasks, vendors, budgets, or active alerts. Returns a grounded answer with citations to specific database records.',
  {
    question: z.string().describe('The natural language operational question'),
    siteId: z.string().optional().describe('Optional site ID to scope the query, e.g. SITE-002'),
  },
  async ({ question, siteId }) => {
    try {
      const result = await runRagAssistant({
        message: question,
        question,
        siteId,
        conversationHistory: [],
      })

      const sourcesText =
        Array.isArray(result.sources) && result.sources.length > 0
          ? result.sources.map((s) => s.label || s.id).join(', ')
          : 'None'

      return {
        content: [
          {
            type: 'text',
            text: `${result.answer}\n\nSources: ${sourcesText}`,
          },
        ],
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error querying operational data: ' + err.message,
          },
        ],
        isError: true,
      }
    }
  }
)

// Connect via standard I/O transport
const transport = new StdioServerTransport()
await server.connect(transport)
console.error('SiteSync MCP server running on stdio')
