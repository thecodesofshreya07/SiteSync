import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const PRESET_UNITS = [
  'bags',
  'cu.m',
  'tonnes',
  'units',
  'meters',
  'kg',
  'liters',
  'sq.m',
  'truckloads',
  'Custom...',
]

export default function CreateItemModal({ open, onClose, siteId, siteName, onCreate }) {
  const [item, setItem] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('bags')
  const [customUnit, setCustomUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reorderThreshold, setReorderThreshold] = useState('')
  const [consumptionPerDay, setConsumptionPerDay] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const effectiveUnit = selectedUnit === 'Custom...' ? customUnit.trim() || 'units' : selectedUnit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!item.trim()) return

    setSubmitting(true)
    try {
      await onCreate({
        siteId,
        item: item.trim(),
        unit: effectiveUnit,
        quantity: Number(quantity) || 0,
        reorderThreshold: Number(reorderThreshold) || 0,
        consumptionPerDay: Number(consumptionPerDay) || 0,
      })
      setItem('')
      setQuantity('')
      setReorderThreshold('')
      setConsumptionPerDay('')
      setCustomUnit('')
      setSelectedUnit('bags')
      onClose()
    } catch (err) {
      console.error('Failed to create inventory item:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Material" subtitle={`Add inventory item to ${siteName || 'site'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Unit *</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              {PRESET_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
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

        {selectedUnit === 'Custom...' && (
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Specify Custom Unit *
            </label>
            <input
              type="text"
              required
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="e.g. drums, rolls, pallets"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        )}

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
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
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
