import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, Database, Cpu, UserCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import SiteSelector from './SiteSelector'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import { ROLES, SEVERITY_STYLES } from '../../lib/constants'
import { cn, formatTime } from '../../lib/utils'
import Badge from '../common/Badge'

const ALLOWED_SITE_PATHS = [
  '/',
  '/dashboard',
  '/inventory',
  '/procurement',
  '/tasks-equipment',
  '/photo-progress',
  '/assistant',
  '/settings',
]

function UserIdentityBadge() {
  const { user } = useAuth()
  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-slate-50/80 hover:bg-slate-100/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-navy-800 transition-colors shadow-2xs font-public">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-2xs font-bold text-white uppercase">
        {(user?.name || user?.email || 'U').slice(0, 2)}
      </div>
      <span className="truncate max-w-[110px] sm:max-w-[160px] font-semibold text-slate-800 font-public">
        {user?.name || user?.email?.split('@')[0] || 'User'}
      </span>
      <Badge tone="teal" className="text-2xs py-0.5 px-2 uppercase font-bold tracking-wide font-ibm">
        {user?.role || 'Portal'}
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
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-navy-700 hover:bg-surface-bg cursor-pointer shadow-2xs transition-all"
        aria-label="Notifications"
      >
        <Bell size={17} className="text-slate-600" />
        {pending.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-2xs font-bold text-white shadow-xs">
            {pending.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-surface-border bg-white p-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
            <p className="text-sm font-bold text-navy-900 font-public">Operational Alerts</p>
            <span className="text-xs font-semibold text-teal-600 font-ibm">{pending.length} pending</span>
          </div>

          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
            {pending.length === 0 ? (
              <p className="py-6 text-center text-xs text-navy-500 font-ibm">All systems operating within parameters</p>
            ) : (
              pending.slice(0, 5).map((alert) => (
                <div key={alert.id} className="rounded-xl border border-surface-border bg-slate-50/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-navy-900 font-public">{alert.siteName || alert.siteId}</span>
                    <Badge tone={SEVERITY_STYLES[alert.severity]?.tone || 'neutral'} className="text-3xs uppercase font-ibm">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-navy-700 line-clamp-2 font-ibm">{alert.message || alert.issue}</p>
                  <p className="mt-1 text-3xs text-navy-400 font-ibm">{formatTime(alert.timestamp)}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-2.5 border-t border-surface-border pt-2 text-center">
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 font-public"
            >
              View Full Incident Ledger →
            </Link>
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
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-surface-border bg-white px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-white text-navy-700 hover:bg-surface-bg md:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          {showSiteSelector && <SiteSelector />}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <UserIdentityBadge />
        {canViewAIAlerts && <NotificationBell />}
      </div>
    </header>
  )
}
