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
<<<<<<< HEAD
const API_BASE = 'http://127.0.0.1:5000/api'
=======
const API_BASE = 'http://localhost:4000/api'
>>>>>>> ab99af4f5a0b5b66a1c8ec9e535c54a0d8e7d613

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
      console.log('🔄 [Tasks & Equipment] Attempting API fetch for site:', selectedSite.id)
      try {
        const [tasksRes, equipmentRes] = await Promise.all([
          fetch(`${API_BASE}/tasks?siteId=${selectedSite.id}`),
          fetch(`${API_BASE}/equipment?siteId=${selectedSite.id}`),
        ])

        if (!tasksRes.ok || !equipmentRes.ok) {
          throw new Error('API server returned HTTP error status')
        }

        const tasksData = await tasksRes.json()
        const equipmentData = await equipmentRes.json()

        if (isMounted) {
          console.log('✅ [Tasks & Equipment] Successfully loaded from backend API!', { tasks: tasksData.length, equipment: equipmentData.length })
          setTasks(tasksData)
          setEquipment(equipmentData)
          setLoading(false)
        }
      } catch (err) {
        console.error('⚠️ [Tasks & Equipment] API fetch failed — using local fallback mock data:', err.message || err)
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
