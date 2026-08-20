import { useContext } from 'react'
import { AlertsContext } from '../context/AlertsContext'

export function useAlerts() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlerts must be used within an AlertsProvider')
  return ctx
}
