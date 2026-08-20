import { createContext, useEffect, useState } from 'react'

export const AlertsContext = createContext(null)

const API_BASE = 'http://localhost:4000/api'

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch persisted alerts directly from backend API
  useEffect(() => {
    let isMounted = true
    async function fetchAlerts() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/alerts`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setAlerts(Array.isArray(data) ? data : [])
          }
        } else {
          throw new Error(`HTTP ${res.status}`)
        }
      } catch (err) {
        console.error('Could not fetch backend alerts:', err.message)
        if (isMounted) {
          setError(err.message)
          setAlerts([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAlerts()

    return () => {
      isMounted = false
    }
  }, [])

  async function updateAlertStatus(alertId, status) {
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
    } catch (err) {
      console.error(`Failed to persist alert ${alertId} status to backend:`, err.message)
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

  const value = { alerts, updateAlertStatus, addAlert, setAlerts, loading, error }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}
