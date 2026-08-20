export const ROLES = {
  PROJECT_MANAGER: 'Project Manager',
  CONTRACTOR: 'Contractor',
  FINANCE: 'Finance',
  ADMIN: 'Admin',
}

export const ROLE_LIST = [ROLES.PROJECT_MANAGER, ROLES.CONTRACTOR, ROLES.FINANCE, ROLES.ADMIN]

// Which nav routes each role is allowed to see.
export const ROLE_NAV_ACCESS = {
  [ROLES.PROJECT_MANAGER]: ['dashboard', 'inventory', 'procurement', 'tasks-equipment', 'assistant', 'settings'],
  [ROLES.CONTRACTOR]: ['dashboard', 'inventory', 'tasks-equipment', 'assistant', 'settings'],
  [ROLES.FINANCE]: ['dashboard', 'procurement', 'assistant', 'settings'],
  [ROLES.ADMIN]: ['dashboard', 'inventory', 'procurement', 'tasks-equipment', 'assistant', 'settings'],
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
