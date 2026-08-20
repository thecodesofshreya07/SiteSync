import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { vendors } from '../../data/procurement'
import { calculateMaterialAmount } from '../../lib/constants'
import { apiRequest } from '../../lib/api'
import { CheckCircle2, XCircle, Layers, RefreshCw } from 'lucide-react'

export default function PMValidationModal({ open, po, onClose, onApprove, onReject }) {
  const [vendorId, setVendorId] = useState(po?.vendorId || vendors[0]?.id || 'VEN-001')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Real Database Inventory State
  const [realStock, setRealStock] = useState(null)
  const [loadingStock, setLoadingStock] = useState(false)

  useEffect(() => {
    if (!open || !po || !po.siteId) return

    let isMounted = true
    setLoadingStock(true)

    const fetchRealInventory = async () => {
      try {
        const inventoryData = await apiRequest(`/inventory?siteId=${encodeURIComponent(po.siteId)}`)
        if (isMounted && Array.isArray(inventoryData)) {
          const match = inventoryData.find(
            (inv) => String(inv.item).trim().toLowerCase() === String(po.item).trim().toLowerCase()
          )
          setRealStock(match || null)
        }
      } catch (err) {
        console.warn('Failed to fetch real site inventory for PM validation modal:', err)
      } finally {
        if (isMounted) setLoadingStock(false)
      }
    }

    fetchRealInventory()

    return () => {
      isMounted = false
    }
  }, [open, po?.siteId, po?.item])

  if (!open || !po) return null

  const requestedQty = Number(po.quantity) || 1
  const calculatedAmount = calculateMaterialAmount(po.item, requestedQty, po.unit)

  // Exact Database Stock Values
  const currentStockInDb = realStock ? Number(realStock.quantity) || 0 : 0
  const reorderThresholdInDb = realStock ? Number(realStock.reorderThreshold) || 100 : 100
  const projectedTotal = currentStockInDb + requestedQty
  const workRequired = realStock
    ? Math.max(currentStockInDb + requestedQty, Math.round(reorderThresholdInDb * 2.2))
    : Math.round(requestedQty * 1.5)

  const handleApproveSubmit = async () => {
    setSubmitting(true)
    const selectedVendor = vendors.find((v) => v.id === vendorId)
    try {
      await onApprove(po.id, {
        stage: 'Vendor Quote',
        status: 'Pending Finance Approval',
        vendorId,
        vendorName: selectedVendor?.name || 'Apex Concrete & Aggregates',
        amount: calculatedAmount,
      })
      onClose()
    } catch (err) {
      console.error('Failed to approve material request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onReject(po.id, {
        stage: 'Material Request',
        status: 'Rejected by PM',
        rejectionReason: rejectionReason.trim() || 'Request exceeds scope requirement',
      })
      onClose()
    } catch (err) {
      console.error('Failed to reject material request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="PM Work Requirement & PO Review" subtitle={`Review contractor request for PO ${po.id}`}>
      <div className="space-y-4 text-slate-800 font-sans">
        {/* Request Overview */}
        <div className="rounded-xl border border-surface-border bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Material Requested</span>
            <span className="rounded bg-teal-100 px-2 py-0.5 text-2xs font-bold text-teal-800">
              {requestedQty} {po.unit}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900">{po.item}</p>
          <p className="text-2xs text-slate-500">Site ID: {po.siteId} · Raised by Site Contractor</p>
        </div>

        {/* Real Work Requirement vs Real Database Stock Analysis */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-teal-700 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">Database Inventory & Work Validation</h4>
            </div>
            {loadingStock && <RefreshCw size={12} className="animate-spin text-teal-600" />}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-teal-100">
              <p className="text-2xs font-medium text-slate-500">Target Phase Need</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{workRequired} {po.unit}</p>
              <p className="text-2xs text-slate-400">Phase requirement</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-teal-100">
              <p className="text-2xs font-medium text-slate-500">Current DB Stock</p>
              <p className="text-sm font-bold text-amber-700 mt-0.5">
                {loadingStock ? '...' : `${currentStockInDb} ${po.unit}`}
              </p>
              <p className="text-2xs text-slate-400">{realStock ? 'From PostgreSQL' : 'Not in site inventory'}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 shadow-xs border border-teal-100">
              <p className="text-2xs font-medium text-slate-500">Post-Delivery Total</p>
              <p className="text-sm font-bold text-teal-700 mt-0.5">{projectedTotal} {po.unit}</p>
              <p className="text-2xs text-slate-400">Projected stock</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-2xs text-teal-800 font-semibold bg-white/80 p-2 rounded-lg border border-teal-200">
            <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
            <span>
              {realStock
                ? `Verified against database item '${realStock.item}' (Current stock: ${currentStockInDb} ${po.unit}).`
                : `Material item '${po.item}' does not exist in site inventory yet. Approving will create a new inventory record on delivery.`}
            </span>
          </div>
        </div>

        {/* Vendor & Pricing Selection */}
        {!showRejectForm && (
          <>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Recommended Vendor *
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category} · {v.reliability} reliability)
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Calculated PO Total (INR):</span>
              <span className="text-base font-extrabold text-teal-700 tabular-nums">
                ₹{calculatedAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="danger"
                icon={XCircle}
                onClick={() => setShowRejectForm(true)}
                disabled={submitting}
              >
                Disapprove Request
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={CheckCircle2}
                onClick={handleApproveSubmit}
                disabled={submitting}
              >
                {submitting ? 'Approving...' : 'Approve & Raise PO'}
              </Button>
            </div>
          </>
        )}

        {/* Rejection Form */}
        {showRejectForm && (
          <form onSubmit={handleRejectSubmit} className="space-y-3 pt-2 border-t border-red-200">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-red-800">
                Disapproval Reason *
              </label>
              <textarea
                required
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why this material request is disapproved..."
                className="w-full rounded-lg border border-red-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowRejectForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" disabled={submitting}>
                {submitting ? 'Disapproving...' : 'Confirm Disapproval'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
