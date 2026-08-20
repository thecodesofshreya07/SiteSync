import { useState } from 'react'
import { PackagePlus, ClipboardList, Trash2, QrCode } from 'lucide-react'
import InventoryStatusBadge from './InventoryStatusBadge'
import QRCodeModal from './QRCodeModal'
import EmptyState from '../common/EmptyState'
import { formatDate } from '../../lib/utils'

function daysRemaining(item) {
  if (!item || !item.consumptionPerDay || item.consumptionPerDay <= 0) return '—'
  return Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
}

export default function InventoryTable({ items, onLogTransaction, onDeleteItem }) {
  const [selectedQrItem, setSelectedQrItem] = useState(null)

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No inventory items match your filters"
        description="Try adjusting the search or status filter."
      />
    )
  }

  const canLog = typeof onLogTransaction === 'function'
  const canDelete = typeof onDeleteItem === 'function'
  const showActions = canLog || canDelete || true

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-white shadow-card">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-surface-border bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-700">
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Reorder Threshold</th>
            <th className="px-4 py-3">Consumption/day</th>
            <th className="px-4 py-3">Days Remaining</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Updated</th>
            {showActions && <th className="px-4 py-3 text-right">Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const remaining = daysRemaining(item)
            return (
              <tr key={item.id} className="border-b border-surface-border last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900">{item.item}</p>
                  <p className="text-xs font-medium text-slate-500">{item.id}</p>
                </td>
                <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-800">
                  {item.quantity !== undefined ? item.quantity.toLocaleString('en-IN') : '—'} {item.unit || ''}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-medium text-slate-600">
                  {item.reorderThreshold !== undefined ? item.reorderThreshold.toLocaleString('en-IN') : '—'} {item.unit || ''}
                </td>
                <td className="px-4 py-3.5 tabular-nums font-medium text-slate-600">
                  {item.consumptionPerDay !== undefined ? `${item.consumptionPerDay} ${item.unit || ''}/day` : '—'}
                </td>
                <td className="px-4 py-3.5 tabular-nums">
                  {remaining === '—' ? (
                    <span className="text-slate-400 font-medium">—</span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        Number(remaining) <= 4
                          ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                          : Number(remaining) <= 7
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}
                    >
                      ~{remaining}d runway
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <InventoryStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{formatDate(item.lastUpdated || item.lastTransaction?.date || new Date())}</td>
                {showActions && (
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedQrItem(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm transition-colors cursor-pointer"
                        title="View & Print Material QR Code"
                      >
                        <QrCode size={13} className="text-teal-600" />
                        QR Label
                      </button>
                      {canLog && (
                        <button
                          onClick={() => onLogTransaction(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm transition-colors cursor-pointer"
                          title="Log Stock In/Out"
                        >
                          <PackagePlus size={13} className="text-teal-600" />
                          Log
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete material"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Material QR Code & Label Modal */}
      <QRCodeModal
        open={Boolean(selectedQrItem)}
        item={selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        onQuickLog={onLogTransaction}
      />
    </div>
  )
}
