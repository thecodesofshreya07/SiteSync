// Pipeline stages, in order.
export const PROCUREMENT_STAGES = [
  'Material Request',
  'Vendor Quote',
  'Approval',
  'Purchase Order',
  'Delivery',
  'Expense',
]

export const vendors = [
  { id: 'VEN-017', name: 'BuildPro Materials', category: 'Cement & Aggregates', reliability: 'Moderate', avgDelayDays: 3.5 },
  { id: 'VEN-022', name: 'Metro Steel Ltd', category: 'Steel & Rebar', reliability: 'High', avgDelayDays: 0.5 },
  { id: 'VEN-009', name: 'Konkan Aggregates Co.', category: 'Sand & Aggregate', reliability: 'High', avgDelayDays: 1 },
  { id: 'VEN-031', name: 'Shakti Electricals', category: 'Electrical', reliability: 'High', avgDelayDays: 0.8 },
  { id: 'VEN-014', name: 'Vishal Brick Works', category: 'Bricks & Blocks', reliability: 'Moderate', avgDelayDays: 2 },
]

export const procurementOrders = [
  {
    id: 'PO-2041',
    siteId: 'SITE-002',
    item: 'Cement Portland Type I',
    vendorId: 'VEN-017',
    quantity: 500,
    unit: 'bags',
    amount: 425000,
    dateRaised: '2026-08-10',
    expectedDelivery: '2026-08-17',
    stage: 'Delivery',
    status: 'Delivery delayed',
    deliveryId: 'DEL-882',
    delayDays: 4,
  },
  {
    id: 'PO-2045',
    siteId: 'SITE-002',
    item: 'Steel Rebar 12mm',
    vendorId: 'VEN-022',
    quantity: 8,
    unit: 'tonnes',
    amount: 840000,
    dateRaised: '2026-08-12',
    expectedDelivery: '2026-08-15',
    stage: 'Purchase Order',
    status: 'Approved',
    deliveryId: null,
    delayDays: 0,
  },
  {
    id: 'PO-2038',
    siteId: 'SITE-001',
    item: 'Structural Steel',
    vendorId: 'VEN-022',
    quantity: 12,
    unit: 'tonnes',
    amount: 1260000,
    dateRaised: '2026-08-08',
    expectedDelivery: '2026-08-16',
    stage: 'Expense',
    status: 'Completed',
    deliveryId: 'DEL-871',
    delayDays: 0,
  },
  {
    id: 'PO-2036',
    siteId: 'SITE-001',
    item: 'Sand & Aggregate',
    vendorId: 'VEN-009',
    quantity: 130,
    unit: 'cu.m',
    amount: 312000,
    dateRaised: '2026-08-09',
    expectedDelivery: '2026-08-17',
    stage: 'Expense',
    status: 'Completed',
    deliveryId: 'DEL-865',
    delayDays: 0,
  },
  {
    id: 'PO-2043',
    siteId: 'SITE-002',
    item: 'Bricks',
    vendorId: 'VEN-014',
    quantity: 20000,
    unit: 'units',
    amount: 168000,
    dateRaised: '2026-08-13',
    expectedDelivery: '2026-08-21',
    stage: 'Vendor Quote',
    status: 'Pending quote confirmation',
    deliveryId: null,
    delayDays: 0,
  },
  {
    id: 'PO-2029',
    siteId: 'SITE-003',
    item: 'Bricks',
    vendorId: 'VEN-014',
    quantity: 15000,
    unit: 'units',
    amount: 126000,
    dateRaised: '2026-08-05',
    expectedDelivery: '2026-08-15',
    stage: 'Expense',
    status: 'Completed',
    deliveryId: 'DEL-849',
    delayDays: 0,
  },
  {
    id: 'PO-2022',
    siteId: 'SITE-003',
    item: 'PVC Pipes',
    vendorId: 'VEN-031',
    quantity: 200,
    unit: 'units',
    amount: 84000,
    dateRaised: '2026-08-01',
    expectedDelivery: '2026-08-12',
    stage: 'Expense',
    status: 'Completed',
    deliveryId: 'DEL-830',
    delayDays: 0,
  },
  {
    id: 'PO-2018',
    siteId: 'SITE-004',
    item: 'Electrical Cable',
    vendorId: 'VEN-031',
    quantity: 500,
    unit: 'meters',
    amount: 145000,
    dateRaised: '2026-07-28',
    expectedDelivery: '2026-08-11',
    stage: 'Expense',
    status: 'Completed',
    deliveryId: 'DEL-812',
    delayDays: 0,
  },
  {
    id: 'PO-2049',
    siteId: 'SITE-004',
    item: 'Structural Steel',
    vendorId: 'VEN-022',
    quantity: 6,
    unit: 'tonnes',
    amount: 630000,
    dateRaised: '2026-08-17',
    expectedDelivery: '2026-08-24',
    stage: 'Material Request',
    status: 'Awaiting vendor quote',
    deliveryId: null,
    delayDays: 0,
  },
]

export const deliveries = [
  {
    id: 'DEL-882',
    poId: 'PO-2041',
    expectedDate: '2026-08-17',
    revisedDate: '2026-08-21',
    delayDays: 4,
    status: 'Delayed',
    reason: 'Vendor transport shortage reported by BuildPro Materials',
  },
  {
    id: 'DEL-871',
    poId: 'PO-2038',
    expectedDate: '2026-08-16',
    revisedDate: '2026-08-16',
    delayDays: 0,
    status: 'Delivered',
    reason: null,
  },
]

export function getVendorById(vendorId) {
  return vendors.find((v) => v.id === vendorId)
}

export function getPOById(poId) {
  return procurementOrders.find((p) => p.id === poId)
}

export function getDeliveryById(deliveryId) {
  return deliveries.find((d) => d.id === deliveryId)
}

export function getProcurementBySite(siteId) {
  return procurementOrders.filter((p) => p.siteId === siteId)
}
