import { useState } from 'react'
import ProcurementStatusBadge from './ProcurementStatusBadge'
import PMValidationModal from './PMValidationModal'
import FinanceReviewModal from './FinanceReviewModal'
import { formatFullINR, formatDate } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { CheckCircle2, PackageCheck, Layers, Wallet } from 'lucide-react'

export default function ProcurementCard({ po, onUpdateOrder }) {
  const { user } = useAuth()
  const [pmModalOpen, setPmModalOpen] = useState(false)
  const [financeModalOpen, setFinanceModalOpen] = useState(false)

  const vendorName = po.vendorName || po.vendor || (po.vendorId ? `Vendor ${po.vendorId}` : '—')
  const role = user?.role || 'Guest'

  const handleAction = async (newStage, newStatus, extraFields = {}) => {
    if (!onUpdateOrder) return
    try {
      await onUpdateOrder(po.id, {
        stage: newStage,
        status: newStatus,
        ...extraFields,
      })
    } catch (err) {
      console.error('Failed to advance procurement order workflow:', err)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-surface-border bg-white p-3 shadow-card space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-navy-900">{po.id}</p>
          <span className="text-2xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
            {po.quantity} {po.unit}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-navy-800 leading-snug">{po.item}</p>
          <p className="text-2xs text-navy-500 mt-0.5">Vendor: {vendorName}</p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
          <p className="text-xs font-semibold tabular-nums text-navy-900">{formatFullINR(po.amount)}</p>
          <p className="text-2xs text-navy-400">{formatDate(po.expectedDelivery)}</p>
        </div>

        <div>
          <ProcurementStatusBadge status={po.status} />
        </div>

        {/* Role-Based Action Buttons */}
        <div className="pt-2 border-t border-surface-border/60">
          {/* Step 2: PM ONLY reviews work requirement & approves/disapproves */}
          {role === 'Project Manager' &&
            (po.status === 'Pending PM Validation' || po.stage === 'Material Request') && (
              <button
                type="button"
                onClick={() => setPmModalOpen(true)}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-teal-600 px-2 py-1.5 text-2xs font-semibold text-white shadow-xs hover:bg-teal-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Layers size={12} />
                Validate Work & Review PO
              </button>
            )}

          {/* Step 3: Accountant / Finance OR Admin reviews site budget & approves/disapproves */}
          {(role === 'Accountant' || role === 'Finance' || role === 'Admin') &&
            (po.status === 'Pending Finance Approval' || po.stage === 'Vendor Quote' || po.stage === 'Approval') && (
              <button
                type="button"
                onClick={() => setFinanceModalOpen(true)}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-indigo-600 px-2 py-1.5 text-2xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Wallet size={12} />
                Check Budget & Review Payment
              </button>
            )}

          {/* Step 4: Contractor ONLY marks delivery & logs site inventory */}
          {role === 'Contractor' &&
            (po.status === 'Payment Completed' || po.stage === 'Purchase Order' || po.status === 'Awaiting Delivery') && (
              <button
                type="button"
                onClick={() => handleAction('Delivery', 'Delivered')}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-2xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <PackageCheck size={12} />
                Mark Delivered & Update Inventory
              </button>
            )}
        </div>
      </div>

      {/* Modals */}
      <PMValidationModal
        open={pmModalOpen}
        po={po}
        onClose={() => setPmModalOpen(false)}
        onApprove={(id, payload) => handleAction(payload.stage, payload.status, payload)}
        onReject={(id, payload) => handleAction(payload.stage, payload.status, payload)}
      />

      <FinanceReviewModal
        open={financeModalOpen}
        po={po}
        onClose={() => setFinanceModalOpen(false)}
        onApprove={(id, payload) => handleAction(payload.stage, payload.status, payload)}
        onReject={(id, payload) => handleAction(payload.stage, payload.status, payload)}
      />
    </>
  )
}
