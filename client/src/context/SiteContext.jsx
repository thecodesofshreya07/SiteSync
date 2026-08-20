import { createContext, useEffect, useState } from 'react'
import { sites as mockSites } from '../data/sites'
import { useAuth } from '../hooks/useAuth'

export const SiteContext = createContext(null)

const API_BASE_4000 = 'http://127.0.0.1:4000/api'
const API_BASE_5000 = 'http://127.0.0.1:5000/api'

export function SiteProvider({ children }) {
  const { user } = useAuth()
  const [sites, setSites] = useState(mockSites)
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-002')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSites() {
      try {
        let res = await fetch(`${API_BASE_4000}/sites`).catch(() => null)
        if (!res || !res.ok) {
          res = await fetch(`${API_BASE_5000}/sites`).catch(() => null)
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

  // Lock site selection specifically for Contractor role
  useEffect(() => {
    if (user?.role === 'Contractor' && user?.siteId && user.siteId !== 'NA') {
      setSelectedSiteId(user.siteId)
    }
  }, [user])

  const effectiveSites = Array.isArray(sites) && sites.length > 0 ? sites : mockSites

  const activeSiteId =
    user?.role === 'Contractor' && user?.siteId && user.siteId !== 'NA'
      ? user.siteId
      : selectedSiteId

  const selectedSite =
    effectiveSites.find((s) => s.id === activeSiteId) ||
    effectiveSites[0] ||
    mockSites[1]

  const value = {
    sites: effectiveSites,
    selectedSiteId: activeSiteId,
    selectedSite,
    setSelectedSiteId: (newId) => {
      if (user?.role !== 'Contractor') {
        setSelectedSiteId(newId)
      } else {
        console.warn('Site selection is restricted for Contractor role.')
      }
    },
    loading,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
