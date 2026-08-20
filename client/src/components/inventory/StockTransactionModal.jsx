import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { cn } from '../../lib/utils'

const TXN_TYPES = ['Stock In', 'Stock Out', 'Transfer']

export default function StockTransactionModal({ open, onClose, item, onSubmit }) {
  const [type, setType] = useState('Stock In')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState('')

  if (!item) return null

  function handleSubmit() {
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setValidationError('Please enter a valid positive quantity.')
      return
    }
    if ((type === 'Stock Out' || type === 'Transfer') && qty > Number(item.quantity || 0)) {
      setValidationError(`Cannot log ${qty} ${item.unit}. Only ${item.quantity} ${item.unit} available in current stock.`)
      return
    }

    setValidationError('')
    onSubmit({ type, quantity: qty, note })
    setQuantity('')
    setNote('')
    setType('Stock In')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Transaction" subtitle={`${item.item} · ${item.id}`}>
      <div className="space-y-4 font-public min-w-0">
        {validationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {validationError}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">Transaction Type</label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-surface-border bg-surface-bg p-1">
            {TXN_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors truncate',
                  type === t ? 'bg-white text-teal-700 shadow-sm' : 'text-navy-500 hover:text-navy-700'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">
            Quantity ({item.unit})
          </label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`e.g. 50`}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
          <p className="mt-1 text-2xs text-navy-400">Current stock: {item.quantity} {item.unit}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Received from BuildPro Materials"
            className="w-full resize-none rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!quantity}>
            Log Transaction
          </Button>
        </div>
      </div>
    </Modal>
  )
}
