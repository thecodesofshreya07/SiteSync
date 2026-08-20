import BudgetChart from './BudgetChart'
import { formatINR, percentage } from '../../lib/utils'
import { cn } from '../../lib/utils'

export default function BudgetOverview({ site, categoryData }) {
  const remaining = site.budgetPlanned - site.budgetActual
  const usedPct = percentage(site.budgetActual, site.budgetPlanned)
  // Cost Performance Index: planned / actual (proxy). >1 favorable, <1 unfavorable.
  const cpi = (site.budgetPlanned / site.budgetActual).toFixed(2)
  const isOverBudget = site.budgetActual > site.budgetPlanned

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Budget Overview</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-600">Planned vs actual spend by category</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Planned</p>
          <p className="mt-1 text-base font-extrabold text-slate-900">{formatINR(site.budgetPlanned)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual</p>
          <p className={cn('mt-1 text-base font-extrabold', isOverBudget ? 'text-red-700' : 'text-slate-900')}>
            {formatINR(site.budgetActual)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining</p>
          <p className={cn('mt-1 text-base font-extrabold', remaining < 0 ? 'text-red-700' : 'text-slate-900')}>
            {formatINR(Math.abs(remaining))}
            {remaining < 0 && <span className="ml-1 text-xs font-bold text-red-600">over</span>}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/70">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost Perf. Index</p>
          <p className={cn('mt-1 text-base font-extrabold', Number(cpi) < 1 ? 'text-red-700' : 'text-green-700')}>
            {cpi}
          </p>
        </div>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-bg">
        <div
          className={cn('h-full rounded-full', usedPct > 100 ? 'bg-red-500' : 'bg-teal-500')}
          style={{ width: `${Math.min(usedPct, 100)}%` }}
        />
      </div>

      <BudgetChart data={categoryData} />
    </div>
  )
}
