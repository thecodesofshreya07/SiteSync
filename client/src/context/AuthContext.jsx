import { createContext, useState, useEffect } from 'react'
import { apiRequest, getToken, setToken } from '../lib/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      const existingToken = getToken()
      if (!existingToken) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await apiRequest('/auth/me')
        if (res && res.user) {
          setUser(res.user)
        } else {
          setToken('')
          setUser(null)
        }
      } catch (err) {
        console.warn('Authentication token verification failed:', err.message)
        setToken('')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data && data.token && data.user) {
        setToken(data.token)
        setUser(data.user)
        return data.user
      }
      throw new Error('Invalid server authentication response')
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    role: user?.role || 'Guest',
    token: getToken(),
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
