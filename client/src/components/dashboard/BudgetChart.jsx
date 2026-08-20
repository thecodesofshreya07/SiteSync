import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatINR } from '../../lib/utils'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-surface-border bg-white px-3 py-2 shadow-pop z-20">
      <p className="mb-1 text-2xs font-semibold text-navy-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-2xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{formatINR(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function BudgetChart({ data }) {
  return (
    <div className="w-full min-w-0 h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={6} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EC" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: '#5A6478' }}
            axisLine={{ stroke: '#E4E6EC' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#5A6478' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatINR(v, { decimals: 1, showSymbol: false })}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F7' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar dataKey="planned" name="Planned" fill="#A9B4C9" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="actual" name="Actual" fill="#0F9C8C" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
