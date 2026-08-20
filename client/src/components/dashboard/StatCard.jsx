import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const ACCENTS = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  navy: { bg: 'bg-navy-900/5', text: 'text-navy-600' },
}

export default function StatCard({ label, value, sublabel, trend, trendLabel, trendDirection = 'up', icon: Icon, accent = 'navy' }) {
  const isPositive = trendDirection === 'up'
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
  const accentStyle = ACCENTS[accent] || ACCENTS.navy

  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
        {Icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accentStyle.bg)}>
            <Icon size={16} className={accentStyle.text} />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {sublabel && <span className="text-xs font-semibold text-slate-500">{sublabel}</span>}
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-bold',
              isPositive ? 'text-green-700' : 'text-red-700'
            )}
          >
            <TrendIcon size={13} />
            {trend}
            {trendLabel && <span className="font-medium text-slate-500">{trendLabel}</span>}
          </span>
        )}
      </div>
    </div>
  )
}
