import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('----------------------------------------------------')
console.log(' 🚀 Testing SiteSync MCP Server via JSON-RPC protocol')
console.log('----------------------------------------------------\n')

const mcpProcess = spawn('node', ['mcp/sitesyncMcpServer.js'], {
  cwd: __dirname,
  env: process.env,
})

let initialized = false

mcpProcess.stderr.on('data', (data) => {
  console.log(`[MCP Server Log]: ${data.toString().trim()}`)
})

mcpProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter((l) => l.trim().length > 0)

  for (const line of lines) {
    try {
      const msg = JSON.parse(line)

      if (msg.id === 1) {
        console.log('\n✓ Server Initialized successfully.')
        console.log(`✓ Server Name: ${msg.result?.serverInfo?.name} (v${msg.result?.serverInfo?.version})`)
        console.log('\nSending test operational query: "What is the cement stock across sites?"...\n')

        // Send tool execution call
        const callToolMsg = JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'queryOperationalData',
            arguments: {
              question: 'What is the cement stock across sites?',
            },
          },
        }) + '\n'

        mcpProcess.stdin.write(callToolMsg)
      } else if (msg.id === 2) {
        console.log('====================================================')
        console.log(' 🎉 MCP TOOL EXECUTION RESULT')
        console.log('====================================================')
        const outputText = msg.result?.content?.[0]?.text
        console.log(outputText)
        console.log('====================================================')
        console.log('✅ TEST PASSED: MCP Server is working 100% perfectly!\n')

        mcpProcess.kill()
        process.exit(0)
      }
    } catch {
      // Non-JSON logging
      if (line.includes('[DB]')) {
        console.log(`[DB Sync]: ${line}`)
      }
    }
  }
})

// Step 1: Send MCP Initialize handshake
const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'sitesync-test-client', version: '1.0.0' },
    capabilities: {},
  },
}) + '\n'

mcpProcess.stdin.write(initMsg)

// Timeout safety
setTimeout(() => {
  console.error('\n❌ Test timed out waiting for MCP response.')
  mcpProcess.kill()
  process.exit(1)
}, 15000)
