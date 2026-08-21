import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true })
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true })

export const config = {
  port: process.env.PORT || 4000,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  dbPath: path.join(__dirname, 'data/db.json'),
  databaseUrl: process.env.DATABASE_URL || '',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'devsupport007@gmail.com',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'SiteSync Construction Ops',
  clientUrl: process.env.CLIENT_URL || 'https://site-sync-fawn.vercel.app',
}

