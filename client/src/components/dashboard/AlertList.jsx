import { useState } from 'react'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import AlertCard from './AlertCard'
import EmptyState from '../common/EmptyState'
import { useAlerts } from '../../hooks/useAlerts'
import { cn } from '../../lib/utils'

export default function AlertList({ siteId }) {
  const { alerts } = useAlerts()
  const [tab, setTab] = useState('active') // 'active' | 'resolved'

  const siteAlerts = alerts.filter((a) => a.siteId === siteId)
  const activeAlerts = siteAlerts.filter(
    (a) => a.status === 'pending' || a.status === 'transfer_requested'
  )
  const resolvedAlerts = siteAlerts.filter(
    (a) => a.status === 'approved' || a.status === 'resolved' || a.status === 'dismissed' || a.status === 'snoozed'
  )

  const displayedAlerts = tab === 'active' ? activeAlerts : resolvedAlerts

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card font-public">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-public">AI Alerts</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 font-ibm">
            {activeAlerts.length > 0
              ? `${activeAlerts.length} active, awaiting your review`
              : 'All alerts resolved & nominal'}
          </p>
        </div>

        {/* Active vs Resolved Tabs */}
        <div className="flex items-center rounded-lg bg-surface-bg p-1 border border-surface-border text-xs font-bold font-ibm">
          <button
            onClick={() => setTab('active')}
            className={cn(
              'rounded-md px-3 py-1 transition-colors',
              tab === 'active' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Active ({activeAlerts.length})
          </button>
          <button
            onClick={() => setTab('resolved')}
            className={cn(
              'rounded-md px-3 py-1 transition-colors',
              tab === 'resolved' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            Resolved ({resolvedAlerts.length})
          </button>
        </div>
      </div>

      {displayedAlerts.length === 0 ? (
        tab === 'active' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-teal-200 bg-teal-50/50 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 mb-2">
              <CheckCircle2 size={22} />
            </div>
            <p className="text-sm font-bold text-slate-900">Zero Open Anomalies</p>
            <p className="text-xs text-slate-600 font-ibm mt-1">
              All flagged items for this site have been reviewed, resolved, or approved.
            </p>
          </div>
        ) : (
          <EmptyState
            icon={ShieldAlert}
            title="No resolved alerts yet"
            description="Approved or dismissed alerts for this site will be archived here."
          />
        )
      ) : (
        <div className="space-y-2.5">
          {displayedAlerts.map((alert, idx) => (
            <AlertCard key={alert.id} alert={alert} defaultExpanded={tab === 'active' && idx === 0} />
          ))}
        </div>
      )}
    </div>
  )
}
