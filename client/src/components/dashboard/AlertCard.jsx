import { useState } from 'react'
import { ChevronDown, Check, X, Clock3, FileSearch, AlertTriangle, Send, CheckCircle2 } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import SourceRecordModal from '../common/SourceRecordModal'
import { SEVERITY_STYLES, ALERT_STATUS } from '../../lib/constants'
import { cn, formatTime } from '../../lib/utils'
import { useAlerts } from '../../hooks/useAlerts'
import { useSite } from '../../hooks/useSite'

const STATUS_BADGE = {
  pending: { tone: 'amber', label: 'PENDING HUMAN REVIEW' },
  approved: { tone: 'green', label: '✓ APPROVED BY YOU' },
  dismissed: { tone: 'neutral', label: 'DISMISSED' },
  snoozed: { tone: 'blue', label: 'SNOOZED' },
  transfer_requested: { tone: 'blue', label: '⏳ TRANSFER REQUESTED · AWAITING SOURCE APPROVAL' },
  transfer_rejected: { tone: 'red', label: '✕ TRANSFER DECLINED BY SOURCE SITE' },
  resolved: { tone: 'green', label: '✓ RESOLVED & TRANSFERRED' },
}

export default function AlertCard({ alert, defaultExpanded = false }) {
  const { updateAlertStatus } = useAlerts()
  const { sites } = useSite()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeSource, setActiveSource] = useState(null)
  const severity = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium
  const site = sites?.find((s) => s.id === alert.siteId)
  const statusBadge = STATUS_BADGE[alert.status] || STATUS_BADGE.pending
  const isIncomingTransfer = alert.type === 'incoming_transfer_request'

  return (
    <div
      className={cn(
        'rounded-xl border bg-white shadow-card transition-colors font-public min-w-0',
        alert.status === 'pending' ? severity.border : 'border-surface-border'
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              severity.bg
            )}
          >
            <AlertTriangle size={14} className={severity.text} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-public">
              <Badge tone={severity.text.includes('red') ? 'red' : 'amber'}>{severity.label}</Badge>
              {isIncomingTransfer && <Badge tone="blue">INCOMING TRANSFER REQUEST</Badge>}
              {site && <span className="text-xs font-semibold text-slate-600 font-public">{site.name}</span>}
              <span className="text-xs font-medium text-slate-500 font-ibm">· {formatTime(alert.timestamp)}</span>
            </div>
            <p className="mt-1.5 text-base font-bold leading-snug text-slate-900 font-public break-words">{alert.title}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn('mt-1 shrink-0 text-slate-500 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="border-t border-surface-border px-4 pb-4 pt-3.5">
          <div className="rounded-lg bg-surface-bg p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 font-public">AI Explanation</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800 font-ibm break-words">{alert.explanation}</p>
            {alert.reasonPoints?.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {alert.reasonPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-xs font-medium text-slate-700 font-ibm break-words">
                    <span className="text-slate-500 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/80 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800 font-public">
              {isIncomingTransfer ? 'Required Action' : 'Recommendation'}
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-slate-900 font-ibm break-words">
              {alert.recommendation ||
                alert.recommendedAction ||
                alert.recommended_action ||
                alert.data?.recommendation ||
                alert.data?.recommendedAction ||
                (isIncomingTransfer
                  ? `Authorize dispatch of ${alert.transferDetails?.quantity || 150} ${alert.transferDetails?.unit || 'bags'} of ${alert.transferDetails?.item || 'materials'} to ${alert.transferDetails?.targetSiteName || 'the requesting site'}, or Decline to preserve local inventory.`
                  : `Initiate expedited procurement reorder or cross-site transfer to prevent schedule delay.`)}
            </p>
          </div>

          {alert.sources?.length > 0 && (
            <div className="mt-3 font-public">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 font-public">
                Source Records
              </p>
              <div className="flex flex-wrap gap-2">
                {alert.sources.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSource(s)}
                    className="flex items-center gap-1.5 rounded-md border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm font-ibm break-words"
                  >
                    <FileSearch size={13} className="text-teal-600 shrink-0" />
                    <span className="truncate max-w-[200px]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-3.5">
            <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
            {alert.status === ALERT_STATUS.PENDING && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="danger"
                  icon={X}
                  onClick={() => updateAlertStatus(alert.id, ALERT_STATUS.DISMISSED)}
                >
                  {isIncomingTransfer ? 'Decline Transfer' : 'Dismiss'}
                </Button>
                {!isIncomingTransfer && (
                  <Button
                    size="sm"
                    variant="warning"
                    icon={Clock3}
                    onClick={() => updateAlertStatus(alert.id, ALERT_STATUS.SNOOZED)}
                  >
                    Snooze
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="success"
                  icon={isIncomingTransfer ? Send : Check}
                  onClick={() => updateAlertStatus(alert.id, ALERT_STATUS.APPROVED)}
                >
                  {isIncomingTransfer ? 'Authorize Dispatch' : 'Approve'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <SourceRecordModal source={activeSource} onClose={() => setActiveSource(null)} />
    </div>
  )
}
