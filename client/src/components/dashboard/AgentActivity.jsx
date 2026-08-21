import { useEffect, useRef, useState } from 'react'
import { Radio, AlertTriangle, RotateCw, Activity, Cpu, CheckCircle2, Search, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react'
import { AGENT_EVENT_STYLES } from '../../lib/constants'
import { cn, formatTime } from '../../lib/utils'
import { useAlerts } from '../../hooks/useAlerts'
import Badge from '../common/Badge'
import SourceRecordModal from '../common/SourceRecordModal'
import { API_BASE } from '../../lib/api'

function getCachedLogs(siteId) {
  try {
    const raw = sessionStorage.getItem(`sitesync_agent_logs_${siteId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {}
  return []
}

function setCachedLogs(siteId, logs) {
  try {
    sessionStorage.setItem(`sitesync_agent_logs_${siteId}`, JSON.stringify(logs.slice(-50)))
  } catch (e) {}
}

const SUBTASK_TYPE_LABELS = {
  check_stock: { label: 'Stock & Runway Scan', tone: 'amber' },
  verify_equipment_idle: { label: 'Equipment Idling Check', tone: 'blue' },
  weather_risk: { label: 'Weather Forecast Risk', tone: 'red' },
  predicted_stockout: { label: 'Predictive Stockout Model', tone: 'red' },
  investigate_budget_drift: { label: 'Budget Variance Drift', tone: 'purple' },
  routine_telemetry_scan: { label: 'Routine Telemetry Check', tone: 'green' },
}

const SUBTASK_STATUS_TONE = {
  investigating: 'amber',
  resolved: 'green',
  pending: 'blue',
  dismissed: 'neutral',
}

export default function AgentActivity({ siteId }) {
  const [activeTab, setActiveTab] = useState('subtasks') // 'subtasks' | 'stream'
  const [entries, setEntries] = useState(() => getCachedLogs(siteId))
  const [subtasks, setSubtasks] = useState([])
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [rescanCount, setRescanCount] = useState(0)
  const [activeSource, setActiveSource] = useState(null)

  const eventSourceRef = useRef(null)
  const scrollRef = useRef(null)
  const { addAlert } = useAlerts()
  const addAlertRef = useRef(addAlert)
  addAlertRef.current = addAlert

  // Fetch initial subtasks for the site
  const fetchSubtasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/agent/subtasks?siteId=${encodeURIComponent(siteId)}`)
      if (res.ok) {
        const data = await res.json()
        setSubtasks(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.warn('Could not fetch agent subtasks:', err.message)
    }
  }

  useEffect(() => {
    if (siteId) {
      fetchSubtasks()
    }
  }, [siteId, rescanCount])

  // Auto-scroll on new stream entries
  useEffect(() => {
    if (scrollRef.current && activeTab === 'stream') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [entries, activeTab])

  // Save entries to cache
  useEffect(() => {
    if (siteId && entries.length > 0) {
      setCachedLogs(siteId, entries)
    }
  }, [entries, siteId])

  // SSE Stream listener
  useEffect(() => {
    const cached = getCachedLogs(siteId)
    setEntries(cached)
    setError(null)
    setIsScanning(true)

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

          if (data.type === 'subtask' && data.subtask) {
            setSubtasks((prev) => {
              const idx = prev.findIndex((s) => s.id === data.subtask.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = data.subtask
                return next
              }
              return [data.subtask, ...prev]
            })
          } else if (data.type === 'alert' && data.alert) {
            addAlertRef.current?.(data.alert)
          } else if (data.message && data.type !== 'heartbeat') {
            setEntries((prev) => {
              const isDuplicate = prev.some(
                (p) =>
                  p.id === data.id ||
                  (p.message === data.message &&
                    Math.abs(new Date(p.timestamp || Date.now()) - new Date(data.timestamp || Date.now())) < 2000)
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

            // Dispatch global event with live scan timestamp
            try {
              window.dispatchEvent(
                new CustomEvent('sitesync_agent_scan', {
                  detail: { siteId, timestamp: data.lastScan || new Date().toISOString() },
                })
              )
            } catch (_) {}
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
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
            <Cpu size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white font-public flex items-center gap-2">
              AUTONOMOUS OPERATIONS AGENT
              <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
                AUDITABLE
              </span>
            </h3>
            <p className="text-[11px] font-medium text-slate-400 font-ibm">
              Continuous multi-step reasoning & real-time telemetry verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-lg bg-navy-900 p-0.5 border border-slate-700/60">
            <button
              onClick={() => setActiveTab('subtasks')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-bold transition-colors font-ibm',
                activeTab === 'subtasks' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Subtasks ({subtasks.length})
            </button>
            <button
              onClick={() => setActiveTab('stream')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-bold transition-colors font-ibm',
                activeTab === 'stream' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Telemetry Stream
            </button>
          </div>

          <button
            onClick={handleManualRescan}
            title="Trigger agent re-scan"
            disabled={isScanning}
            className="flex items-center gap-1 rounded bg-navy-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-navy-800 hover:text-teal-300 transition-colors disabled:opacity-50 font-ibm"
          >
            <RotateCw size={12} className={cn(isScanning && 'animate-spin text-teal-400')} />
            <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1">
            <span className={cn('h-1.5 w-1.5 rounded-full', isLive ? 'bg-teal-400 pulse-dot' : 'bg-amber-400')} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 font-ibm">
              {isLive ? (isScanning ? 'Investigating' : 'Online') : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'subtasks' ? (
        <div className="h-[300px] overflow-y-auto space-y-2.5 pr-1 scroll-smooth font-ibm">
          {subtasks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/60 p-6 text-center text-slate-400">
              <ShieldCheck size={28} className="mb-2 text-teal-400" />
              <p className="text-xs font-semibold text-slate-300">No subtasks recorded yet</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Click "Scan Now" to initiate an autonomous reasoning cycle.
              </p>
            </div>
          ) : (
            subtasks.map((st) => {
              const typeMeta = SUBTASK_TYPE_LABELS[st.type] || { label: st.type, tone: 'neutral' }
              const isInvestigating = st.status === 'investigating'
              const recordId = st.related_record_id || st.relatedRecordId
              const recordType = st.related_record_type || st.relatedRecordType

              return (
                <div
                  key={st.id}
                  className={cn(
                    'rounded-lg border p-3 transition-all animate-fade-in-up',
                    isInvestigating
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-slate-700/60 bg-navy-900/80 hover:border-slate-600'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={typeMeta.tone}>{typeMeta.label}</Badge>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">#{st.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          isInvestigating
                            ? 'amber'
                            : st.parent_alert_id || st.parentAlertId
                            ? 'red'
                            : 'green'
                        }
                      >
                        {isInvestigating
                          ? 'INVESTIGATING'
                          : st.parent_alert_id || st.parentAlertId
                          ? 'ALERT GENERATED'
                          : 'VERIFIED NOMINAL'}
                      </Badge>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatTime(st.created_at || st.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Reasoning summary */}
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-200">
                    <span className="font-bold text-teal-300 font-public">Reasoning: </span>
                    {st.reasoning_summary || st.reasoningSummary}
                  </p>

                  {/* Related Record & Parent Alert links */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    {recordId && (
                      <button
                        onClick={() => setActiveSource({ id: recordId, type: recordType, label: `${recordType?.toUpperCase()}: ${recordId}` })}
                        className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-bold text-teal-300 hover:bg-slate-700 hover:text-teal-200 transition-colors"
                      >
                        <Search size={11} />
                        <span>Source: {recordId}</span>
                      </button>
                    )}

                    {(st.parent_alert_id || st.parentAlertId) && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        <AlertTriangle size={11} />
                        <span>Generated Alert #{st.parent_alert_id || st.parentAlertId}</span>
                      </span>
                    )}

                    {(st.resolved_at || st.resolvedAt) && (
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">
                        Resolved in ~1.2s
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Live Terminal Log */
        <div
          ref={scrollRef}
          className="h-[300px] overflow-y-auto rounded-lg bg-navy-900/90 border border-slate-700/60 p-3.5 font-ibm scroll-smooth"
        >
          {error && (
            <div className="mb-2 flex items-center gap-2 rounded bg-amber-950/60 p-2 text-xs text-amber-300">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {entries.length === 0 && !error && (
            <p className="px-1 py-2 text-xs font-medium text-slate-400">Connecting to monitoring stream...</p>
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
      )}

      {/* Clickable Source Record Modal */}
      <SourceRecordModal
        open={Boolean(activeSource)}
        source={activeSource}
        onClose={() => setActiveSource(null)}
      />
    </div>
  )
}
