import { useEffect, useRef, useState } from 'react'
import { Radio, AlertTriangle, RotateCw } from 'lucide-react'
import { AGENT_EVENT_STYLES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useAlerts } from '../../hooks/useAlerts'
import { API_BASE } from '../../lib/api'

function getCachedLogs(siteId) {
  try {
    const raw = sessionStorage.getItem(`sitesync_agent_logs_${siteId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    // ignore
  }
  return []
}

function setCachedLogs(siteId, logs) {
  try {
    sessionStorage.setItem(`sitesync_agent_logs_${siteId}`, JSON.stringify(logs.slice(-50)))
  } catch (e) {
    // ignore
  }
}

export default function AgentActivityLog({ siteId }) {
  const [entries, setEntries] = useState(() => getCachedLogs(siteId))
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [rescanCount, setRescanCount] = useState(0)

  const eventSourceRef = useRef(null)
  const scrollRef = useRef(null)
  const { addAlert } = useAlerts()
  const addAlertRef = useRef(addAlert)
  addAlertRef.current = addAlert

  // Auto-scroll on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [entries])

  // Save entries to cache whenever updated
  useEffect(() => {
    if (siteId && entries.length > 0) {
      setCachedLogs(siteId, entries)
    }
  }, [entries, siteId])

  // Initialize or switch site
  useEffect(() => {
    const cached = getCachedLogs(siteId)
    setEntries(cached)
    setError(null)
    setIsScanning(true)

    // Also fetch historical logs if cache is empty
    if (cached.length === 0) {
      fetch(`${API_BASE}/agent/history?siteId=${encodeURIComponent(siteId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.logs && Array.isArray(data.logs) && data.logs.length > 0) {
            setEntries((prev) => (prev.length === 0 ? data.logs : prev))
          }
        })
        .catch(() => {})
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

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
            addAlertRef.current?.(data.alert)
          } else if (data.message && data.type !== 'heartbeat') {
            setEntries((prev) => {
              // Avoid exact duplicate consecutive message
              const isDuplicate = prev.some(
                (p) => p.id === data.id || (p.message === data.message && Math.abs(new Date(p.timestamp || Date.now()) - new Date(data.timestamp || Date.now())) < 2000)
              )
              if (isDuplicate) return prev

              const newEntry = {
                ...data,
                id: data.id || `${siteId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
              }
              return [...prev, newEntry]
            })

            if (data.type === 'resolved' || data.type === 'idle' || data.type === 'waiting') {
              setIsScanning(false)
            }
          }
        } catch (err) {
          console.warn('Error parsing SSE event:', err)
        }
      }

      es.onerror = () => {
        setIsLive(false)
        setIsScanning(false)
      }
    } catch (err) {
      console.error('EventSource connection error:', err)
      setError(`⚠️ SSE Connection: ${err.message}`)
      setIsLive(false)
      setIsScanning(false)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [siteId, rescanCount])

  const handleManualRescan = () => {
    setIsScanning(true)
    setRescanCount((c) => c + 1)
  }

  return (
    <div className="rounded-xl border border-surface-border bg-navy-950 p-5 shadow-card font-public">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={15} className="text-teal-400" />
          <h3 className="text-sm font-bold tracking-wider text-white font-public">AI OPERATIONS AGENT</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRescan}
            title="Trigger agent re-scan"
            disabled={isScanning}
            className="flex items-center gap-1 rounded bg-navy-800/80 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-navy-800 hover:text-teal-300 transition-colors disabled:opacity-50"
          >
            <RotateCw size={12} className={cn(isScanning && 'animate-spin text-teal-400')} />
            <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-teal-400 pulse-dot' : 'bg-amber-400')} />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-ibm">
              {isLive ? (isScanning ? 'Analyzing' : 'Live Active') : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="h-[280px] overflow-y-auto rounded-lg bg-navy-900/90 border border-slate-700/60 p-3.5 font-ibm scroll-smooth">
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
            const timeStr = e.timestamp
              ? (typeof e.timestamp === 'string' ? new Date(e.timestamp) : e.timestamp).toLocaleTimeString('en-IN', {
                  hour12: false,
                })
              : '--:--:--'

            return (
              <div key={e.id} className="flex animate-fade-in-up items-start gap-2.5 text-xs">
                <span className="mt-0.5 shrink-0 font-medium text-slate-400">{timeStr}</span>
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
                      : e.type === 'idle'
                      ? 'font-medium text-teal-200/90'
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
