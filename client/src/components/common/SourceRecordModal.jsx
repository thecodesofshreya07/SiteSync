import Modal from './Modal'
import Badge from './Badge'
import { getInventoryById } from '../../data/inventory'
import { getPOById, getVendorById, getDeliveryById } from '../../data/procurement'
import { getSiteById } from '../../data/sites'
import { tasks } from '../../data/tasks'
import { getEquipmentById } from '../../data/equipment'
import { formatDate, formatFullINR } from '../../lib/utils'

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-surface-border py-2 last:border-0">
      <span className="text-xs text-navy-500">{label}</span>
      <span className="text-right text-xs font-medium text-navy-900">{value}</span>
    </div>
  )
}

function InventorySource({ id }) {
  const item = getInventoryById(id)
  if (!item) return null
  const site = getSiteById(item.siteId)
  return (
    <div>
      <Badge tone="blue">Inventory Transaction</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{item.id}</h3>
      <div className="mt-3">
        <Row label="Item" value={item.item} />
        <Row label="Site" value={site?.name} />
        <Row label="Transaction" value={item.lastTransaction?.type} />
        <Row
          label="Quantity"
          value={item.lastTransaction ? `${item.lastTransaction.quantity} ${item.unit}` : undefined}
        />
        <Row label="Date" value={item.lastTransaction ? formatDate(item.lastTransaction.date) : undefined} />
        <Row label="Related Purchase Order" value={item.lastTransaction?.relatedPO} />
        <Row label="Current Stock" value={`${item.quantity} ${item.unit}`} />
        <Row label="Reorder Threshold" value={`${item.reorderThreshold} ${item.unit}`} />
        <Row label="Consumption / day" value={`${item.consumptionPerDay} ${item.unit}`} />
      </div>
    </div>
  )
}

function ProcurementSource({ id }) {
  const po = getPOById(id)
  if (!po) return null
  const vendor = getVendorById(po.vendorId)
  const site = getSiteById(po.siteId)
  return (
    <div>
      <Badge tone="teal">Purchase Order</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{po.id}</h3>
      <div className="mt-3">
        <Row label="Item" value={po.item} />
        <Row label="Site" value={site?.name} />
        <Row label="Vendor" value={vendor?.name} />
        <Row label="Quantity" value={`${po.quantity} ${po.unit}`} />
        <Row label="Amount" value={formatFullINR(po.amount)} />
        <Row label="Date Raised" value={formatDate(po.dateRaised)} />
        <Row label="Expected Delivery" value={formatDate(po.expectedDelivery)} />
        <Row label="Stage" value={po.stage} />
        <Row label="Status" value={po.status} />
      </div>
    </div>
  )
}

function DeliverySource({ id }) {
  const delivery = getDeliveryById(id)
  if (!delivery) return null
  const po = getPOById(delivery.poId)
  return (
    <div>
      <Badge tone="amber">Delivery Record</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{delivery.id}</h3>
      <div className="mt-3">
        <Row label="Purchase Order" value={po?.id} />
        <Row label="Item" value={po?.item} />
        <Row label="Expected Date" value={formatDate(delivery.expectedDate)} />
        <Row label="Revised Date" value={formatDate(delivery.revisedDate)} />
        <Row label="Delay" value={delivery.delayDays > 0 ? `${delivery.delayDays} days` : 'On time'} />
        <Row label="Status" value={delivery.status} />
        <Row label="Reason" value={delivery.reason} />
      </div>
    </div>
  )
}

function VendorSource({ id }) {
  const vendor = getVendorById(id)
  if (!vendor) return null
  return (
    <div>
      <Badge tone="neutral">Vendor Record</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{vendor.id}</h3>
      <div className="mt-3">
        <Row label="Name" value={vendor.name} />
        <Row label="Category" value={vendor.category} />
        <Row label="Reliability" value={vendor.reliability} />
        <Row label="Avg. Delay" value={`${vendor.avgDelayDays} days`} />
      </div>
    </div>
  )
}

function TaskSource({ id }) {
  const task = tasks.find((t) => t.id === id)
  if (!task) return null
  const site = getSiteById(task.siteId)
  return (
    <div>
      <Badge tone="blue">Task Record</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{task.id}</h3>
      <div className="mt-3">
        <Row label="Name" value={task.name} />
        <Row label="Site" value={site?.name} />
        <Row label="Assignee" value={task.assignee} />
        <Row label="Progress" value={`${task.progress}%`} />
        <Row label="Due Date" value={formatDate(task.dueDate)} />
        <Row label="Dependency" value={task.dependency} />
        <Row label="Priority" value={task.priority} />
      </div>
    </div>
  )
}

function EquipmentSource({ id }) {
  const eq = getEquipmentById(id)
  if (!eq) return null
  const site = getSiteById(eq.siteId)
  return (
    <div>
      <Badge tone="amber">Equipment Record</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{eq.id}</h3>
      <div className="mt-3">
        <Row label="Name" value={eq.name} />
        <Row label="Site" value={site?.name} />
        <Row label="Status" value={eq.status} />
        <Row label="Utilization" value={`${eq.utilization}%`} />
        <Row label="Idle Days" value={eq.idleDays} />
      </div>
    </div>
  )
}

function SiteSource({ id }) {
  const site = getSiteById(id)
  if (!site) return null
  return (
    <div>
      <Badge tone="teal">Site Budget Record</Badge>
      <h3 className="mt-2 text-base font-semibold text-navy-900">{site.name}</h3>
      <div className="mt-3">
        <Row label="Planned Budget" value={formatFullINR(site.budgetPlanned)} />
        <Row label="Actual Spend" value={formatFullINR(site.budgetActual)} />
        <Row
          label="Variance"
          value={`${(((site.budgetActual - site.budgetPlanned) / site.budgetPlanned) * 100).toFixed(1)}%`}
        />
        <Row label="Status" value={site.status} />
      </div>
    </div>
  )
}

const RENDERERS = {
  inventory: InventorySource,
  procurement: ProcurementSource,
  delivery: DeliverySource,
  vendor: VendorSource,
  task: TaskSource,
  equipment: EquipmentSource,
  site: SiteSource,
}

export default function SourceRecordModal({ source, onClose }) {
  if (!source) return null
  const Renderer = RENDERERS[source.type]

  return (
    <Modal open={!!source} onClose={onClose} title="Source Record" subtitle="Verified operational record">
      {Renderer ? <Renderer id={source.id} /> : <p className="text-sm text-navy-500">Record not found.</p>}
    </Modal>
  )
}
