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
import { getBudgetByCategory } from '../data/sites'
import { getTasksBySite, getTimelineBySite } from '../data/tasks'
import { getEquipmentBySite } from '../data/equipment'
import { formatINR, percentage, formatDate, formatTime } from '../lib/utils'

const STATUS_TONE = {
  'On Track': 'green',
  'At Risk': 'amber',
  Delayed: 'red',
}

export default function Dashboard() {
  const { selectedSite } = useSite()
  const { role } = useRole()
  const { alerts } = useAlerts()

  const siteTasks = getTasksBySite(selectedSite.id)
  const activeTasks = siteTasks.filter((t) => t.column !== 'Done').length
  const siteEquipment = getEquipmentBySite(selectedSite.id)
  const avgUtilization = siteEquipment.length
    ? Math.round(siteEquipment.reduce((sum, e) => sum + e.utilization, 0) / siteEquipment.length)
    : 0
  const openAlerts = alerts.filter((a) => a.siteId === selectedSite.id && a.status === 'pending').length
  const usedPct = percentage(selectedSite.budgetActual, selectedSite.budgetPlanned)
  const categoryData = getBudgetByCategory(selectedSite.id)
  const timeline = getTimelineBySite(selectedSite.id)

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">{selectedSite.name}</h1>
            <Badge tone={STATUS_TONE[selectedSite.status] || 'neutral'}>{selectedSite.status}</Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {selectedSite.location} · <span className="text-slate-800 font-semibold">Viewing as {role}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Agent Scan</p>
          <p className="text-sm font-bold text-slate-800">
            {formatDate(selectedSite.lastScan)} · {formatTime(selectedSite.lastScan)}
          </p>
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Budget Used"
          value={`${formatINR(selectedSite.budgetActual)} / ${formatINR(selectedSite.budgetPlanned)}`}
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
        <div className="lg:col-span-3">
          <BudgetOverview site={selectedSite} categoryData={categoryData} />
        </div>
        <div className="lg:col-span-2">
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
