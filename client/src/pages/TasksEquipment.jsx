import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import TaskBoard from '../components/tasks/TaskBoard'
import TaskFilters from '../components/tasks/TaskFilters'
import EquipmentGrid from '../components/equipment/EquipmentGrid'
import LoadingState from '../components/common/LoadingState'
import { useSite } from '../hooks/useSite'
import { cn } from '../lib/utils'

const TABS = ['Tasks', 'Equipment']
const API_BASE = 'http://127.0.0.1:5000/api'

export default function TasksEquipment() {
  const { selectedSite } = useSite()
  const [tab, setTab] = useState('Tasks')
  const [priority, setPriority] = useState('ALL')

  const [tasks, setTasks] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchOperationalData = async () => {
      try {
        const [tasksRes, equipmentRes] = await Promise.all([
          fetch(`${API_BASE}/tasks?siteId=${encodeURIComponent(selectedSite.id)}`),
          fetch(`${API_BASE}/equipment?siteId=${encodeURIComponent(selectedSite.id)}`),
        ])

        if (!tasksRes.ok || !equipmentRes.ok) {
          throw new Error('API server returned HTTP error status')
        }

        const tasksData = await tasksRes.json()
        const equipmentData = await equipmentRes.json()

        if (isMounted) {
          setTasks(Array.isArray(tasksData) ? tasksData : [])
          setEquipment(Array.isArray(equipmentData) ? equipmentData : [])
          setLoading(false)
        }
      } catch (err) {
        console.error('Tasks & Equipment API fetch error:', err.message)
        if (isMounted) {
          setError(`⚠️ API error fetching operational data: ${err.message}`)
          setTasks([])
          setEquipment([])
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

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
        <LoadingState label="Loading operational status from PostgreSQL..." />
      ) : tab === 'Tasks' ? (
        tasks.length === 0 && !error ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
            No tasks exist for {selectedSite.name}.
          </div>
        ) : (
          <TaskBoard tasks={filteredTasks} />
        )
      ) : equipment.length === 0 && !error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
          No equipment records exist for {selectedSite.name}.
        </div>
      ) : (
        <EquipmentGrid equipment={equipment} />
      )}
    </div>
  )
}
