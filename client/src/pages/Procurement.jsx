import { useState, useEffect } from 'react'
import { LayoutGrid, Table2, Plus, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import ProcurementPipeline from '../components/procurement/ProcurementPipeline'
import ProcurementTable from '../components/procurement/ProcurementTable'
import CreatePOModal from '../components/procurement/CreatePOModal'
import LoadingState from '../components/common/LoadingState'
import { useSite } from '../hooks/useSite'
import { cn } from '../lib/utils'

const API_BASE = 'http://localhost:5000/api'

export default function Procurement() {
  const { selectedSite } = useSite()
  const [view, setView] = useState('pipeline')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
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
        if (!Array.isArray(data)) {
          throw new Error('Server returned non-array data for procurement')
        }
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

  const safeOrders = Array.isArray(orders) ? orders : getProcurementBySite(selectedSite.id)

  const handleCreateOrder = async (orderData) => {
    try {
      const res = await fetch(`${API_BASE}/procurement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      if (!res.ok) {
        throw new Error(`Create PO failed with status ${res.status}`)
      }
      const created = await res.json()
      if (created && created.id) {
        setOrders((prev) => [...(Array.isArray(prev) ? prev : safeOrders), created])
      }
    } catch (err) {
      console.warn('Create PO API error, applying local fallback:', err)
      const newOrder = {
        ...orderData,
        id: `PO-${Math.floor(2050 + Math.random() * 500)}`,
        dateRaised: new Date().toISOString().slice(0, 10),
        status: 'Draft',
        delayDays: 0,
      }
      setOrders((prev) => [...(Array.isArray(prev) ? prev : safeOrders), newOrder])
    }
  }

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return

    try {
      const res = await fetch(`${API_BASE}/procurement/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(`Delete failed with status ${res.status}`)
      }
      setOrders((prev) => {
        const list = Array.isArray(prev) ? prev : safeOrders
        return list.filter((o) => o.id !== id)
      })
    } catch (err) {
      console.warn('Delete PO API error, applying local fallback:', err)
      setOrders((prev) => {
        const list = Array.isArray(prev) ? prev : safeOrders
        return list.filter((o) => o.id !== id)
      })
    }
  }

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
      if (updated && updated.id) {
        setOrders((prev) => {
          const list = Array.isArray(prev) ? prev : safeOrders
          return list.map((o) => (o.id === id ? updated : o))
        })
        return updated
      }
    } catch (err) {
      console.warn('Procurement PATCH failed, applying optimistic update:', err)
      setOrders((prev) => {
        const list = Array.isArray(prev) ? prev : safeOrders
        return list.map((o) => (o.id === id ? { ...o, ...updateFields } : o))
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle={`Purchase pipeline for ${selectedSite.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              Raise PO
            </Button>
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
        <ProcurementPipeline orders={safeOrders} onUpdateOrder={handleUpdateOrder} />
      ) : (
        <ProcurementTable orders={safeOrders} onUpdateOrder={handleUpdateOrder} onDeleteOrder={handleDeleteOrder} />
      )}

      <CreatePOModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        siteId={selectedSite.id}
        siteName={selectedSite.name}
        onCreate={handleCreateOrder}
      />
    </div>
  )
}
