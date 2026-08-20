import { Router } from 'express'
import { runMonitoringStream } from '../services/dashboardAgent.js'

const router = Router()

// GET /api/agent/stream?siteId=SITE-002 - SSE real-time streaming endpoint
router.get('/stream', async (req, res) => {
  const siteId = req.query.siteId || 'SITE-002'

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  // Flush headers
  if (res.flushHeaders) {
    res.flushHeaders()
  }

  await runMonitoringStream(siteId, res)
})

export default router
