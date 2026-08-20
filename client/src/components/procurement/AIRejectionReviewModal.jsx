import { useState } from 'react'
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Building, FileText, ArrowRight } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { formatINR } from '../../lib/utils'

export default function AIRejectionReviewModal({ open, onClose, order, onAction }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!order) return null

  const handleDecision = async (action) => {
    setSubmitting(true)
    try {
      await onAction(order.id, action, note)
      setNote('')
      onClose()
    } catch (err) {
      console.error('Error submitting AI rejection decision:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finance Governance: Review AI Budget Rejection"
      subtitle={`Purchase Order ${order.id} · ${order.item}`}
    >
      <div className="space-y-4 font-public">
        {/* Warning Banner */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-900">
                Autonomous Budget Overrun Rejection
              </p>
              <p className="mt-1 text-sm font-medium text-red-800 leading-relaxed font-ibm">
                {order.aiRejectionReason ||
                  `This purchase order was auto-rejected because its amount exceeds the site's approved budget threshold.`}
              </p>
            </div>
          </div>
        </div>

        {/* PO & Financial Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs font-ibm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Material Requested:</span>
            <span className="font-bold text-slate-900 font-public">{order.item} ({order.quantity} {order.unit})</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Target Project Site:</span>
            <span className="font-bold text-slate-900 font-public">{order.siteId}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Order Total:</span>
            <span className="font-bold text-red-700 text-sm font-ibm">{formatINR(order.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Current PO Status:</span>
            <Badge tone="red">AI AUTO-REJECTED</Badge>
          </div>
        </div>

        {/* Auditor Note Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-public">
            Finance Manager Decision Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Budget variance approved under contingency fund line item #4."
            rows={2}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-teal-500 focus:outline-none font-ibm"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <button
            onClick={() => handleDecision('confirm_rejection')}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-sm w-full sm:w-auto"
          >
            <XCircle size={15} />
            <span>Confirm Rejection (Close PO)</span>
          </button>
          <button
            onClick={() => handleDecision('approve_override')}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-md shadow-teal-700/20 w-full sm:w-auto"
          >
            <CheckCircle2 size={15} />
            <span>Approve Override (Proceed PO)</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
