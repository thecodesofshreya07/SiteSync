import { cn } from '../../lib/utils'

const PRIORITIES = ['ALL', 'High', 'Medium', 'Low']

export default function TaskFilters({ priority, onPriorityChange }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-white p-1">
      {PRIORITIES.map((p) => (
        <button
          key={p}
          onClick={() => onPriorityChange(p)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            priority === p ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
