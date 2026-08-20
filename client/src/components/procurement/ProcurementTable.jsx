import ProcurementStatusBadge from './ProcurementStatusBadge'
import EmptyState from '../common/EmptyState'
import { ClipboardList } from 'lucide-react'
import { getVendorById } from '../../data/procurement'
import { getSiteById } from '../../data/sites'
import { formatFullINR, formatDate } from '../../lib/utils'

export default function ProcurementTable({ orders, onUpdateOrder }) {
  if (orders.length === 0) {
    return <EmptyState icon={ClipboardList} title="No purchase orders" description="Nothing matches the current view." />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-white shadow-card">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-700">
            <th className="px-4 py-3">PO</th>
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Site</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Delivery</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => {
            const vendor = getVendorById(po.vendorId)
            const site = getSiteById(po.siteId)
            return (
              <tr key={po.id} className="border-b border-surface-border last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 font-bold text-slate-900">{po.id}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{po.item}</td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{vendor?.name}</td>
                <td className="px-4 py-3.5 font-medium text-slate-600">{site?.name}</td>
                <td className="px-4 py-3.5 tabular-nums font-bold text-slate-900">{formatFullINR(po.amount)}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-700">{po.stage}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{formatDate(po.expectedDelivery)}</td>
                <td className="px-4 py-3.5">
                  <ProcurementStatusBadge status={po.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
