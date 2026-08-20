import { useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import TaskBoard from '../components/tasks/TaskBoard'
import TaskFilters from '../components/tasks/TaskFilters'
import EquipmentGrid from '../components/equipment/EquipmentGrid'
import { useSite } from '../hooks/useSite'
import { getTasksBySite } from '../data/tasks'
import { getEquipmentBySite } from '../data/equipment'
import { cn } from '../lib/utils'

const TABS = ['Tasks', 'Equipment']

export default function TasksEquipment() {
  const { selectedSite } = useSite()
  const [tab, setTab] = useState('Tasks')
  const [priority, setPriority] = useState('ALL')

  const tasks = getTasksBySite(selectedSite.id)
  const filteredTasks = priority === 'ALL' ? tasks : tasks.filter((t) => t.priority === priority)
  const equipment = getEquipmentBySite(selectedSite.id)

  return (
    <div>
      <PageHeader title="Tasks & Equipment" subtitle={`Operational status for ${selectedSite.name}`} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'Tasks' && <TaskFilters priority={priority} onPriorityChange={setPriority} />}
      </div>

      {tab === 'Tasks' ? <TaskBoard tasks={filteredTasks} /> : <EquipmentGrid equipment={equipment} />}
    </div>
  )
}
