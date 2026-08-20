import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './config.js'

const apiKey = config.geminiApiKey || 'MOCK_GEMINI_KEY'

export const ai = new GoogleGenerativeAI(apiKey)
export default ai
