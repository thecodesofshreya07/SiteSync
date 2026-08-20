import { createContext, useEffect, useState } from 'react'
import { sites as defaultSites } from '../data/sites'

export const SiteContext = createContext(null)

const API_BASE = 'http://localhost:5000/api'

export function SiteProvider({ children }) {
  const [sites, setSites] = useState(defaultSites)
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-002') // default to Site B
  const [loading, setLoading] = useState(false)

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
        console.warn('Failed to load sites from backend API, using local sites:', err.message)
      }
    }
    loadSites()
  }, [])

  const selectedSite =
    sites.find((s) => s.id === selectedSiteId) ||
    defaultSites.find((s) => s.id === selectedSiteId) ||
    sites[0] ||
    defaultSites[0]

  const value = {
    sites: sites.length > 0 ? sites : defaultSites,
    selectedSiteId,
    selectedSite,
    setSelectedSiteId,
    loading,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
