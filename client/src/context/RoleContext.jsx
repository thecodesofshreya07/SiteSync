import { createContext } from 'react'
import { ROLES, ROLE_NAV_ACCESS } from '../lib/constants'
import { useAuth } from '../hooks/useAuth'

export const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const role = user?.role || ROLES.PROJECT_MANAGER

  const value = {
    role,
    setRole: () => {
      console.warn('Role changes are controlled by authenticated accounts.')
    },
    allowedRoutes: ROLE_NAV_ACCESS[role] || [],
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
