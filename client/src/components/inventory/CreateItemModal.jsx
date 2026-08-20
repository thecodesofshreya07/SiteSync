import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { AlertCircle } from 'lucide-react'

export default function CreateItemModal({ open, onClose, siteId, siteName, onCreate }) {
  const [item, setItem] = useState('')
  const [unit, setUnit] = useState('bags')
  const [quantity, setQuantity] = useState('')
  const [reorderThreshold, setReorderThreshold] = useState('')
  const [consumptionPerDay, setConsumptionPerDay] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function handleClose() {
    setError('')
    setItem('')
    setQuantity('')
    setReorderThreshold('')
    setConsumptionPerDay('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!item.trim()) {
      setError('Material Name is required')
      return
    }

    setSubmitting(true)
    try {
      await onCreate({
        siteId,
        item: item.trim(),
        unit: unit.trim() || 'units',
        quantity: Number(quantity) || 0,
        reorderThreshold: Number(reorderThreshold) || 0,
        consumptionPerDay: Number(consumptionPerDay) || 0,
      })
      handleClose()
    } catch (err) {
      console.error('Failed to create inventory item:', err)
      setError(err.message || 'Failed to create inventory item. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add New Material" subtitle={`Add inventory item to ${siteName || 'site'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Material Name *
          </label>
          <input
            type="text"
            required
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. UltraTech Cement 53 Grade"
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bags, tonnes, units, cu.m"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Initial Quantity
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Reorder Threshold
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Daily Consumption
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={consumptionPerDay}
              onChange={(e) => setConsumptionPerDay(e.target.value)}
              placeholder="e.g. 15"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!item.trim() || submitting}>
            {submitting ? 'Creating...' : 'Create Material'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
