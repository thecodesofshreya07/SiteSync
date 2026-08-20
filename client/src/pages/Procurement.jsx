import { useState, useEffect } from 'react'
import { LayoutGrid, Table2, Plus, AlertTriangle, Award } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import ProcurementPipeline from '../components/procurement/ProcurementPipeline'
import ProcurementTable from '../components/procurement/ProcurementTable'
import VendorIntelligence from '../components/procurement/VendorIntelligence'
import CreatePOModal from '../components/procurement/CreatePOModal'
import LoadingState from '../components/common/LoadingState'
import { useSite } from '../hooks/useSite'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../lib/api'
import { cn } from '../lib/utils'

export default function Procurement() {
  const { selectedSite } = useSite()
  const { user } = useAuth()
  const [view, setView] = useState('pipeline')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [error, setError] = useState(null)

  const role = user?.role || 'Guest'
  const canCreateRequest = role === 'Contractor' || role === 'Admin' || role === 'Project Manager'

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchProcurement = async () => {
      try {
        const data = await apiRequest(`/procurement?siteId=${encodeURIComponent(selectedSite.id)}`)
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch (err) {
        console.error('Procurement API fetch error:', err.message)
        if (isMounted) {
          setError(`⚠️ API error fetching procurement: ${err.message}`)
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

  const safeOrders = Array.isArray(orders) ? orders : []

  const handleCreateOrder = async (orderData) => {
    try {
      const created = await apiRequest('/procurement', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })
      if (created && created.id) {
        setOrders((prev) => [...(Array.isArray(prev) ? prev : safeOrders), created])
      }
    } catch (err) {
      console.warn('Create PO API error, applying local fallback:', err)
      const newOrder = {
        ...orderData,
        id: `PO-${Math.floor(2050 + Math.random() * 500)}`,
        dateRaised: new Date().toISOString().slice(0, 10),
        status: 'Pending PM Validation',
        delayDays: 0,
      }
      setOrders((prev) => [...(Array.isArray(prev) ? prev : safeOrders), newOrder])
    }
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      await apiRequest(`/procurement/${orderId}`, {
        method: 'DELETE',
      })
      setOrders((prev) => {
        const list = Array.isArray(prev) ? prev : safeOrders
        return list.filter((o) => o.id !== orderId)
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
      const updated = await apiRequest(`/procurement/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields),
      })
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
        subtitle={`Purchase pipeline & material workflow for ${selectedSite.name}`}
        actions={
          <div className="flex items-center gap-2">
            {canCreateRequest && (
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setCreateModalOpen(true)}
              >
                {role === 'Contractor' ? '+ Material Request' : 'Raise PO'}
              </Button>
            )}
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
              <button
                onClick={() => setView('intelligence')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  view === 'intelligence' ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
                )}
              >
                <Award size={13} />
                Vendor Intelligence
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
      ) : view === 'intelligence' ? (
        <VendorIntelligence />
      ) : safeOrders.length === 0 && !error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
          No procurement orders exist for {selectedSite.name}. {canCreateRequest ? 'Click "+ Material Request" to create one.' : ''}
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
