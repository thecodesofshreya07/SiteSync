import { useEffect, useRef, useState } from 'react'
import { Radio, AlertTriangle } from 'lucide-react'
import { AGENT_EVENT_STYLES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useAlerts } from '../../hooks/useAlerts'

const API_BASE = 'http://localhost:4000/api'

export default function AgentActivityLog({ siteId }) {
  const [entries, setEntries] = useState([])
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)
  const { addAlert } = useAlerts()

  useEffect(() => {
    // Reset state on site change
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setEntries([])
    setIsLive(false)
    setError(null)

    try {
      const sseUrl = `${API_BASE}/agent/stream?siteId=${encodeURIComponent(siteId)}`
      const es = new EventSource(sseUrl)
      eventSourceRef.current = es

      es.onopen = () => {
        setIsLive(true)
        setError(null)
      }

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setIsLive(true)

          if (data.type === 'alert' && data.alert) {
            if (addAlert) addAlert(data.alert)
          } else if (data.message) {
            setEntries((prev) => [
              ...prev,
              {
                ...data,
                id: `${siteId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                timestamp: new Date(),
              },
            ])
          }
        } catch (err) {
          console.warn('Error parsing SSE event:', err)
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        setIsLive(false)
        setError('⚠️ Live SSE stream disconnected from http://localhost:4000. Reconnecting on next scan.')
      }
    } catch (err) {
      console.error('EventSource connection error:', err)
      setError(`⚠️ SSE Connection failed: ${err.message}`)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [siteId, addAlert])

  return (
    <div className="rounded-xl border border-surface-border bg-navy-950 p-5 shadow-card font-public">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={15} className="text-teal-400" />
          <h3 className="text-sm font-bold tracking-wider text-white font-public">AI OPERATIONS AGENT</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1">
          <span className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-teal-400 pulse-dot' : 'bg-amber-400')} />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-ibm">
            {isLive ? 'Live Stream' : 'Connecting'}
          </span>
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto rounded-lg bg-navy-900/90 border border-slate-700/60 p-3.5 font-ibm">
        {error && (
          <div className="mb-2 flex items-center gap-2 rounded bg-amber-950/60 p-2 text-xs text-amber-300">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {entries.length === 0 && !error && (
          <p className="px-1 py-2 text-xs font-medium text-slate-400">Connecting to PostgreSQL monitoring stream...</p>
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
