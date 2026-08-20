import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import LoadingState from '../components/common/LoadingState'
import InventoryFilters from '../components/inventory/InventoryFilters'
import InventoryTable from '../components/inventory/InventoryTable'
import StockTransactionModal from '../components/inventory/StockTransactionModal'
import CreateItemModal from '../components/inventory/CreateItemModal'
import PredictiveProcurementCard from '../components/inventory/PredictiveProcurementCard'
import { useSite } from '../hooks/useSite'
import { useAuth } from '../hooks/useAuth'
import { useAlerts } from '../hooks/useAlerts'
import { apiRequest } from '../lib/api'
import { Plus, PackagePlus, AlertTriangle } from 'lucide-react'

export function daysRemaining(item) {
  if (!item || !item.consumptionPerDay || item.consumptionPerDay <= 0) return 999
  return Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
}

export default function Inventory() {
  const { selectedSite } = useSite()
  const { user } = useAuth()
  const { refreshAlerts } = useAlerts()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [txnItem, setTxnItem] = useState(null)
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const canLogStock = !user || user.role === 'Admin' || user.role === 'Project Manager' || user.role === 'Contractor'
  const canAddMaterial = !user || user.role === 'Admin' || user.role === 'Project Manager'

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchInventory = async () => {
      try {
        const data = await apiRequest(`/inventory?siteId=${encodeURIComponent(selectedSite.id)}`)
        if (isMounted) {
          setItems(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch (err) {
        console.error('Inventory API fetch error:', err.message)
        if (isMounted) {
          setError(`⚠️ API error fetching inventory: ${err.message}`)
          setItems([])
          setLoading(false)
        }
      }
    }

    fetchInventory()

    return () => {
      isMounted = false
    }
  }, [selectedSite.id])

  const safeItems = Array.isArray(items) ? items : []

  const filtered = safeItems.filter((item) => {
    if (!item || !item.item) return false
    const matchesSearch = item.item.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'ALL' || item.status === status
    return matchesSearch && matchesStatus
  })

  const criticalItem = safeItems
    .filter((i) => i && (i.status === 'CRITICAL' || i.status === 'Critical'))
    .sort((a, b) => daysRemaining(a) - daysRemaining(b))[0]

  function openTransactionModal(item) {
    if (!item || !canLogStock) return
    setTxnItem(item)
    setTxnModalOpen(true)
  }

  async function handleCreateItem(itemData) {
    try {
      const created = await apiRequest('/inventory', {
        method: 'POST',
        body: JSON.stringify(itemData),
      })
      if (created && created.id) {
        setItems((prev) => [...prev, created])
        if (refreshAlerts) refreshAlerts()
      }
    } catch (err) {
      console.warn('Create inventory item API error, applying local fallback:', err)
      const newItem = {
        ...itemData,
        id: `INV-${Math.floor(100 + Math.random() * 900)}`,
        status: itemData.quantity <= itemData.reorderThreshold * 0.5 ? 'CRITICAL' : itemData.quantity <= itemData.reorderThreshold ? 'LOW' : 'OK',
        lastUpdated: new Date().toISOString(),
        lastTransaction: {
          type: 'Stock In',
          quantity: itemData.quantity,
          date: new Date().toISOString().slice(0, 10),
          note: 'Initial creation',
        },
      }
      setItems((prev) => [...prev, newItem])
    }
  }

  async function handleDeleteItem(id) {
    if (!canLogStock) return
    if (!window.confirm('Are you sure you want to remove this material from inventory?')) return

    try {
      await apiRequest(`/inventory/${id}`, {
        method: 'DELETE',
      })
      setItems((prev) => prev.filter((i) => i.id !== id))
      if (refreshAlerts) refreshAlerts()
    } catch (err) {
      console.warn('Delete API error, applying local removal fallback:', err)
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  async function handleTransaction({ type, quantity, note }) {
    if (!txnItem || !canLogStock) return

    try {
      const updatedItem = await apiRequest(`/inventory/${txnItem.id}/transaction`, {
        method: 'POST',
        body: JSON.stringify({ type, quantity, note }),
      })

      if (updatedItem && updatedItem.id) {
        setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)))
        if (refreshAlerts) refreshAlerts()
      }
    } catch (err) {
      console.warn('Transaction API call failed, applying optimistic local update:', err)
      setItems((prev) => {
        return prev.map((i) => {
          if (i.id !== txnItem.id) return i
          let newQty = i.quantity
          if (type === 'Stock In') newQty += quantity
          if (type === 'Stock Out' || type === 'Transfer') newQty -= quantity
          newQty = Math.max(newQty, 0)
          const newStatus =
            newQty <= i.reorderThreshold * 0.5 ? 'CRITICAL' : newQty <= i.reorderThreshold ? 'LOW' : 'OK'
          return {
            ...i,
            quantity: newQty,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            lastTransaction: {
              type,
              quantity,
              date: new Date().toISOString().slice(0, 10),
              relatedPO: i.lastTransaction?.relatedPO,
              note,
            },
          }
        })
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`Material stock across ${selectedSite.name}`}
        actions={
          canLogStock ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={Plus}
                onClick={() => setCreateModalOpen(true)}
              >
                Add Material
              </Button>
              <Button
                variant="primary"
                icon={PackagePlus}
                onClick={() => items.length > 0 && openTransactionModal(items[0])}
                disabled={items.length === 0}
              >
                Log Stock
              </Button>
            </div>
          ) : null
        }
      />

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading inventory from PostgreSQL..." />
      ) : safeItems.length === 0 && !error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
          No inventory records exist for {selectedSite.name}.
        </div>
      ) : (
        <>
          {criticalItem && (
            <div className="mb-5">
              <PredictiveProcurementCard
                item={criticalItem}
                onReview={() => canLogStock && openTransactionModal(criticalItem)}
                onOpenProcurement={() => navigate('/procurement')}
              />
            </div>
          )}

          <div className="mb-4">
            <InventoryFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />
          </div>

          <InventoryTable
            items={filtered}
            onLogTransaction={canLogStock ? openTransactionModal : undefined}
            onDeleteItem={canLogStock ? handleDeleteItem : undefined}
          />
        </>
      )}

      {canLogStock && (
        <>
          <StockTransactionModal
            open={txnModalOpen}
            item={txnItem}
            onClose={() => setTxnModalOpen(false)}
            onSubmit={handleTransaction}
          />

          <CreateItemModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            siteId={selectedSite.id}
            siteName={selectedSite.name}
            onCreate={handleCreateItem}
          />
        </>
      )}
    </div>
  )
}
