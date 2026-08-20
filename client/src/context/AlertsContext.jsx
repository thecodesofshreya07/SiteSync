import { createContext, useState } from 'react'
import { initialAlerts } from '../data/alerts'

export const AlertsContext = createContext(null)

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState(initialAlerts)

  function updateAlertStatus(alertId, status) {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)))
  }

  const value = { alerts, updateAlertStatus }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}
