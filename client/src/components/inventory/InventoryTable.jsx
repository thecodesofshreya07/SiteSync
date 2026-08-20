import { PackagePlus, ClipboardList } from 'lucide-react'
import InventoryStatusBadge from './InventoryStatusBadge'
import EmptyState from '../common/EmptyState'
import { formatDate } from '../../lib/utils'

function daysRemaining(item) {
  if (!item || !item.consumptionPerDay || item.consumptionPerDay <= 0) return '—'
  return Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
}

export default function InventoryTable({ items, onLogTransaction }) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No inventory items match your filters"
        description="Try adjusting the search or status filter."
      />
    )
  }

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
            <th className="px-4 py-3 text-right">Action</th>
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
                <td className="px-4 py-3.5 tabular-nums font-bold text-slate-900">
                  {remaining === '—' ? '—' : `${remaining}d`}
                </td>
                <td className="px-4 py-3.5">
                  <InventoryStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{formatDate(item.lastUpdated || item.lastTransaction?.date || new Date())}</td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => onLogTransaction(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-white px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-colors"
                  >
                    <PackagePlus size={12} />
                    Log
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
