import '../config.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { runRagAssistant } from '../rag/assistant.js'
import { getCollectionDirect } from '../db.js'

// Create an official McpServer instance
const server = new McpServer({
  name: 'sitesync-operations',
  version: '1.0.0',
})

// 1. MCP Tool: queryOperationalData
server.tool(
  'queryOperationalData',
  'Query live construction telemetry across inventory, purchase orders, deliveries, equipment, tasks, and budgets with verifiable citations.',
  {
    question: z.string().describe('Operational question (e.g., "What is the cement stock at Riverside Tower?")'),
    siteId: z.string().optional().describe('Optional site ID (e.g., SITE-001)'),
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
          : 'Verified from PostgreSQL Live Telemetry'

      return {
        content: [
          {
            type: 'text',
            text: `${result.answer}\n\n[Citations: ${sourcesText}]`,
          },
        ],
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: 'Operational query failed: ' + err.message,
          },
        ],
        isError: true,
      }
    }
  }
)

// 2. MCP Resource: Live Site Registry
server.resource(
  'sites-registry',
  'sitesync://sites',
  async (uri) => {
    const sites = await getCollectionDirect('sites')
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(sites, null, 2),
          mimeType: 'application/json',
        },
      ],
    }
  }
)

// 3. MCP Prompt: Diagnose Site Anomaly
server.prompt(
  'diagnose_site_shortage',
  { siteId: z.string().describe('Site ID to audit (e.g. SITE-002)') },
  ({ siteId }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Audit site ${siteId} for material stockout risks, equipment idle days, and budget overruns based on live PostgreSQL telemetry.`,
        },
      },
    ],
  })
)

// Connect via Stdio
const transport = new StdioServerTransport()
await server.connect(transport)
console.error('SiteSync MCP server running on stdio')
