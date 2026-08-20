import { Router } from 'express'
import { runRagAssistant } from '../rag/assistant.js'
import { readDb } from '../db.js'

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

// POST /api/assistant/chat (or POST /api/assistant) - Execute RAG + LLM synthesis
async function handleChat(req, res) {
  try {
    const { message, question, siteId, conversationHistory = [] } = req.body || {}
    const query = (message || question || '').trim()

    if (!query) {
      return res.status(400).json({ error: 'Message or question is required.' })
    }

    const result = await runRagAssistant({
      message: query,
      question: query,
      siteId,
      conversationHistory,
    })

    // Guaranteed { answer: string, sources: Array<{ type, id, label }> }
    return res.json({
      answer: result.answer,
      sources: result.sources || [],
    })
  } catch (err) {
    console.error('Assistant route error:', err.message)

    const statusCode = err.message?.includes('rate limit')
      ? 429
      : err.message?.includes('not configured')
      ? 503
      : 500

    return res.status(statusCode).json({
      answer: 'The assistant encountered an issue while processing your request. Please try again.',
      sources: [],
      error: err.message,
    })
  }
}

router.post('/chat', handleChat)
router.post('/', handleChat)

export default router
