import ProcurementStatusBadge from './ProcurementStatusBadge'
import { getVendorById } from '../../data/procurement'
import { formatFullINR, formatDate } from '../../lib/utils'

export default function ProcurementCard({ po }) {
  const vendor = getVendorById(po.vendorId)
  return (
    <div className="rounded-lg border border-surface-border bg-white p-3 shadow-card">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-navy-900">{po.id}</p>
      </div>
      <p className="text-sm font-medium text-navy-800">{po.item}</p>
      <p className="mt-0.5 text-2xs text-navy-500">{vendor?.name}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-semibold tabular-nums text-navy-900">{formatFullINR(po.amount)}</p>
        <p className="text-2xs text-navy-400">{formatDate(po.expectedDelivery)}</p>
      </div>
      <div className="mt-2">
        <ProcurementStatusBadge status={po.status} />
      </div>
    </div>
  )
}
