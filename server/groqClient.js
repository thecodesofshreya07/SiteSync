import Groq from 'groq-sdk'
import { config } from './config.js'

const apiKey = process.env.GROQ_API_KEY || config.groqApiKey || ''

export const groq = new Groq({
  apiKey: apiKey || 'MISSING_GROQ_KEY',
})

export default groq
