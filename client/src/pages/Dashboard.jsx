import { useEffect, useState } from 'react'
import { IndianRupee, ListChecks, ShieldAlert, Gauge } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import BudgetOverview from '../components/dashboard/BudgetOverview'
import BudgetPredictionChart from '../components/dashboard/BudgetPredictionChart'
import AgentActivity from '../components/dashboard/AgentActivity'
import AlertList from '../components/dashboard/AlertList'
import ProjectTimeline from '../components/dashboard/ProjectTimeline'
import WeatherStrip from '../components/weather/WeatherStrip'
import Badge from '../components/common/Badge'
import { useSite } from '../hooks/useSite'
import { useRole } from '../hooks/useRole'
import { useAuth } from '../hooks/useAuth'
import { useAlerts } from '../hooks/useAlerts'
import { formatINR, percentage, formatDate, formatTime } from '../lib/utils'
import { API_BASE } from '../lib/api'

const STATUS_TONE = {
  'On Track': 'green',
  'At Risk': 'amber',
  Delayed: 'red',
}

export default function Dashboard() {
  const { selectedSite } = useSite()
  const { role } = useRole()
  const { user } = useAuth()
  const { alerts } = useAlerts()

  const [siteTasks, setSiteTasks] = useState([])
  const [siteEquipment, setSiteEquipment] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastScanTime, setLastScanTime] = useState(() => selectedSite?.lastScan || new Date().toISOString())

  const canViewAI = user?.role === 'Admin' || user?.role === 'Project Manager'

  useEffect(() => {
    setLastScanTime(selectedSite?.lastScan || new Date().toISOString())
  }, [selectedSite?.id, selectedSite?.lastScan])

  useEffect(() => {
    const handleScan = (e) => {
      if (!e.detail?.siteId || e.detail.siteId === selectedSite?.id) {
        setLastScanTime(e.detail?.timestamp || new Date().toISOString())
      }
    }
    window.addEventListener('sitesync_agent_scan', handleScan)
    return () => window.removeEventListener('sitesync_agent_scan', handleScan)
  }, [selectedSite?.id])

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
            {selectedSite.location} · <span className="text-slate-800 font-semibold">Viewing as {user?.role || role}</span>
          </p>
        </div>
        {canViewAI && (
          <div className="sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5 mb-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Agent Telemetry</p>
            </div>
            <p className="text-sm font-bold text-slate-800 font-ibm">
              {formatDate(lastScanTime)} · {formatTime(lastScanTime)}
            </p>
          </div>
        )}
      </div>

      {/* 7-Day Live Open-Meteo Weather Strip */}
      <div className="mb-5">
        <WeatherStrip siteId={selectedSite.id} />
      </div>

      {/* Top stats */}
      <div className={`mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 ${canViewAI ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
        {canViewAI && (
          <StatCard
            label="Open AI Alerts"
            value={openAlerts}
            sublabel={openAlerts > 0 ? 'awaiting review' : 'all clear'}
            icon={ShieldAlert}
            accent="amber"
          />
        )}
        <StatCard
          label="Equipment Utilization"
          value={`${avgUtilization}%`}
          sublabel={`${siteEquipment.length} units tracked`}
          icon={Gauge}
          accent="navy"
        />
      </div>

      {/* Main grid: budget prediction + agent activity */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className={canViewAI ? 'lg:col-span-3 min-w-0' : 'lg:col-span-5 min-w-0'}>
          <BudgetPredictionChart site={selectedSite} categoryData={categoryData} />
        </div>
        {canViewAI && (
          <div className="lg:col-span-2 min-w-0">
            <AgentActivity siteId={selectedSite.id} />
          </div>
        )}
      </div>

      {/* Alerts (Only for Admin & PM) */}
      {canViewAI && (
        <div className="mb-5">
          <AlertList siteId={selectedSite.id} />
        </div>
      )}

      {/* Timeline */}
      <ProjectTimeline phases={timeline} />
    </div>
  )
}
