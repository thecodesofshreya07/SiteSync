import { createContext, useEffect, useState } from 'react'
import { sites as mockSites } from '../data/sites'

export const SiteContext = createContext(null)

const API_BASE_5000 = 'http://127.0.0.1:5000/api'
const API_BASE_4000 = 'http://127.0.0.1:4000/api'

export function SiteProvider({ children }) {
  const [sites, setSites] = useState(mockSites)
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-002') // default to Site B
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSites() {
      try {
        let res = await fetch(`${API_BASE_5000}/sites`).catch(() => null)
        if (!res || !res.ok) {
          res = await fetch(`${API_BASE_4000}/sites`).catch(() => null)
        }

        if (res && res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setSites(data)
          }
        }
      } catch (err) {
        console.warn('Failed to load sites from backend API, using mock fallback:', err.message)
      }
    }

    loadSites()

    return () => {
      isMounted = false
    }
  }, [])

  const effectiveSites = Array.isArray(sites) && sites.length > 0 ? sites : mockSites

  const selectedSite =
    effectiveSites.find((s) => s.id === selectedSiteId) ||
    effectiveSites[0] ||
    mockSites[1]

  const value = {
    sites: effectiveSites,
    selectedSiteId,
    selectedSite,
    setSelectedSiteId,
    loading,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
