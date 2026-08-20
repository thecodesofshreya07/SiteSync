import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import InventoryFilters from '../components/inventory/InventoryFilters'
import InventoryTable from '../components/inventory/InventoryTable'
import StockTransactionModal from '../components/inventory/StockTransactionModal'
import PredictiveProcurementCard from '../components/inventory/PredictiveProcurementCard'
import { useSite } from '../hooks/useSite'
import { getInventoryBySite, daysRemaining } from '../data/inventory'
import { PackagePlus } from 'lucide-react'

export default function Inventory() {
  const { selectedSite } = useSite()
  const navigate = useNavigate()
  const [items, setItems] = useState(() => getInventoryBySite(selectedSite.id))
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [txnItem, setTxnItem] = useState(null)
  const [txnModalOpen, setTxnModalOpen] = useState(false)

  // Re-sync when site changes.
  useMemo(() => {
    setItems(getInventoryBySite(selectedSite.id))
  }, [selectedSite.id])

  const filtered = items.filter((item) => {
    const matchesSearch = item.item.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'ALL' || item.status === status
    return matchesSearch && matchesStatus
  })

  const criticalItem = items
    .filter((i) => i.status === 'CRITICAL')
    .sort((a, b) => daysRemaining(a) - daysRemaining(b))[0]

  function openTransactionModal(item) {
    setTxnItem(item)
    setTxnModalOpen(true)
  }

  function handleTransaction({ type, quantity }) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== txnItem.id) return i
        let newQty = i.quantity
        if (type === 'Stock In') newQty += quantity
        if (type === 'Stock Out' || type === 'Transfer') newQty -= quantity
        newQty = Math.max(newQty, 0)
        const status = newQty <= i.reorderThreshold * 0.5 ? 'CRITICAL' : newQty <= i.reorderThreshold ? 'LOW' : 'OK'
        return {
          ...i,
          quantity: newQty,
          status,
          lastUpdated: new Date().toISOString(),
          lastTransaction: { type, quantity, date: new Date().toISOString().slice(0, 10), relatedPO: i.lastTransaction?.relatedPO },
        }
      })
    )
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`Material stock across ${selectedSite.name}`}
        actions={
          <Button variant="primary" icon={PackagePlus} onClick={() => openTransactionModal(items[0])}>
            Add Stock
          </Button>
        }
      />

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

      <StockTransactionModal
        open={txnModalOpen}
        item={txnItem}
        onClose={() => setTxnModalOpen(false)}
        onSubmit={handleTransaction}
      />
    </div>
  )
}
