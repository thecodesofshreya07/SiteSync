import { ShieldAlert } from 'lucide-react'
import AlertCard from './AlertCard'
import EmptyState from '../common/EmptyState'
import { useAlerts } from '../../hooks/useAlerts'

export default function AlertList({ siteId }) {
  const { alerts } = useAlerts()
  const siteAlerts = alerts.filter((a) => a.siteId === siteId)
  const openCount = siteAlerts.filter((a) => a.status === 'pending').length

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card font-public">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-public">AI Alerts</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 font-ibm">{openCount} open, awaiting your review</p>
        </div>
      </div>

      {siteAlerts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No alerts for this site"
          description="The agent hasn't flagged anything here in the current monitoring cycle."
        />
      ) : (
        <div className="space-y-2.5">
          {siteAlerts.map((alert, idx) => (
            <AlertCard key={alert.id} alert={alert} defaultExpanded={idx === 0 && alert.status === 'pending'} />
          ))}
        </div>
      )}
    </div>
  )
}
