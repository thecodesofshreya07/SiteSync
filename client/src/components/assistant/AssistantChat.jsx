import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import ChatMessage from './ChatMessage'
import SuggestedQuestions from './SuggestedQuestions'
import SourceRecordModal from '../common/SourceRecordModal'

const SUGGESTED_PROMPTS = [
  'What is the stock of Cement Portland Type I at Riverside Tower?',
  'Why is Site B at risk and what is causing the shortage?',
  'Which equipment is currently idle or under maintenance?',
  'What are the delayed deliveries and procurement purchase orders?',
]

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text:
    "Ask me about sites, budgets, inventory, procurement, equipment, or project progress. I'll dynamically query the live PostgreSQL operational database to answer.",
  sources: [],
}

export default function AssistantChat() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [activeSource, setActiveSource] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  async function send(question) {
    const q = question.trim()
    if (!q) return

    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: 'user', text: q, sources: [] }])
    setInput('')
    setThinking(true)

    try {
      const res = await fetch('http://localhost:4000/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || `Server returned ${res.status}`)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          text: data.answer || data.text || 'No response text received from agent.',
          sources: data.sources || [],
        },
      ])
    } catch (err) {
      console.error('Backend assistant error:', err.message)
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          text: `⚠️ AI Service Error: ${err.message}`,
          sources: [],
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col rounded-xl border border-surface-border bg-white shadow-card font-public">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onSourceClick={setActiveSource} />
        ))}
        {thinking && (
          <div className="flex items-center gap-2 pl-9 text-xs font-semibold text-teal-700 font-ibm">
            <Sparkles size={14} className="animate-pulse text-teal-600" />
            Querying PostgreSQL database and grounding response...
          </div>
        )}
      </div>

      <div className="border-t border-surface-border p-3.5 bg-slate-50/50">
        <div className="mb-3">
          <SuggestedQuestions questions={SUGGESTED_PROMPTS} onSelect={send} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sites, budgets, inventory, procurement..."
            className="flex-1 rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 shadow-sm transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <SourceRecordModal source={activeSource} onClose={() => setActiveSource(null)} />
    </div>
  )
}
