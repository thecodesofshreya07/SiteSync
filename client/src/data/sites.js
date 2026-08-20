export const sites = [
  {
    id: 'SITE-001',
    name: 'Riverside Tower',
    location: 'Bandra East, Mumbai',
    type: 'Residential High-Rise',
    status: 'On Track',
    manager: 'Shreya Mishra',
    budgetPlanned: 62000000, // ₹6.20 Cr
    budgetActual: 48200000, // ₹4.82 Cr
    progress: 58,
    startDate: '2025-11-04',
    targetDate: '2027-02-28',
    lastScan: '2026-08-19T10:42:15',
  },
  {
    id: 'SITE-002',
    name: 'Warehouse Expansion',
    location: 'Bhiwandi, Thane',
    type: 'Industrial / Warehouse',
    status: 'At Risk',
    manager: 'Shreya Mishra',
    budgetPlanned: 31000000, // ₹3.10 Cr
    budgetActual: 34658000, // 11.8% over plan
    progress: 41,
    startDate: '2026-02-10',
    targetDate: '2026-11-15',
    lastScan: '2026-08-19T10:42:15',
  },
  {
    id: 'SITE-003',
    name: 'Metro Heights',
    location: 'Powai, Mumbai',
    type: 'Commercial Mixed-Use',
    status: 'On Track',
    manager: 'Arjun Kulkarni',
    budgetPlanned: 89000000, // ₹8.90 Cr
    budgetActual: 52000000,
    progress: 34,
    startDate: '2026-01-20',
    targetDate: '2027-09-30',
    lastScan: '2026-08-19T10:38:02',
  },
  {
    id: 'SITE-004',
    name: 'Greenfield Commercial Complex',
    location: 'Hinjewadi, Pune',
    type: 'Commercial Mixed-Use',
    status: 'On Track',
    manager: 'Neha Patwardhan',
    budgetPlanned: 45500000,
    budgetActual: 19800000,
    progress: 19,
    startDate: '2026-05-01',
    targetDate: '2027-12-31',
    lastScan: '2026-08-19T10:35:44',
  },
]

export function getSiteById(siteId) {
  return sites.find((s) => s.id === siteId)
}

// Category-level planned vs actual spend, used by the Budget Overview chart.
export const budgetByCategory = {
  'SITE-001': [
    { category: 'Materials', planned: 24000000, actual: 20100000 },
    { category: 'Labor', planned: 16000000, actual: 15200000 },
    { category: 'Equipment', planned: 12000000, actual: 8400000 },
    { category: 'Procurement', planned: 10000000, actual: 4500000 },
  ],
  'SITE-002': [
    { category: 'Materials', planned: 13000000, actual: 14200000 },
    { category: 'Labor', planned: 8500000, actual: 9900000 },
    { category: 'Equipment', planned: 5500000, actual: 7600000 },
    { category: 'Procurement', planned: 4000000, actual: 2958000 },
  ],
  'SITE-003': [
    { category: 'Materials', planned: 34000000, actual: 20500000 },
    { category: 'Labor', planned: 22000000, actual: 13800000 },
    { category: 'Equipment', planned: 18000000, actual: 10200000 },
    { category: 'Procurement', planned: 15000000, actual: 7500000 },
  ],
  'SITE-004': [
    { category: 'Materials', planned: 18000000, actual: 8200000 },
    { category: 'Labor', planned: 12000000, actual: 5100000 },
    { category: 'Equipment', planned: 9500000, actual: 4000000 },
    { category: 'Procurement', planned: 6000000, actual: 2500000 },
  ],
}

export function getBudgetByCategory(siteId) {
  return budgetByCategory[siteId] || []
}
