import { AlertTriangle } from 'lucide-react'
import EquipmentStatusBadge from './EquipmentStatusBadge'
import { cn } from '../../lib/utils'

export default function EquipmentCard({ eq }) {
  const taskLabel = eq.assignedTaskName || eq.assignedTask || (eq.status === 'Idle' ? 'No active task assigned' : 'General Site Operations')

  return (
    <div className="rounded-lg border border-surface-border bg-white p-4 shadow-card hover:border-slate-300 transition-colors">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-base font-bold text-slate-900">{eq.name}</p>
        <EquipmentStatusBadge status={eq.status} />
      </div>
      <p className="text-xs font-semibold text-slate-500">{eq.category}</p>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Utilization</span>
          <span className="font-bold text-slate-900">{eq.utilization}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full', eq.utilization < 50 ? 'bg-amber-500' : 'bg-teal-500')}
            style={{ width: `${eq.utilization}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-600">
        Assigned: {taskLabel}
      </p>

      {eq.idleDays > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-bold text-amber-800">
          <AlertTriangle size={13} />
          IDLE FOR {eq.idleDays} DAY{eq.idleDays !== 1 ? 'S' : ''}
        </div>
      )}
    </div>
  )
}
