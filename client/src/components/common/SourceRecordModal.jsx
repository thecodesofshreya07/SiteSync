import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import Modal from './Modal'
import Badge from './Badge'
import LoadingState from './LoadingState'
import Button from './Button'
import { formatDate, formatFullINR } from '../../lib/utils'

const API_BASE = 'http://localhost:4000/api'

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 border-b border-surface-border py-2.5 last:border-0 font-public min-w-0">
      <span className="text-xs font-semibold text-slate-500 font-public shrink-0">{label}</span>
      <span className="sm:text-right text-xs font-bold text-slate-900 font-ibm break-words min-w-0">{value}</span>
    </div>
  )
}

export default function SourceRecordModal({ source, open, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !source?.id) {
      setData(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    async function fetchRecord() {
      const type = source.type?.toLowerCase() || ''
      let endpoint = ''

      if (type === 'inventory') endpoint = `${API_BASE}/inventory/${source.id}`
      else if (type === 'procurement') endpoint = `${API_BASE}/procurement/${source.id}`
      else if (type === 'delivery') endpoint = `${API_BASE}/deliveries/${source.id}`
      else if (type === 'equipment') endpoint = `${API_BASE}/equipment/${source.id}`
      else if (type === 'task') endpoint = `${API_BASE}/tasks/${source.id}`
      else if (type === 'vendor') endpoint = `${API_BASE}/vendors/${source.id}`
      else if (type === 'site') endpoint = `${API_BASE}/sites/${source.id}`
      else if (type === 'alert') endpoint = `${API_BASE}/alerts/${source.id}`
      else endpoint = `${API_BASE}/inventory/${source.id}`

      try {
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (isMounted) {
          setData(json)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(`Could not load record from PostgreSQL: ${err.message}`)
          setLoading(false)
        }
      }
    }

    fetchRecord()

    return () => {
      isMounted = false
    }
  }, [open, source?.id, source?.type])

  if (!source) return null

  return (
    <Modal open={open} onClose={onClose} title={`Source Record: ${source.id}`}>
      {loading ? (
        <LoadingState label="Loading database record..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : !data ? (
        <div className="py-6 text-center text-xs text-slate-500 font-medium">
          NO REAL DATA FOUND in PostgreSQL for {source.id}
        </div>
      ) : (
        <div>
          <Badge tone="blue">{source.type?.toUpperCase() || 'RECORD'}</Badge>
          <h3 className="mt-2 text-base font-semibold text-navy-900 break-words">{data.name || data.item || data.id}</h3>
          <div className="mt-3">
            {data.siteId && <Row label="Site ID" value={data.siteId} />}
            {data.item && <Row label="Item" value={data.item} />}
            {data.quantity !== undefined && (
              <Row label="Quantity" value={`${data.quantity} ${data.unit || ''}`} />
            )}
            {data.consumptionPerDay && (
              <Row label="Consumption / day" value={`${data.consumptionPerDay} ${data.unit || ''}`} />
            )}
            {data.reorderThreshold && (
              <Row label="Reorder Threshold" value={`${data.reorderThreshold} ${data.unit || ''}`} />
            )}
            {data.amount && <Row label="Amount" value={formatFullINR(data.amount)} />}
            {data.stage && <Row label="Stage" value={data.stage} />}
            {data.status && <Row label="Status" value={data.status} />}
            {data.delayDays !== undefined && <Row label="Delay Days" value={`${data.delayDays} days`} />}
            {data.utilization !== undefined && <Row label="Utilization" value={`${data.utilization}%`} />}
            {data.idleDays !== undefined && <Row label="Idle Days" value={`${data.idleDays} days`} />}
            {data.progress !== undefined && <Row label="Progress" value={`${data.progress}%`} />}
            {data.dateRaised && <Row label="Date Raised" value={formatDate(data.dateRaised)} />}
            {data.expectedDelivery && <Row label="Expected Delivery" value={formatDate(data.expectedDelivery)} />}
            {data.lastUpdated && <Row label="Last Updated" value={formatDate(data.lastUpdated)} />}
          </div>

          {/* Direct module route navigation */}
          <div className="mt-4 pt-3 border-t border-surface-border flex justify-end">
            {source.type === 'inventory' && (
              <Link
                to={`/inventory?search=${encodeURIComponent(source.id)}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
              >
                <span>Open in Inventory Management</span>
                <ExternalLink size={13} />
              </Link>
            )}
            {(source.type === 'procurement' || source.type === 'delivery' || source.type === 'vendor') && (
              <Link
                to={`/procurement?search=${encodeURIComponent(source.id)}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
              >
                <span>Open in Procurement</span>
                <ExternalLink size={13} />
              </Link>
            )}
            {(source.type === 'equipment' || source.type === 'task') && (
              <Link
                to={`/tasks-equipment?search=${encodeURIComponent(source.id)}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
              >
                <span>Open in Tasks & Equipment</span>
                <ExternalLink size={13} />
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
