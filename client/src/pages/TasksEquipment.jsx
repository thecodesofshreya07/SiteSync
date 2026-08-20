import { useState, useEffect } from 'react'
import PageHeader from '../components/common/PageHeader'
import TaskBoard from '../components/tasks/TaskBoard'
import TaskFilters from '../components/tasks/TaskFilters'
import EquipmentGrid from '../components/equipment/EquipmentGrid'
import LoadingState from '../components/common/LoadingState'
import { useSite } from '../hooks/useSite'
import { getTasksBySite } from '../data/tasks'
import { getEquipmentBySite } from '../data/equipment'
import { cn } from '../lib/utils'

const TABS = ['Tasks', 'Equipment']
const API_BASE = 'http://localhost:5000/api'

export default function TasksEquipment() {
  const { selectedSite } = useSite()
  const [tab, setTab] = useState('Tasks')
  const [priority, setPriority] = useState('ALL')

  const [tasks, setTasks] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const fetchOperationalData = async () => {
      try {
        const [tasksRes, equipmentRes] = await Promise.all([
          fetch(`${API_BASE}/tasks?siteId=${selectedSite.id}`),
          fetch(`${API_BASE}/equipment?siteId=${selectedSite.id}`),
        ])

        if (!tasksRes.ok || !equipmentRes.ok) {
          throw new Error('API server returned error status')
        }

        const tasksData = await tasksRes.json()
        const equipmentData = await equipmentRes.json()

        if (isMounted) {
          setTasks(tasksData)
          setEquipment(equipmentData)
          setLoading(false)
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to mock data:', err)
        if (isMounted) {
          setTasks(getTasksBySite(selectedSite.id))
          setEquipment(getEquipmentBySite(selectedSite.id))
          setLoading(false)
        }
      }
    }

    fetchOperationalData()

    return () => {
      isMounted = false
    }
  }, [selectedSite.id])

  const filteredTasks = priority === 'ALL' ? tasks : tasks.filter((t) => t.priority === priority)

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

      {loading ? (
        <LoadingState label="Loading operational status..." />
      ) : tab === 'Tasks' ? (
        <TaskBoard tasks={filteredTasks} />
      ) : (
        <EquipmentGrid equipment={equipment} />
      )}
    </div>
  )
}
