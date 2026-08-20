import { useMemo } from 'react'
import EmptyState from '../common/EmptyState'
import { CalendarRange } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'

const STATUS_COLOR = {
  Done: 'bg-green-500',
  'In Progress': 'bg-teal-500',
  'Not Started': 'bg-navy-600/25',
}

const STATUS_TEXT = {
  Done: 'text-green-600',
  'In Progress': 'text-teal-600',
  'Not Started': 'text-navy-400',
}

export default function ProjectTimeline({ phases }) {
  const { minDate, maxDate } = useMemo(() => {
    if (!phases.length) return { minDate: new Date(), maxDate: new Date() }
    const starts = phases.map((p) => new Date(p.start).getTime())
    const ends = phases.map((p) => new Date(p.end).getTime())
    return { minDate: new Date(Math.min(...starts)), maxDate: new Date(Math.max(...ends)) }
  }, [phases])

  const totalSpan = maxDate.getTime() - minDate.getTime() || 1

  function barStyle(phase) {
    const start = new Date(phase.start).getTime()
    const end = new Date(phase.end).getTime()
    const left = ((start - minDate.getTime()) / totalSpan) * 100
    const width = ((end - start) / totalSpan) * 100
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` }
  }

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-navy-900">Project Timeline</h3>
        <p className="mt-0.5 text-xs text-navy-500">
          {formatDate(minDate)} — {formatDate(maxDate)}
        </p>
      </div>

      {phases.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No timeline data" description="This site has no phase schedule yet." />
      ) : (
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="flex items-center gap-3">
              <div className="w-28 shrink-0 sm:w-36">
                <p className="truncate text-xs font-medium text-navy-800">{phase.name}</p>
                <p className={cn('text-2xs font-medium', STATUS_TEXT[phase.status])}>{phase.status}</p>
              </div>
              <div className="relative h-6 flex-1 rounded-md bg-surface-bg">
                <div
                  className="absolute top-0 h-6 overflow-hidden rounded-md border border-black/5"
                  style={barStyle(phase)}
                >
                  <div className={cn('h-full opacity-25', STATUS_COLOR[phase.status])} />
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-md', STATUS_COLOR[phase.status])}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              </div>
              <div className="w-10 shrink-0 text-right text-2xs font-semibold tabular-nums text-navy-600">
                {phase.progress}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
