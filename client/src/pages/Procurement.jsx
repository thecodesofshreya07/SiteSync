import { useState, useEffect } from 'react'
import { LayoutGrid, Table2, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import ProcurementPipeline from '../components/procurement/ProcurementPipeline'
import ProcurementTable from '../components/procurement/ProcurementTable'
import LoadingState from '../components/common/LoadingState'
import { useSite } from '../hooks/useSite'
import { cn } from '../lib/utils'

const API_BASE = 'http://localhost:4000/api'

export default function Procurement() {
  const { selectedSite } = useSite()
  const [view, setView] = useState('pipeline')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchProcurement = async () => {
      try {
        const res = await fetch(`${API_BASE}/procurement?siteId=${encodeURIComponent(selectedSite.id)}`)
        if (!res.ok) {
          throw new Error(`API server returned ${res.status}`)
        }
        const data = await res.json()
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch (err) {
        console.error('Procurement API fetch error:', err.message)
        if (isMounted) {
          setError(`⚠️ LIVE DATABASE UNAVAILABLE — Cannot retrieve procurement data from ${API_BASE}/procurement (${err.message})`)
          setOrders([])
          setLoading(false)
        }
      }
    }

    fetchProcurement()

    return () => {
      isMounted = false
    }
  }, [selectedSite.id])

  const handleUpdateOrder = async (id, updateFields) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateFields),
      })
      if (!res.ok) {
        throw new Error(`PATCH failed with status ${res.status}`)
      }
      const updated = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
      return updated
    } catch (err) {
      console.error('Procurement update error:', err.message)
      alert(`Update failed: ${err.message}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle={`Purchase pipeline for ${selectedSite.name}`}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-white p-1">
            <button
              onClick={() => setView('pipeline')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                view === 'pipeline' ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
              )}
            >
              <LayoutGrid size={13} />
              Pipeline
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                view === 'table' ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
              )}
            >
              <Table2 size={13} />
              Table
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading procurement orders from PostgreSQL..." />
      ) : orders.length === 0 && !error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
          NO REAL DATA FOUND — No procurement orders exist in PostgreSQL for {selectedSite.name}.
        </div>
      ) : view === 'pipeline' ? (
        <ProcurementPipeline orders={orders} onUpdateOrder={handleUpdateOrder} />
      ) : (
        <ProcurementTable orders={orders} onUpdateOrder={handleUpdateOrder} />
      )}
    </div>
  )
}
