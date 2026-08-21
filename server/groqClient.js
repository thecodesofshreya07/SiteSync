import Groq from 'groq-sdk'
import { config } from './config.js'

export function getGroqClient() {
  const apiKey = (process.env.GROQ_API_KEY || config.groqApiKey || '').trim()
  return new Groq({
    apiKey: apiKey || 'MISSING_GROQ_KEY',
  })
}

export const groq = new Proxy({}, {
  get(target, prop) {
    const client = getGroqClient()
    const val = client[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

export default groq
