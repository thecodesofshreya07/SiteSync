import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Mic, MicOff } from 'lucide-react'
import ChatMessage from './ChatMessage'
import SuggestedQuestions from './SuggestedQuestions'
import SourceRecordModal from '../common/SourceRecordModal'
import { cn } from '../../lib/utils'

const SUGGESTED_PROMPTS = [
  'What is the stock of Fe-550D TMT Steel Rebar at Riverside Tower?',
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

function getInitialMessages() {
  try {
    const raw = sessionStorage.getItem('sitesync_assistant_messages')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    // ignore
  }
  return [WELCOME]
}

export default function AssistantChat() {
  const [messages, setMessages] = useState(getInitialMessages)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [activeSource, setActiveSource] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem('sitesync_assistant_messages', JSON.stringify(messages))
    } catch (e) {
      // ignore
    }
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
        setInput(transcript)
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setListening(false)
      }

      recognition.onend = () => {
        setListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge.')
      return
    }

    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch (err) {
        console.warn('Speech recognition start notice:', err.message)
      }
    }
  }

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
          text: `AI Service Error: ${err.message}`,
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
            placeholder={listening ? 'Listening to your voice...' : 'Ask about sites, budgets, inventory, procurement...'}
            className={cn(
              'flex-1 rounded-lg border border-surface-border bg-white px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm transition-all',
              listening && 'border-red-400 ring-2 ring-red-400/30 bg-red-50/30'
            )}
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-teal-700 transition-colors shadow-xs',
              listening && 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse'
            )}
            title={listening ? 'Stop listening' : 'Voice search (Speech to Text)'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

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
