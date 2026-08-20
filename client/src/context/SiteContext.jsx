import { createContext, useEffect, useState } from 'react'

export const SiteContext = createContext(null)

const API_BASE = 'http://localhost:4000/api'

export function SiteProvider({ children }) {
  const [sites, setSites] = useState([])
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-002') // default to Site B
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSites() {
      try {
        const res = await fetch(`${API_BASE}/sites`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setSites(data)
            if (!selectedSiteId) {
              setSelectedSiteId(data[0].id)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load sites from backend API:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadSites()
  }, [])

  const selectedSite =
    sites.find((s) => s.id === selectedSiteId) ||
    sites[0] || {
      id: selectedSiteId || 'SITE-002',
      name: 'Site B — Warehouse Expansion',
      location: 'Bhiwandi, Thane',
      status: 'At Risk',
      budgetPlanned: 31000000,
      budgetActual: 34658000,
      progress: 41,
      lastScan: new Date().toISOString(),
    }

  const value = {
    sites,
    selectedSiteId,
    selectedSite,
    setSelectedSiteId,
    loading,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
