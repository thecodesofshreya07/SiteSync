import { useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { getActivityScript } from '../../data/agentActivity'
import { AGENT_EVENT_STYLES } from '../../lib/constants'
import { cn } from '../../lib/utils'

export default function AgentActivityLog({ siteId }) {
  const [entries, setEntries] = useState([])
  const timeoutsRef = useRef([])

  useEffect(() => {
    // Reset and replay the activity script whenever the site changes.
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setEntries([])

    const script = getActivityScript(siteId)
    const now = Date.now()

    script.forEach((event, idx) => {
      const delay = idx * 550
      const t = setTimeout(() => {
        setEntries((prev) => [
          ...prev,
          { ...event, id: `${siteId}-${idx}`, timestamp: new Date(now + idx * 2000) },
        ])
      }, delay)
      timeoutsRef.current.push(t)
    })

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [siteId])

  const isMonitoring = true

  return (
    <div className="rounded-xl border border-surface-border bg-navy-950 p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={15} className="text-teal-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white">AI OPERATIONS AGENT</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 pulse-dot" />
          <span className="text-2xs font-bold uppercase tracking-wide text-teal-400">
            {isMonitoring ? 'Monitoring' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto rounded-lg bg-navy-900/90 border border-slate-700/60 p-3.5 font-mono">
        {entries.length === 0 && (
          <p className="px-1 py-2 text-xs font-medium text-slate-400">Initializing monitoring session...</p>
        )}
        <div className="space-y-2">
          {entries.map((e) => {
            const style = AGENT_EVENT_STYLES[e.type] || AGENT_EVENT_STYLES.checking
            return (
              <div key={e.id} className="flex animate-fade-in-up items-start gap-2.5 text-xs">
                <span className="mt-0.5 shrink-0 font-medium text-slate-400">
                  {e.timestamp.toLocaleTimeString('en-IN', { hour12: false })}
                </span>
                <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', style.dot)} />
                <span
                  className={cn(
                    'leading-relaxed font-medium',
                    e.type === 'flagged'
                      ? 'font-bold text-amber-300'
                      : e.type === 'resolved'
                      ? 'font-bold text-green-300'
                      : e.type === 'recommendation'
                      ? 'font-bold text-teal-300'
                      : e.type === 'waiting'
                      ? 'font-bold text-amber-200'
                      : 'text-slate-200'
                  )}
                >
                  {e.message}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
