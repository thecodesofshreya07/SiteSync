import { createContext, useState } from 'react'
import { ROLES, ROLE_NAV_ACCESS } from '../lib/constants'

export const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES.PROJECT_MANAGER)

  const value = {
    role,
    setRole,
    allowedRoutes: ROLE_NAV_ACCESS[role] || [],
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
