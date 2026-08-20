import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ListChecks,
  MessageSquareText,
  Settings,
  Building2,
  Users,
  X,
} from 'lucide-react'
import { useRole } from '../../hooks/useRole'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', to: '/inventory', label: 'Inventory', icon: Boxes },
  { key: 'procurement', to: '/procurement', label: 'Procurement', icon: ShoppingCart },
  { key: 'tasks-equipment', to: '/tasks-equipment', label: 'Tasks & Equipment', icon: ListChecks },
  { key: 'assistant', to: '/assistant', label: 'Assistant', icon: MessageSquareText },
  { key: 'settings', to: '/settings', label: 'Settings', icon: Settings },
  { key: 'user-management', to: '/user-management', label: 'User Management', icon: Users },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { role, allowedRoutes } = useRole()

  const navContent = (
    <>
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
            <Building2 size={20} strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-base font-bold leading-none text-white tracking-tight">SiteSync</p>
            <p className="mt-1.5 text-xs font-semibold leading-none text-teal-400/90">AI Construction Ops</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen?.(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="mt-3 flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => allowedRoutes.includes(item.key)).map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon size={18} strokeWidth={2.2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/25 text-xs font-bold text-teal-300">
            SM
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Shreya Mishra</p>
            <p className="truncate text-xs font-medium text-slate-400">{role}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar (Preserved exactly) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-950 md:flex">
        {navContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen?.(false)}
          />
          {/* Drawer Content */}
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-navy-950 shadow-2xl z-10 animate-fade-in-right">
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
