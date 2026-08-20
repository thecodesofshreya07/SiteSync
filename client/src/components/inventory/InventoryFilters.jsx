import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

const STATUS_FILTERS = ['ALL', 'OK', 'LOW', 'CRITICAL']

export default function InventoryFilters({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative w-full sm:w-auto flex-1 min-w-[140px] sm:max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-lg border border-surface-border bg-white py-1.5 pl-8 pr-3 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-surface-border bg-white p-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              status === s ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
