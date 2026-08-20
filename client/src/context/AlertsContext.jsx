import { createContext, useEffect, useState } from 'react'
import { initialAlerts } from '../data/alerts'

export const AlertsContext = createContext(null)

const API_BASE = 'http://localhost:5000/api'

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(initialAlerts)

  // Fetch persisted alerts from backend on mount
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API_BASE}/alerts`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setAlerts(data)
          }
        }
      } catch (err) {
        console.warn('Could not fetch backend alerts, using initialAlerts fallback:', err.message)
      }
    }
    fetchAlerts()
  }, [])

  async function updateAlertStatus(alertId, status) {
    // Optimistic local state update
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)))

    try {
      await fetch(`${API_BASE}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch (err) {
      console.warn(`Failed to persist alert ${alertId} status to backend:`, err.message)
    }
  }

  function addAlert(newAlert) {
    if (!newAlert || !newAlert.id) return
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.id === newAlert.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], ...newAlert, status: updated[idx].status }
        return updated
      }
      return [newAlert, ...prev]
    })
  }

  const value = { alerts, updateAlertStatus, addAlert, setAlerts }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}
