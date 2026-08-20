import { groq } from '../groqClient.js'
import { config } from '../config.js'
import { retrieve } from './retrieve.js'

const MODEL_NAME = config.groqModel || 'openai/gpt-oss-120b'

/**
 * Execute RAG Assistant Query:
 * 1. Retrieve top-K relevant records with typo tolerance across all PostgreSQL tables.
 * 2. Synthesize a natural language grounded answer with Groq (gpt-oss-120b).
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
- All monetary values are in Indian Rupees (₹ / Lakhs / Crores).
- Clearly mention site names, item stock quantities, units, and status (e.g. Critical, Delay).
- If the user asks about an item at a specific site (e.g., Cement at Metro Heights), but the context shows Metro Heights has different items (e.g. Bricks/PVC) and Cement is stocked at other sites (e.g. Riverside Tower or Site B), explain that clearly.
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
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(rawContent)

    if (parsed.answer && typeof parsed.answer === 'string') {
      answer = parsed.answer
    } else if (typeof parsed === 'string') {
      answer = parsed
    } else {
      answer = JSON.stringify(parsed)
    }

    if (Array.isArray(parsed.sources)) {
      sources = parsed.sources
    }
  } catch (err) {
    console.error('Groq synthesis error in RAG Assistant:', err.message)

    // Robust fallback synthesis if Groq fails or rate limits
    const topDoc = retrievedChunks[0]
    if (topDoc) {
      answer = `Based on current operational records: ${topDoc.text}`
      sources = [{ type: topDoc.type, id: topDoc.id, label: topDoc.label }]
    } else {
      answer = 'No matching operational records were found in the database for your query.'
      sources = []
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
