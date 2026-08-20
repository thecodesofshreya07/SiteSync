import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { vendors } from '../../data/procurement'

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

export default function CreatePOModal({ open, onClose, siteId, siteName, onCreate }) {
  const [item, setItem] = useState('')
  const [vendorId, setVendorId] = useState(vendors[0]?.id || 'VEN-001')
  const [quantity, setQuantity] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('bags')
  const [customUnit, setCustomUnit] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const effectiveUnit = selectedUnit === 'Custom...' ? customUnit.trim() || 'units' : selectedUnit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!item.trim()) return

    setSubmitting(true)
    const selectedVendor = vendors.find((v) => v.id === vendorId)
    try {
      await onCreate({
        siteId,
        item: item.trim(),
        vendorId,
        vendorName: selectedVendor?.name || '—',
        quantity: Number(quantity) || 1,
        unit: effectiveUnit,
        amount: 0,
        expectedDelivery: expectedDelivery || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        stage: 'Material Request',
        status: 'Pending PM Validation',
      })
      setItem('')
      setQuantity('')
      setExpectedDelivery('')
      setCustomUnit('')
      setSelectedUnit('bags')
      onClose()
    } catch (err) {
      console.error('Failed to create material request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Material Request" subtitle={`New material request for ${siteName || 'site'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Material Item *
          </label>
          <input
            type="text"
            required
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. Portland Cement Type I"
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Preferred Vendor
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
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

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
            Required Delivery Date
          </label>
          <input
            type="date"
            value={expectedDelivery}
            onChange={(e) => setExpectedDelivery(e.target.value)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!item.trim() || submitting}>
            {submitting ? 'Submitting Request...' : 'Submit Material Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
