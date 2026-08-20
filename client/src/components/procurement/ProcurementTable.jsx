import { useState } from 'react'
import ProcurementStatusBadge from './ProcurementStatusBadge'
import EmptyState from '../common/EmptyState'
import AIRejectionReviewModal from './AIRejectionReviewModal'
import { ClipboardList, Trash2, ShieldAlert } from 'lucide-react'
import { useSite } from '../../hooks/useSite'
import { useAuth } from '../../hooks/useAuth'
import { formatFullINR, formatDate } from '../../lib/utils'

export default function ProcurementTable({ orders, onUpdateOrder, onDeleteOrder }) {
  const { sites } = useSite()
  const { user } = useAuth()
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null)

  const role = user?.role || 'Guest'
  const isFinance = role === 'Accountant' || role === 'Finance' || role === 'Admin'

  if (!orders || orders.length === 0) {
    return <EmptyState icon={ClipboardList} title="No purchase orders" description="Nothing matches the current view." />
  }

  return (
    <>
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
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((po) => {
              const site = sites?.find((s) => s.id === po.siteId)
              const vendorName = po.vendorName || po.vendor || po.vendorId || '—'
              const isAiRejected = po.status === 'ai_rejected'

              return (
                <tr key={po.id} className="border-b border-surface-border last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{po.id}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{po.item}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{vendorName}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{site?.name || po.siteId}</td>
                  <td className="px-4 py-3.5 tabular-nums font-bold text-slate-900">{formatFullINR(po.amount)}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">{po.stage}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{formatDate(po.expectedDelivery)}</td>
                  <td className="px-4 py-3.5">
                    <ProcurementStatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {isFinance && isAiRejected && (
                      <button
                        onClick={() => setSelectedReviewOrder(po)}
                        className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-2xs font-bold text-white hover:bg-red-700 transition-colors"
                      >
                        <ShieldAlert size={12} />
                        Review AI
                      </button>
                    )}
                    {onDeleteOrder && (
                      <button
                        onClick={() => onDeleteOrder(po.id)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Cancel/Delete Purchase Order"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AIRejectionReviewModal
        open={Boolean(selectedReviewOrder)}
        order={selectedReviewOrder}
        onClose={() => setSelectedReviewOrder(null)}
        onAction={async (orderId, action, note) => {
          const { apiRequest } = await import('../../lib/api')
          const updated = await apiRequest(`/procurement/${orderId}/ai-review`, {
            method: 'PATCH',
            body: JSON.stringify({ action, note }),
          })
          if (updated && onUpdateOrder) {
            onUpdateOrder(orderId, updated)
          }
        }}
      />
    </>
  )
}
