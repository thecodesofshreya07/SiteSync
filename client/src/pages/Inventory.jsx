import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import LoadingState from '../components/common/LoadingState'
import InventoryFilters from '../components/inventory/InventoryFilters'
import InventoryTable from '../components/inventory/InventoryTable'
import StockTransactionModal from '../components/inventory/StockTransactionModal'
import PredictiveProcurementCard from '../components/inventory/PredictiveProcurementCard'
import { useSite } from '../hooks/useSite'
import { PackagePlus, AlertTriangle } from 'lucide-react'

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
      console.error('Transaction API call error:', err.message)
      alert(`Transaction failed: ${err.message}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`Material stock across ${selectedSite.name}`}
        actions={
          <Button
            variant="primary"
            icon={PackagePlus}
            onClick={() => items.length > 0 && openTransactionModal(items[0])}
            disabled={items.length === 0}
          >
            Add Stock
          </Button>
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

          <InventoryTable items={filtered} onLogTransaction={openTransactionModal} />
        </>
      )}

      <StockTransactionModal
        open={txnModalOpen}
        item={txnItem}
        onClose={() => setTxnModalOpen(false)}
        onSubmit={handleTransaction}
      />
    </div>
  )
}
