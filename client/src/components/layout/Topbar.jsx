import { useState, useRef, useEffect } from 'react'
import { Bell, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import SiteSelector from './SiteSelector'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import { ROLES, SEVERITY_STYLES } from '../../lib/constants'
import { formatTime } from '../../lib/utils'
import Badge from '../common/Badge'
import LanguageToggle from '../common/LanguageToggle'

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
        className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-navy-700 hover:bg-surface-bg cursor-pointer shadow-2xs transition-all"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-slate-600" />
        {pending.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-2xs font-bold text-white shadow-xs">
            {pending.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 sm:w-96 rounded-2xl border border-surface-border bg-white p-3 shadow-2xl">
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
    <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-surface-border bg-white px-2.5 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 max-w-[50%] sm:max-w-none">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-white text-navy-700 hover:bg-surface-bg md:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        <div className="min-w-0 flex-1">
          {showSiteSelector && <SiteSelector />}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <LanguageToggle />
        {canViewAIAlerts && <NotificationBell />}
      </div>
    </header>
  )
}
