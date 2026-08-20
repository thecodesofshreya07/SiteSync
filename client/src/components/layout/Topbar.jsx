import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import SiteSelector from './SiteSelector'
import { useRole } from '../../hooks/useRole'
import { useAlerts } from '../../hooks/useAlerts'
import { useSite } from '../../hooks/useSite'
import { ROLE_LIST, SEVERITY_STYLES } from '../../lib/constants'
import { cn, formatTime } from '../../lib/utils'
import { Link } from 'react-router-dom'

function RoleSelector() {
  const { role, setRole } = useRole()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-navy-800 hover:border-navy-600/30"
      >
        {role}
        <ChevronDown size={14} className={cn('text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-44 rounded-lg border border-surface-border bg-white p-1.5 shadow-pop">
          {ROLE_LIST.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r)
                setOpen(false)
              }}
              className={cn(
                'w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-surface-bg',
                r === role ? 'font-semibold text-teal-700' : 'text-navy-700'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationBell() {
  const { alerts } = useAlerts()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const pending = alerts.filter((a) => a.status === 'pending')

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-white text-navy-600 hover:border-navy-600/30"
      >
        <Bell size={16} />
        {pending.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-bold text-white">
            {pending.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-80 rounded-lg border border-surface-border bg-white shadow-pop">
          <div className="border-b border-surface-border px-3.5 py-2.5">
            <p className="text-sm font-semibold text-navy-900">AI Alerts</p>
            <p className="text-2xs text-navy-500">{pending.length} pending your review</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {pending.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-navy-500">No pending alerts right now.</p>
            )}
            {pending.map((a) => {
              const s = SEVERITY_STYLES[a.severity]
              return (
                <Link
                  key={a.id}
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-surface-bg"
                >
                  <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', s.dot)} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-medium text-navy-800">{a.title}</p>
                    <p className="mt-0.5 text-2xs text-navy-500">{formatTime(a.timestamp)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Topbar() {
  const { selectedSite } = useSite()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-surface-border bg-white px-5">
      <div className="flex items-center gap-3">
        <SiteSelector />
        <span className="hidden items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-800 sm:flex shadow-sm">
          <span className="h-2 w-2 rounded-full bg-teal-500 pulse-dot" />
          AI Monitoring Active
        </span>
      </div>
      <div className="flex items-center gap-3">
        <RoleSelector />
        <NotificationBell />
      </div>
    </header>
  )
}
