import Badge from '../common/Badge'
import DependencyBadge from './DependencyBadge'
import { formatDate } from '../../lib/utils'

const PRIORITY_TONE = {
  High: 'red',
  Medium: 'amber',
  Low: 'blue',
}

export default function TaskCard({ task }) {
  return (
    <div className="rounded-lg border border-surface-border bg-white p-3.5 shadow-card hover:border-slate-300 transition-colors">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug text-slate-900">{task.name}</p>
        <Badge tone={PRIORITY_TONE[task.priority] || 'neutral'} className="shrink-0">
          {task.priority}
        </Badge>
      </div>
      <p className="text-xs font-semibold text-slate-500">{task.assignee}</p>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Progress</span>
          <span className="font-bold text-slate-900">{task.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      <p className="mt-2.5 text-xs font-semibold text-slate-600">Due {formatDate(task.dueDate)}</p>

      <DependencyBadge dependency={task.dependency} />
    </div>
  )
}
