import groq from '../groqClient.js'
import { config } from '../config.js'
import { AGENT_TOOLS, executeTool } from './tools.js'

const MODEL_NAME = 'openai/gpt-oss-120b'
const MAX_AGENT_STEPS = 6

const SYSTEM_PROMPT = `You are SiteSync AI Operations Agent, an intelligent construction management and operations assistant.
You help project managers, contractors, and site engineers monitor budgets, inventory, procurement, equipment, deliveries, vendor performance, and task risks.

Core Principles:
1. Always ground your answers in actual operational records by calling the provided tools.
2. If you need data, call the appropriate tool(s) first. You can call multiple tools across steps if needed.
3. Be concise, direct, and factual. When mentioning items, cite the relevant record IDs (such as PO-2041, INV-104, TC-04, DEL-882, VEN-017, TASK-031, SITE-002) in your text.
4. Format your final answers cleanly with structured bullet points, numbers, and clear financial/operational insights in Indian Rupee (₹ Lakhs / ₹ Crores) where appropriate.`

/**
 * Extract source record objects from tool results or final text
 */
function extractSourceCitations(text, toolOutputs, accumulatedSources) {
  const sourcesMap = new Map()

  // Pre-seed already accumulated sources
  accumulatedSources.forEach((s) => {
    if (s && s.id) sourcesMap.set(s.id, s)
  })

  // Normalize all dashes/hyphens in text for standard regex matching
  const normalizedText = (text || '').replace(/[\u2010-\u2015\u2212]/g, '-')

  // 1. Check text for known ID patterns
  const poMatches = normalizedText.match(/PO-\d+/gi) || []
  poMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'procurement', id: cleanId, label: cleanId })
  })

  const invMatches = normalizedText.match(/INV-\d+/gi) || []
  invMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'inventory', id: cleanId, label: cleanId })
  })

  const delMatches = normalizedText.match(/DEL-\d+/gi) || []
  delMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'delivery', id: cleanId, label: cleanId })
  })

  const eqMatches = normalizedText.match(/EQ-\d+/gi) || []
  eqMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'equipment', id: cleanId, label: cleanId })
  })

  const venMatches = normalizedText.match(/VEN-\d+/gi) || []
  venMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'vendor', id: cleanId, label: 'Vendor Record' })
  })

  const taskMatches = normalizedText.match(/TASK-\d+/gi) || []
  taskMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'task', id: cleanId, label: cleanId })
  })

  const siteMatches = normalizedText.match(/SITE-\d+/gi) || []
  siteMatches.forEach((id) => {
    const cleanId = id.toUpperCase()
    sourcesMap.set(cleanId, { type: 'site', id: cleanId, label: 'Budget Record' })
  })

  return Array.from(sourcesMap.values())
}

/**
 * Main SiteSync Agent execution loop using Groq openai/gpt-oss-120b
 */
export async function runAgent({ message, siteId, conversationHistory = [] }) {
  const apiKey = process.env.GROQ_API_KEY || config.groqApiKey

  if (!apiKey || apiKey === 'MISSING_GROQ_KEY') {
    throw new Error('GROQ_API_KEY is not configured on the backend server.')
  }

  const promptPrefix = siteId ? `[Context: Active Site is ${siteId}]\n` : ''
  const initialUserMessage = `${promptPrefix}${message}`

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text || m.content || '',
    })),
    { role: 'user', content: initialUserMessage },
  ]

  const accumulatedSources = []
  const toolsUsed = []
  const toolOutputs = []

  let step = 0
  while (step < MAX_AGENT_STEPS) {
    step++

    let response
    try {
      response = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
        temperature: 0.1,
      })
    } catch (err) {
      console.error(`[Groq API Error in step ${step}]:`, err.message)
      if (err.status === 401 || err.message?.includes('401') || err.message?.includes('Invalid API Key')) {
        throw new Error('Authentication failed with Groq API. Please verify the GROQ_API_KEY.')
      }
      if (err.status === 429 || err.message?.includes('429') || err.message?.includes('rate limit')) {
        throw new Error('Groq API rate limit exceeded. Please retry in a moment.')
      }
      throw new Error(`Groq LLM service error: ${err.message}`)
    }

    const choice = response?.choices?.[0]?.message
    if (!choice) {
      throw new Error('Received an empty response from Groq assistant.')
    }

    // Check if the assistant called tools
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      messages.push(choice)

      for (const toolCall of choice.tool_calls) {
        const toolName = toolCall.function?.name
        toolsUsed.push(toolName)

        let parsedArgs = {}
        if (toolCall.function?.arguments) {
          try {
            parsedArgs =
              typeof toolCall.function.arguments === 'string'
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments
          } catch (parseErr) {
            console.warn(`[Agent] Malformed arguments for ${toolName}:`, toolCall.function.arguments)
            parsedArgs = {}
          }
        }

        // If siteId is active and not provided in args, pass context
        if (siteId && !parsedArgs.siteId && toolName !== 'get_vendors' && toolName !== 'get_deliveries') {
          parsedArgs.siteId = siteId
        }

        let toolResult
        try {
          toolResult = await executeTool(toolName, parsedArgs)
          toolOutputs.push({ toolName, result: toolResult })
        } catch (execErr) {
          console.warn(`[Agent] Tool execution failed for ${toolName}:`, execErr.message)
          toolResult = { error: `Tool execution failed: ${execErr.message}` }
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(toolResult),
        })
      }
    } else {
      // Model returned final answer
      const finalAnswer = choice.content || 'Analysis complete based on current site records.'
      const finalSources = extractSourceCitations(finalAnswer, toolOutputs, accumulatedSources)

      return {
        answer: finalAnswer,
        sources: finalSources,
        toolsUsed: Array.from(new Set(toolsUsed)),
      }
    }
  }

  // Fallback if loop exceeded max steps
  const lastMsg = messages[messages.length - 1]
  const finalAnswer =
    typeof lastMsg?.content === 'string'
      ? lastMsg.content
      : 'Completed analysis across operational databases.'
  const finalSources = extractSourceCitations(finalAnswer, toolOutputs, accumulatedSources)

  return {
    answer: finalAnswer,
    sources: finalSources,
    toolsUsed: Array.from(new Set(toolsUsed)),
  }
}
