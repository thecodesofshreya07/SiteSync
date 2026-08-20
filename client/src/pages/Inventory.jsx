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
<<<<<<< HEAD
import { getInventoryBySite, daysRemaining } from '../data/inventory'
import { Plus, PackagePlus } from 'lucide-react'
=======
import { PackagePlus, AlertTriangle } from 'lucide-react'
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419

const API_BASE = 'http://localhost:4000/api'

export function daysRemaining(item) {
  if (!item || !item.consumptionPerDay || item.consumptionPerDay <= 0) return 999
  return Math.round((item.quantity / item.consumptionPerDay) * 10) / 10
}

export default function Inventory() {
  const { selectedSite } = useSite()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [txnItem, setTxnItem] = useState(null)
  const [txnModalOpen, setTxnModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchInventory = async () => {
      try {
        const res = await fetch(`${API_BASE}/inventory?siteId=${encodeURIComponent(selectedSite.id)}`)
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`)
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error('Server returned non-array data for inventory')
        }
        if (isMounted) {
          setItems(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Inventory API fetch error:', err.message)
        if (isMounted) {
          setError(`⚠️ LIVE DATABASE UNAVAILABLE — Cannot retrieve current inventory data from ${API_BASE}/inventory (${err.message})`)
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

  const filtered = items.filter((item) => {
    if (!item || !item.item) return false
    const matchesSearch = item.item.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'ALL' || item.status === status
    return matchesSearch && matchesStatus
  })

  const criticalItem = items
    .filter((i) => i && (i.status === 'CRITICAL' || i.status === 'Critical'))
    .sort((a, b) => daysRemaining(a) - daysRemaining(b))[0]

  function openTransactionModal(item) {
    if (!item) return
    setTxnItem(item)
    setTxnModalOpen(true)
  }

  async function handleCreateItem(itemData) {
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      if (!res.ok) {
        throw new Error(`Create failed with status ${res.status}`)
      }
      const created = await res.json()
      if (created && created.id) {
        setItems((prev) => [...prev, created])
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
    if (!window.confirm('Are you sure you want to remove this material from inventory?')) return

    try {
      const res = await fetch(`${API_BASE}/inventory/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(`Delete failed with status ${res.status}`)
      }
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.warn('Delete API error, applying local removal fallback:', err)
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  async function handleTransaction({ type, quantity, note }) {
    if (!txnItem) return

    try {
      const res = await fetch(`${API_BASE}/inventory/${txnItem.id}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, quantity, note }),
      })

      if (!res.ok) {
        throw new Error(`Transaction failed with status ${res.status}`)
      }

      const updatedItem = await res.json()
      if (updatedItem && updatedItem.id) {
        setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)))
      }
    } catch (err) {
<<<<<<< HEAD
      console.warn('Transaction API call failed, applying optimistic local update:', err)
      setItems((prev) => {
        const list = Array.isArray(prev) ? prev : safeItems
        return list.map((i) => {
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
=======
      console.error('Transaction API call error:', err.message)
      alert(`Transaction failed: ${err.message}`)
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`Material stock across ${selectedSite.name}`}
        actions={
<<<<<<< HEAD
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
              onClick={() => safeItems.length > 0 && openTransactionModal(safeItems[0])}
              disabled={safeItems.length === 0}
            >
              Log Stock
            </Button>
          </div>
=======
          <Button
            variant="primary"
            icon={PackagePlus}
            onClick={() => items.length > 0 && openTransactionModal(items[0])}
            disabled={items.length === 0}
          >
            Add Stock
          </Button>
>>>>>>> 9ec1c5ff38cf68cffa967dfdbd6299686e4c6419
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
      ) : items.length === 0 && !error ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-medium">
          NO REAL DATA FOUND — No inventory records exist in PostgreSQL for {selectedSite.name}.
        </div>
      ) : (
        <>
          {criticalItem && (
            <div className="mb-5">
              <PredictiveProcurementCard
                item={criticalItem}
                onReview={() => openTransactionModal(criticalItem)}
                onOpenProcurement={() => navigate('/procurement')}
              />
            </div>
          )}

          <div className="mb-4">
            <InventoryFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />
          </div>

          <InventoryTable
            items={filtered}
            onLogTransaction={openTransactionModal}
            onDeleteItem={handleDeleteItem}
          />
        </>
      )}

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
    </div>
  )
}
