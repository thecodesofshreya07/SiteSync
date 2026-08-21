import { groq } from '../groqClient.js'
import { config } from '../config.js'
import { retrieve } from './retrieve.js'

const MODEL_NAME = config.groqModel || 'llama-3.3-70b-versatile'

/**
 * Execute RAG Assistant Query:
 * 1. Retrieve top-K relevant records with typo tolerance across all PostgreSQL tables.
 * 2. Synthesize a natural language grounded answer with Groq (llama-3.3-70b-versatile).
 * 3. Enforce strict { answer, sources } JSON schema so raw arrays/JSON are never returned.
 */
export async function runRagAssistant({ message, question, siteId, conversationHistory = [] }) {
  const query = (message || question || '').trim()
  if (!query) {
    return {
      answer: 'Please provide a valid question or operational query.',
      sources: [],
    }
  }

  // 1. Semantic + Typo-tolerant Retrieval
  const retrievedChunks = await retrieve(query, 6, siteId)

  const context = retrievedChunks
    .map((c) => `[${c.id}] (${c.type.toUpperCase()}) ${c.text}`)
    .join('\n\n')

  // 2. Structured System Prompt
  const systemPrompt = `You are the SiteSync Operations Assistant for a construction management platform.
Answer the user's question in clear, natural language using ONLY the operational context provided below.
Never output raw JSON, arrays, or data dumps — always write a proper sentence or short paragraph, the way a knowledgeable colleague would explain it.

Guidelines:
- Respond fluently in the language requested or used by the user (English, Hindi, or Hinglish).
- If the user asks a conversational question or asks to speak in a specific language (e.g. Hindi), greet them warmly in that language and offer assistance with site operations.
- All monetary values are in Indian Rupees (₹ / Lakhs / Crores).
- Clearly mention site names, item stock quantities, units, and status (e.g. Critical, Delay).
- If the user asks about an item at a specific site (e.g., Cement at Metro Heights), but the context shows Metro Heights has different items (e.g. Bricks/PVC) and Cement is stocked at other sites (e.g. Riverside Tower or Warehouse Expansion), explain that clearly.
- If the context doesn't contain enough information to answer confidently, say so plainly instead of guessing.

Context:
${context}

You MUST respond strictly in valid JSON format with the following schema:
{
  "answer": "<your natural language answer string with clear markdown formatting>",
  "sources": [
    {
      "type": "<one of: 'inventory', 'procurement', 'delivery', 'equipment', 'task', 'vendor', 'site', 'alert'>",
      "id": "<exact ID of the cited record, e.g. INV-104, PO-2041, SITE-003>",
      "label": "<short label, e.g. INV-104 (Cement Portland Type I)>"
    }
  ]
}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: query },
  ]

  let answer = ''
  let sources = []

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.2,
    })

    const rawContent = (completion.choices?.[0]?.message?.content || '').trim()

    let parsed = null

    // 1. Try direct JSON parse
    try {
      parsed = JSON.parse(rawContent)
    } catch (_) {}

    // 2. Try stripping markdown code fences
    if (!parsed) {
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      if (match) {
        try {
          parsed = JSON.parse(match[1].trim())
        } catch (_) {}
      }
    }

    // 3. Try finding substring bounded by { and }
    if (!parsed) {
      const firstBrace = rawContent.indexOf('{')
      const lastBrace = rawContent.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(rawContent.slice(firstBrace, lastBrace + 1))
        } catch (_) {}
      }
    }

    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.answer === 'string') {
        answer = parsed.answer
      } else if (typeof parsed.text === 'string') {
        answer = parsed.text
      } else {
        answer = JSON.stringify(parsed)
      }

      if (Array.isArray(parsed.sources)) {
        sources = parsed.sources
      }
    } else if (rawContent) {
      // If LLM returned direct natural language text without JSON envelope, use it directly!
      answer = rawContent
    }
  } catch (err) {
    console.error('=== [GROQ ERROR IN RAG ASSISTANT] ===')
    console.error('Error Message:', err.message)
    console.error('Error Status:', err.status || err.statusCode)
    console.error('Error Stack:', err.stack)
    console.error('======================================')

    // Fallback if Groq API network/service fails completely
    const topDoc = retrievedChunks[0]
    if (topDoc) {
      answer = `Based on current operational records: ${topDoc.text}`
      sources = [{ type: topDoc.type, id: topDoc.id, label: topDoc.label }]
    } else {
      answer = 'No matching operational records were found in the database for your query.'
      sources = []
    }

    return {
      answer,
      sources,
      error: `[Groq LLM Error: ${err.message}]`,
      retrievedCount: retrievedChunks.length,
    }
  }

  // Ensure source list is populated and matches retrieved records
  if (!sources || sources.length === 0) {
    const citedIds = retrievedChunks.filter((c) => answer.includes(c.id))
    if (citedIds.length > 0) {
      sources = citedIds.map((c) => ({
        type: c.type,
        id: c.id,
        label: c.label || c.id,
      }))
    } else if (retrievedChunks.length > 0) {
      sources = retrievedChunks.slice(0, 3).map((c) => ({
        type: c.type,
        id: c.id,
        label: c.label || c.id,
      }))
    }
  }

  return {
    answer,
    sources,
    retrievedCount: retrievedChunks.length,
  }
}
