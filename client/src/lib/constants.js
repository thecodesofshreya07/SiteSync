export const ROLES = {
  PROJECT_MANAGER: 'Project Manager',
  CONTRACTOR: 'Contractor',
  FINANCE: 'Accountant',
  ACCOUNTANT: 'Accountant',
  ADMIN: 'Admin',
}

export const ROLE_LIST = [ROLES.PROJECT_MANAGER, ROLES.CONTRACTOR, ROLES.ACCOUNTANT, ROLES.ADMIN]

// Which nav routes each role is allowed to see.
export const ROLE_NAV_ACCESS = {
  [ROLES.PROJECT_MANAGER]: ['dashboard', 'inventory', 'procurement', 'tasks-equipment', 'assistant', 'settings'],
  [ROLES.CONTRACTOR]: ['dashboard', 'inventory', 'procurement', 'tasks-equipment', 'settings'],
  [ROLES.ACCOUNTANT]: ['dashboard', 'procurement', 'settings'],
  [ROLES.FINANCE]: ['dashboard', 'procurement', 'settings'],
  [ROLES.ADMIN]: ['dashboard', 'inventory', 'procurement', 'tasks-equipment', 'assistant', 'settings', 'user-management'],
}

// Realistic material unit market rates in INR (₹)
export const MATERIAL_UNIT_PRICES = [
  { item: 'Cement Portland Type I', pricePerUnit: 380, defaultUnit: 'bags' },
  { item: 'UltraTech Cement 53 Grade', pricePerUnit: 410, defaultUnit: 'bags' },
  { item: 'Sand', pricePerUnit: 2400, defaultUnit: 'cu.m' },
  { item: 'Sand & Aggregate', pricePerUnit: 2400, defaultUnit: 'cu.m' },
  { item: 'Aggregate', pricePerUnit: 2100, defaultUnit: 'cu.m' },
  { item: 'Steel Rebar 12mm', pricePerUnit: 65000, defaultUnit: 'tonnes' },
  { item: 'Structural Steel', pricePerUnit: 70000, defaultUnit: 'tonnes' },
  { item: 'Bricks', pricePerUnit: 8.4, defaultUnit: 'units' },
  { item: 'PVC Pipes', pricePerUnit: 420, defaultUnit: 'units' },
  { item: 'Electrical Cable', pricePerUnit: 290, defaultUnit: 'meters' },
]

export function calculateMaterialAmount(itemName, quantity, unit) {
  const qty = Number(quantity) || 1
  if (!itemName) return qty * 500

  const normalized = String(itemName).trim().toLowerCase()
  const found = MATERIAL_UNIT_PRICES.find((m) => normalized.includes(m.item.toLowerCase()))

  if (found) {
    return Math.round(qty * found.pricePerUnit)
  }

  // Unit-based fallback market rate calculation
  const cleanUnit = String(unit || '').toLowerCase()
  if (cleanUnit === 'bags') return qty * 390
  if (cleanUnit === 'cu.m') return qty * 2300
  if (cleanUnit === 'tonnes') return qty * 68000
  if (cleanUnit === 'meters') return qty * 250
  if (cleanUnit === 'units') return qty * 15

  return Math.round(qty * 500)
}

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  WARNING: 'warning',
  MEDIUM: 'medium',
}

export const SEVERITY_STYLES = {
  critical: {
    label: 'CRITICAL',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-600',
    badgeBg: 'bg-red-500',
  },
  high: {
    label: 'HIGH',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    text: 'text-red-600',
    badgeBg: 'bg-red-500',
  },
  warning: {
    label: 'WARNING',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-500',
  },
  medium: {
    label: 'MEDIUM',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-500',
  },
}

export const ALERT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DISMISSED: 'dismissed',
  SNOOZED: 'snoozed',
}

export const AGENT_EVENT_TYPE = {
  CHECKING: 'checking',
  ANALYZING: 'analyzing',
  RETRIEVING: 'retrieving',
  INVESTIGATING: 'investigating',
  FLAGGED: 'flagged',
  RECOMMENDATION: 'recommendation',
  WAITING: 'waiting',
  RESOLVED: 'resolved',
  IDLE: 'idle',
}

export const AGENT_EVENT_STYLES = {
  checking: { dot: 'bg-blue-500', text: 'text-navy-700' },
  analyzing: { dot: 'bg-blue-500', text: 'text-navy-700' },
  retrieving: { dot: 'bg-blue-500', text: 'text-navy-700' },
  investigating: { dot: 'bg-blue-500', text: 'text-navy-700' },
  flagged: { dot: 'bg-amber-500', text: 'text-amber-600' },
  recommendation: { dot: 'bg-teal-500', text: 'text-teal-600' },
  waiting: { dot: 'bg-amber-500', text: 'text-amber-600' },
  resolved: { dot: 'bg-green-500', text: 'text-green-600' },
  idle: { dot: 'bg-teal-400', text: 'text-teal-300' },
}
