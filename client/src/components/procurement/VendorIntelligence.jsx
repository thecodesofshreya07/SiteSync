import { useEffect, useState } from 'react'
import { Building, ShieldCheck, Clock, TrendingUp, IndianRupee, ArrowUpDown, Award, CheckCircle2, Phone } from 'lucide-react'
import { formatINR } from '../../lib/utils'
import Badge from '../common/Badge'

const API_BASE = 'http://localhost:4000/api'

export default function VendorIntelligence() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('onTimeDeliveryPct')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/vendors/analytics`)
      .then((res) => res.json())
      .then((data) => {
        setVendors(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Error loading vendor analytics:', err)
        setLoading(false)
      })
  }, [])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const sortedVendors = [...vendors].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    }
    return sortAsc ? Number(valA || 0) - Number(valB || 0) : Number(valB || 0) - Number(valA || 0)
  })

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-white p-8 text-center text-sm font-semibold text-slate-500 font-ibm animate-pulse">
        Calculating supplier fulfillment matrix & delivery delay intelligence...
      </div>
    )
  }

  return (
    <div className="space-y-4 font-public">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-teal-600" />
            Vendor Intelligence & SLA Scorecard
          </h3>
          <p className="text-xs font-medium text-slate-600 font-ibm">
            Aggregated delivery reliability, on-time rate %, average delay days & volume tier pricing
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-ibm">
          <span>Sort by:</span>
          <button
            onClick={() => handleSort('onTimeDeliveryPct')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              sortField === 'onTimeDeliveryPct' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            On-Time %
          </button>
          <button
            onClick={() => handleSort('totalSpend')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              sortField === 'totalSpend' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Total Spend
          </button>
          <button
            onClick={() => handleSort('avgDelayDays')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              sortField === 'avgDelayDays' ? 'bg-teal-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Lead Speed
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border bg-white shadow-card">
        <table className="w-full min-w-[850px] text-left text-sm font-ibm">
          <thead>
            <tr className="border-b border-surface-border bg-slate-100/80 text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
              <th className="px-4 py-3">Vendor / Specialty</th>
              <th className="px-4 py-3">Reliability Grade</th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('onTimeDeliveryPct')}>
                <div className="flex items-center gap-1">
                  <span>On-Time Rate</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('avgDelayDays')}>
                <div className="flex items-center gap-1">
                  <span>Avg Delivery Lead / Delay</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('totalSpend')}>
                <div className="flex items-center gap-1">
                  <span>Total Order Volume</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-4 py-3">Pricing Tier</th>
            </tr>
          </thead>
          <tbody>
            {sortedVendors.map((v) => (
              <tr key={v.id} className="border-b border-surface-border last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900 font-public">{v.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{v.category} · {v.contact}</p>
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone={v.reliability === 'High' ? 'green' : v.reliability === 'Moderate' ? 'amber' : 'red'}>
                    {v.reliability?.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          v.onTimeDeliveryPct >= 90 ? 'bg-green-500' : v.onTimeDeliveryPct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(v.onTimeDeliveryPct, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">{v.onTimeDeliveryPct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-semibold ${v.avgDelayDays === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                    {v.avgDelayDays === 0 ? '⚡ 0 days delay' : `+${v.avgDelayDays} days avg delay`}
                  </span>
                  <p className="text-[11px] text-slate-500">{v.leadTimeDays}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900">{formatINR(v.totalSpend || 0)}</p>
                  <p className="text-xs text-slate-500">{v.totalOrders} purchase orders</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                    {v.pricingScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
