import { createContext, useState } from 'react'
import { sites } from '../data/sites'

export const SiteContext = createContext(null)

export function SiteProvider({ children }) {
  const [selectedSiteId, setSelectedSiteId] = useState(sites[1].id) // default to Site B for the demo story

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0]

  const value = {
    sites,
    selectedSiteId,
    selectedSite,
    setSelectedSiteId,
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}
