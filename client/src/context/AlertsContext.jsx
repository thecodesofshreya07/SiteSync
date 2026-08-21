import { createContext, useCallback, useEffect, useState } from 'react'

export const AlertsContext = createContext(null)

import { API_BASE } from '../lib/api'

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch persisted alerts directly from backend API with live auto-polling
  useEffect(() => {
    let isMounted = true
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API_BASE}/alerts`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setAlerts(Array.isArray(data) ? data : [])
            setError(null)
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Could not fetch backend alerts:', err.message)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to refresh alerts:', err.message)
    }
  }, [])

  const updateAlertStatus = useCallback(async (alertId, status) => {
    // Optimistic local state update
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)))

    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      // Re-fetch all alerts to synchronize newly created / updated cross-site alerts
      const refreshRes = await fetch(`${API_BASE}/alerts`)
      if (refreshRes.ok) {
        const freshAlerts = await refreshRes.json()
        setAlerts(Array.isArray(freshAlerts) ? freshAlerts : [])
      }
    } catch (err) {
      console.error(`Failed to persist alert ${alertId} status to backend:`, err.message)
    }
  }, [])

  const addAlert = useCallback((newAlert) => {
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
  }, [])

  const value = { alerts, updateAlertStatus, addAlert, refreshAlerts, setAlerts, loading, error }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}
