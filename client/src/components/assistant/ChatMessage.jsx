import { useState } from 'react'
import { Bot, User, Volume2, VolumeX } from 'lucide-react'
import SourceCitation from './SourceCitation'
import { cn } from '../../lib/utils'

export default function ChatMessage({ message, onSourceClick }) {
  const isUser = message.role === 'user'
  const [speaking, setSpeaking] = useState(false)

  const toggleSpeak = () => {
    if (!window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    } else {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(message.text)
      utterance.rate = 1.05
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className={cn('flex gap-2.5 min-w-0', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
          isUser ? 'bg-navy-900/10 text-navy-700' : 'bg-teal-500/15 text-teal-600'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={cn(
          'relative max-w-[90%] sm:max-w-[80%] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 font-public min-w-0 break-words group',
          isUser ? 'bg-navy-900 text-white' : 'bg-white border border-surface-border shadow-card'
        )}
      >
        {!isUser && message.text && (
          <button
            type="button"
            onClick={toggleSpeak}
            className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors opacity-80 group-hover:opacity-100"
            title={speaking ? 'Stop speech audio' : 'Listen to response'}
          >
            {speaking ? <VolumeX size={14} className="text-red-500 animate-pulse" /> : <Volume2 size={14} />}
          </button>
        )}
        <p className={cn('whitespace-pre-line text-xs sm:text-sm leading-relaxed font-ibm font-medium break-words pr-6', isUser ? 'text-white' : 'text-slate-900')}>
          {message.text}
        </p>
        {message.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2 border-t border-surface-border pt-2.5 font-public">
            {message.sources.map((s) => (
              <SourceCitation key={s.id} source={s} onClick={onSourceClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
