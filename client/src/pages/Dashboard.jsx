import { useEffect, useState } from 'react'
import { IndianRupee, ListChecks, ShieldAlert, Gauge } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import BudgetOverview from '../components/dashboard/BudgetOverview'
import AgentActivityLog from '../components/dashboard/AgentActivityLog'
import AlertList from '../components/dashboard/AlertList'
import ProjectTimeline from '../components/dashboard/ProjectTimeline'
import Badge from '../components/common/Badge'
import { useSite } from '../hooks/useSite'
import { useRole } from '../hooks/useRole'
import { useAlerts } from '../hooks/useAlerts'
import { formatINR, percentage, formatDate, formatTime } from '../lib/utils'

const API_BASE = 'http://localhost:4000/api'

const STATUS_TONE = {
  'On Track': 'green',
  'At Risk': 'amber',
  Delayed: 'red',
}

export default function Dashboard() {
  const { selectedSite } = useSite()
  const { role } = useRole()
  const { alerts } = useAlerts()

  const [siteTasks, setSiteTasks] = useState([])
  const [siteEquipment, setSiteEquipment] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSite?.id) return

    let isMounted = true
    async function loadDashboardData() {
      try {
        setLoading(true)
        const [tasksRes, eqRes, budgetRes, timelineRes] = await Promise.all([
          fetch(`${API_BASE}/tasks?siteId=${encodeURIComponent(selectedSite.id)}`),
          fetch(`${API_BASE}/equipment?siteId=${encodeURIComponent(selectedSite.id)}`),
          fetch(`${API_BASE}/sites/${encodeURIComponent(selectedSite.id)}/budget`),
          fetch(`${API_BASE}/timeline?siteId=${encodeURIComponent(selectedSite.id)}`),
        ])

        if (isMounted) {
          if (tasksRes.ok) {
            const data = await tasksRes.json()
            setSiteTasks(Array.isArray(data) ? data : [])
          }
          if (eqRes.ok) {
            const data = await eqRes.json()
            setSiteEquipment(Array.isArray(data) ? data : [])
          }
          if (budgetRes.ok) {
            const data = await budgetRes.json()
            setCategoryData(Array.isArray(data) ? data : [])
          }
          if (timelineRes.ok) {
            const data = await timelineRes.json()
            setTimeline(Array.isArray(data) ? data : [])
          }
        }
      } catch (err) {
        console.warn('Error loading dashboard metrics from API:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [selectedSite?.id])

  const activeTasks = siteTasks.filter((t) => t.column !== 'Done').length
  const avgUtilization = siteEquipment.length
    ? Math.round(siteEquipment.reduce((sum, e) => sum + (e.utilization || 0), 0) / siteEquipment.length)
    : 0
  const openAlerts = alerts.filter((a) => a.siteId === selectedSite.id && a.status === 'pending').length
  const usedPct = percentage(selectedSite.budgetActual || 0, selectedSite.budgetPlanned || 1)

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">{selectedSite.name}</h1>
            <Badge tone={STATUS_TONE[selectedSite.status] || 'neutral'}>{selectedSite.status}</Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {selectedSite.location} · <span className="text-slate-800 font-semibold">Viewing as {role}</span>
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Agent Scan</p>
          <p className="text-sm font-bold text-slate-800">
            {formatDate(selectedSite.lastScan || new Date())} · {formatTime(selectedSite.lastScan || new Date())}
          </p>
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Budget Used"
          value={`${formatINR(selectedSite.budgetActual || 0)} / ${formatINR(selectedSite.budgetPlanned || 0)}`}
          sublabel={`${usedPct}% utilized`}
          icon={IndianRupee}
          accent="teal"
        />
        <StatCard
          label="Active Tasks"
          value={activeTasks}
          sublabel={`${siteTasks.length} total`}
          icon={ListChecks}
          accent="blue"
        />
        <StatCard
          label="Open AI Alerts"
          value={openAlerts}
          sublabel={openAlerts > 0 ? 'awaiting review' : 'all clear'}
          icon={ShieldAlert}
          accent="amber"
        />
        <StatCard
          label="Equipment Utilization"
          value={`${avgUtilization}%`}
          sublabel={`${siteEquipment.length} units tracked`}
          icon={Gauge}
          accent="navy"
        />
      </div>

      {/* Main grid: budget + agent activity */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 min-w-0">
          <BudgetOverview site={selectedSite} categoryData={categoryData} />
        </div>
        <div className="lg:col-span-2 min-w-0">
          <AgentActivityLog siteId={selectedSite.id} />
        </div>
      </div>

      {/* Alerts */}
      <div className="mb-5">
        <AlertList siteId={selectedSite.id} />
      </div>

      {/* Timeline */}
      <ProjectTimeline phases={timeline} />
    </div>
  )
}
