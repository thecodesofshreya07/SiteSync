import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

const ROLE_FILTERS = ['ALL', 'Product Manager', 'Contractor']
const STATUS_FILTERS = ['ALL', 'Active', 'Not Active']

export default function UserFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input by Name / Email / Phone */}
      <div className="relative w-full sm:w-72">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-full rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Filter by Role */}
        <div className="flex items-center rounded-lg border border-surface-border bg-white p-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => onRoleFilterChange(r)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors font-public',
                roleFilter === r
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Filter by Status */}
        <div className="flex items-center rounded-lg border border-surface-border bg-white p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors font-public',
                statusFilter === s
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
