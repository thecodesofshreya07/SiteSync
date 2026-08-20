import { Bell, FlaskConical, Radio, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import { useSite } from '../hooks/useSite'
import { useRole } from '../hooks/useRole'

function SettingRow({ icon: Icon, label, value, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border px-4 py-3.5 last:border-0 min-w-0">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-navy-500 mt-0.5 sm:mt-0">
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-navy-800 break-words">{label}</p>
          {value && <p className="text-xs text-navy-500 break-words">{value}</p>}
        </div>
      </div>
      {right && <div className="shrink-0 pl-11 sm:pl-0">{right}</div>}
    </div>
  )
}

export default function Settings() {
  const { selectedSite } = useSite()
  const { role } = useRole()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Demo environment and preferences" />

      <div className="max-w-xl space-y-5">
        <div className="rounded-xl border border-surface-border bg-white shadow-card">
          <SettingRow icon={ShieldCheck} label="Current Role" value="Controls visible navigation and workflows" right={<Badge tone="teal">{role}</Badge>} />
          <SettingRow icon={Radio} label="Current Site" value={selectedSite.location} right={<Badge tone="blue">{selectedSite.name}</Badge>} />
          <SettingRow
            icon={Bell}
            label="Notification Preferences"
            value="Critical and high-severity alerts"
            right={<Badge tone="green">Enabled</Badge>}
          />
          <SettingRow
            icon={Radio}
            label="AI Monitoring Status"
            value="Continuous background scan across all sites"
            right={<Badge tone="teal" dot>● Monitoring</Badge>}
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 min-w-0">
          <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800">Demo Environment</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700 break-words">
              This is a hackathon prototype running on static mock data. No real backend, database, or AI model
              is connected — the Agentic AI layer here is a simulated preview of the intended architecture.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
