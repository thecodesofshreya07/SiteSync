export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Formats a number as Indian-style currency shorthand, e.g. 48200000 -> "₹4.82 Cr"
export function formatINR(value, opts = {}) {
  const { decimals = 2, showSymbol = true } = opts
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const symbol = showSymbol ? '₹' : ''

  if (abs >= 1_00_00_000) {
    return `${sign}${symbol}${(abs / 1_00_00_000).toFixed(decimals)} Cr`
  }
  if (abs >= 1_00_000) {
    return `${sign}${symbol}${(abs / 1_00_000).toFixed(decimals)} L`
  }
  return `${sign}${symbol}${abs.toLocaleString('en-IN')}`
}

export function formatFullINR(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatDate(dateStr, opts = {}) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return 'Just now'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Just now'

  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60 && diffSec >= 0) return 'Just now'
  if (diffSec < 3600 && diffSec >= 0) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400 && diffSec >= 0) return `${Math.floor(diffSec / 3600)}h ago`

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function daysBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

export function percentage(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}
