import { Bot, User } from 'lucide-react'
import SourceCitation from './SourceCitation'
import { cn } from '../../lib/utils'

export default function ChatMessage({ message, onSourceClick }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-navy-900/10 text-navy-700' : 'bg-teal-500/15 text-teal-600'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={cn('max-w-[80%] rounded-xl px-4 py-3 font-public', isUser ? 'bg-navy-900 text-white' : 'bg-white border border-surface-border shadow-card')}>
        <p className={cn('whitespace-pre-line text-sm leading-relaxed font-ibm font-medium', isUser ? 'text-white' : 'text-slate-900')}>
          {message.text}
        </p>
        {message.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-border pt-2.5 font-public">
            {message.sources.map((s) => (
              <SourceCitation key={s.id} source={s} onClick={onSourceClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
