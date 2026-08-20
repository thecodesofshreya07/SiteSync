import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { formatFullINR } from '../../lib/utils'
import { useSite } from '../../hooks/useSite'
import { calculateMaterialAmount } from '../../lib/constants'
import { CheckCircle2, XCircle, Wallet, ShieldAlert } from 'lucide-react'

export default function FinanceReviewModal({ open, po, onClose, onApprove, onReject }) {
  const { selectedSite } = useSite()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!open || !po) return null

  const plannedBudget = Number(selectedSite?.budgetPlanned) || 31000000
  const actualBudget = Number(selectedSite?.budgetActual) || 29500000
  const availableBudget = Math.max(0, plannedBudget - actualBudget)
  
  const poAmount = Number(po.amount) > 0 ? Number(po.amount) : calculateMaterialAmount(po.item, po.quantity, po.unit)
  const remainingAfterPO = availableBudget - poAmount
  const isWithinBudget = remainingAfterPO >= 0

  const handleApproveSubmit = async () => {
    setSubmitting(true)
    try {
      await onApprove(po.id, {
        stage: 'Purchase Order',
        status: 'Payment Completed',
        amount: poAmount,
      })
      onClose()
    } catch (err) {
      console.error('Failed to approve budget & payment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onReject(po.id, {
        stage: 'Vendor Quote',
        status: 'Rejected by Finance',
        rejectionReason: rejectionReason.trim() || 'Budget allocation exceeded or insufficient funds',
      })
      onClose()
    } catch (err) {
      console.error('Failed to reject financial approval:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Accountant Financial & Budget Review" subtitle={`Review payment request for PO ${po.id}`}>
      <div className="space-y-4 text-slate-800 font-sans">
        {/* PO Details */}
        <div className="rounded-xl border border-surface-border bg-slate-50 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Requested Order</span>
            <span className="text-xs font-bold text-navy-900">{po.id}</span>
          </div>
          <p className="text-base font-bold text-slate-900">{po.item}</p>
          <p className="text-2xs text-slate-500">Vendor: {po.vendorName || po.vendor || '—'} · Qty: {po.quantity} {po.unit}</p>
        </div>

        {/* Site Budget Breakdown */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-indigo-200/80 pb-2">
            <Wallet size={16} className="text-indigo-700 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Site Budget Check ({selectedSite?.name || 'Current Site'})
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-indigo-100">
              <p className="text-2xs font-medium text-slate-500">Planned Site Budget</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{formatFullINR(plannedBudget)}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-indigo-100">
              <p className="text-2xs font-medium text-slate-500">Current Actual Spend</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{formatFullINR(actualBudget)}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-indigo-100">
              <p className="text-2xs font-medium text-slate-500">PO Request Amount</p>
              <p className="text-sm font-bold text-indigo-700 mt-0.5">{formatFullINR(poAmount)}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-indigo-100">
              <p className="text-2xs font-medium text-slate-500">Remaining Buffer</p>
              <p className={`text-sm font-bold mt-0.5 ${isWithinBudget ? 'text-green-700' : 'text-red-700'}`}>
                {formatFullINR(remainingAfterPO)}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-2xs font-semibold p-2.5 rounded-lg border ${
            isWithinBudget
              ? 'bg-green-50 text-green-900 border-green-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            {isWithinBudget ? (
              <>
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <span>Financial Check PASSED: Requested PO is fully covered by available site budget.</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} className="text-red-600 shrink-0" />
                <span>Financial Warning: Requested PO exceeds available unallocated budget buffer!</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {!showRejectForm && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="danger"
              icon={XCircle}
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
            >
              Disapprove Payment
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={CheckCircle2}
              onClick={handleApproveSubmit}
              disabled={submitting}
            >
              {submitting ? 'Approving Payment...' : 'Approve Budget & Payment'}
            </Button>
          </div>
        )}

        {/* Rejection Form */}
        {showRejectForm && (
          <form onSubmit={handleRejectSubmit} className="space-y-3 pt-2 border-t border-red-200">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-red-800">
                Payment Disapproval Reason *
              </label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why this financial payment request is disapproved..."
                className="w-full rounded-lg border border-red-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowRejectForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Disapproving...' : 'Confirm Payment Disapproval'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
