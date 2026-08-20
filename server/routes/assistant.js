import { Router } from 'express'
import { runAgent } from '../services/agent.js'
import { getCollection, readDb } from '../db.js'

const router = Router()

// GET /api/assistant/status - Check assistant availability
router.get('/status', (req, res) => {
  const hasKey = Boolean(process.env.GROQ_API_KEY)
  res.json({
    status: 'ok',
    provider: 'Groq',
    model: 'openai/gpt-oss-120b',
    configured: hasKey,
  })
})

// GET /api/assistant/activity - Activity script for live log
router.get('/activity', (req, res) => {
  const { siteId = 'SITE-002' } = req.query
  const db = readDb()
  const activity = db.agentActivity || {}
  res.json(activity[siteId] || activity['SITE-002'] || [])
})

// POST /api/assistant/chat (or POST /api/assistant) - Execute Agentic loop
async function handleChat(req, res) {
  try {
    const { message, question, siteId, conversationHistory = [] } = req.body || {}
    const query = (message || question || '').trim()

    if (!query) {
      return res.status(400).json({ error: 'Message or question is required.' })
    }

    const result = await runAgent({
      message: query,
      siteId,
      conversationHistory,
    })

    return res.json(result)
  } catch (err) {
    console.error('Agent route error:', err.message)

    // Sanitize error response without leaking keys or internal traces
    const statusCode = err.message?.includes('rate limit')
      ? 429
      : err.message?.includes('not configured')
      ? 503
      : 500

    return res.status(statusCode).json({
      error: 'Agent query failed',
      message: err.message || 'An error occurred during agent execution.',
    })
  }
}

router.post('/chat', handleChat)
router.post('/', handleChat)

export default router
