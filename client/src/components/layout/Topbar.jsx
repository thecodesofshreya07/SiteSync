import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, Database, Cpu, UserCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import SiteSelector from './SiteSelector'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import { ROLES, SEVERITY_STYLES } from '../../lib/constants'
import { cn, formatTime } from '../../lib/utils'
import Badge from '../common/Badge'

const API_BASE = 'http://localhost:4000/api'
const ALLOWED_SITE_PATHS = ['/', '/inventory', '/procurement', '/tasks-equipment']

function DataSourceBadge() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let isMounted = true
    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`)
        if (res.ok) {
          if (isMounted) {
            setStatus('live')
          }
        } else {
          if (isMounted) setStatus('error')
        }
      } catch (err) {
        if (isMounted) setStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-300 px-2.5 py-1 text-xs font-bold text-red-700 shadow-xs shrink-0">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
        🔴 ERROR — Backend Unavailable
      </span>
    )
  }

  return (
    <div className="hidden sm:flex items-center gap-2 shrink-0">
      <span
        title="Connected to Supabase PostgreSQL"
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-2xs font-bold text-emerald-800 shadow-xs"
      >
        <Database size={11} className="text-emerald-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        LIVE: PostgreSQL
      </span>
      <span
        title="Agentic LLM powered by Groq"
        className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-300 px-2.5 py-0.5 text-2xs font-bold text-indigo-800 shadow-xs"
      >
        <Cpu size={11} className="text-indigo-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        AI: Groq (gpt-oss-120b)
      </span>
    </div>
  )
}

function UserIdentityBadge() {
  const { user } = useAuth()
  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs sm:text-sm font-medium text-navy-800 shadow-xs">
      <UserCheck size={15} className="text-teal-600 shrink-0" />
      <span className="truncate max-w-[100px] sm:max-w-[140px] font-semibold">{user?.name || 'User'}</span>
      <Badge tone="teal" className="text-2xs py-0.5 px-1.5">
        {user?.role || 'Guest'}
      </Badge>
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
        type="button"
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
        <div className="absolute right-0 z-30 mt-1.5 w-72 sm:w-80 rounded-lg border border-surface-border bg-white shadow-pop max-w-[calc(100vw-2rem)]">
          <div className="border-b border-surface-border px-3.5 py-2.5">
            <p className="text-sm font-semibold text-navy-900">AI Alerts</p>
            <p className="text-2xs text-navy-500">{pending.length} pending your review</p>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {pending.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-navy-500">No pending alerts in database.</p>
            )}
            {pending.map((a) => {
              const s = SEVERITY_STYLES[a.severity] || { dot: 'bg-amber-500' }
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

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const { user } = useAuth()

  const showSiteSelector = ALLOWED_SITE_PATHS.includes(location.pathname)
  const canViewAIAlerts = user?.role === ROLES.ADMIN || user?.role === ROLES.PROJECT_MANAGER

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-surface-border bg-white px-3 sm:px-5">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-white text-navy-700 hover:bg-surface-bg md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          {showSiteSelector && <SiteSelector />}
        </div>

        <DataSourceBadge />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <UserIdentityBadge />
        {canViewAIAlerts && <NotificationBell />}
      </div>
    </header>
  )
}
