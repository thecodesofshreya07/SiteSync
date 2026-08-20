import ProcurementCard from './ProcurementCard'

export const PROCUREMENT_STAGES = [
  'Material Request',
  'Vendor Quote',
  'Approval',
  'Purchase Order',
  'Delivery',
  'Expense',
]

export default function ProcurementPipeline({ orders, onUpdateOrder }) {
  const safeOrders = Array.isArray(orders) ? orders : []
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[1100px] gap-3">
        {PROCUREMENT_STAGES.map((stage) => {
          const stageOrders = safeOrders.filter((o) => o.stage === stage)
          return (
            <div key={stage} className="w-[180px] shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-2xs font-semibold uppercase tracking-wide text-navy-500">{stage}</p>
                <span className="rounded-full bg-navy-900/5 px-1.5 py-0.5 text-2xs font-semibold text-navy-500">
                  {stageOrders.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageOrders.map((po) => (
                  <ProcurementCard key={po.id} po={po} onUpdateOrder={onUpdateOrder} />
                ))}
                {stageOrders.length === 0 && (
                  <div className="rounded-lg border border-dashed border-surface-border py-6 text-center text-2xs text-navy-400">
                    No orders
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
