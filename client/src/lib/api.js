const envUrl = (import.meta.env.VITE_API_URL || '').split('||')[0].trim()
const rawApiUrl = envUrl.replace(/\/+$/, '')
export const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : 'http://localhost:4000/api'
export const API_FALLBACK = 'http://127.0.0.1:4000/api'

export function getToken() {
  return localStorage.getItem('sitesync_token') || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('sitesync_token', token)
  } else {
    localStorage.removeItem('sitesync_token')
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let url = `${API_BASE}${cleanEndpoint}`

  try {
    let response = await fetch(url, config).catch(() => null)

    if (!response) {
      const fallbackUrl = `${API_FALLBACK}${cleanEndpoint}`
      response = await fetch(fallbackUrl, config).catch(() => null)
    }

    if (!response) {
      throw new Error('Backend server is unavailable on port 4000.')
    }

    if (response.status === 401) {
      setToken('')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Session expired. Please log in again.')
    }

    if (response.status === 403) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Access Denied: You do not have permission for this resource.')
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`)
      }
      return data
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response
  } catch (err) {
    throw err
  }
}
