import { Sparkles } from 'lucide-react'
import Button from '../common/Button'
import { daysRemaining } from '../../data/inventory'

export default function PredictiveProcurementCard({ item, onReview, onOpenProcurement }) {
  const remaining = daysRemaining(item)
  const recommendedOrder = Math.round(item.consumptionPerDay * 9) // ~9 days buffer

  return (
    <div className="relative overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 sm:p-5 shadow-card font-public min-w-0">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-700">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-teal-800 font-public">AI Procurement Forecast</p>
          <p className="text-xs font-semibold text-slate-600 font-ibm">Predictive — not a reactive alert</p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 font-public break-words">{item.item}</h3>

      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-lg bg-white/80 p-2.5 border border-teal-100 font-ibm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-public">Projected Shortage</p>
          <p className="mt-1 text-base font-extrabold text-red-600 font-ibm">{remaining}d</p>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 border border-teal-100 font-ibm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-public">Consumption</p>
          <p className="mt-1 text-base font-extrabold text-slate-900 font-ibm">{item.consumptionPerDay}/day</p>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 border border-teal-100 font-ibm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-public">Recommended Order</p>
          <p className="mt-1 text-base font-extrabold text-teal-800 font-ibm">{recommendedOrder} {item.unit}</p>
        </div>
      </div>

      <p className="mt-3.5 text-xs font-medium leading-relaxed text-slate-700 font-ibm break-words">
        Based on current consumption, upcoming task requirements, and pending delivery delays for <span className="font-semibold text-slate-900">{item.item.toLowerCase()}</span>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={onReview}>
          Review Recommendation
        </Button>
        <Button size="sm" variant="secondary" onClick={onOpenProcurement}>
          Open Procurement
        </Button>
      </div>
    </div>
  )
}
