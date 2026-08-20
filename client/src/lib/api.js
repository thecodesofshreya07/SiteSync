const API_BASE = 'http://127.0.0.1:4000/api'
const API_FALLBACK = 'http://127.0.0.1:5000/api'

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

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    let response = await fetch(url, config).catch(() => null)

    if (!response || (!response.ok && (response.status === 404 || response.status >= 500))) {
      const fallbackUrl = `${API_FALLBACK}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
      const fallbackRes = await fetch(fallbackUrl, config).catch(() => null)
      if (fallbackRes) {
        response = fallbackRes
      }
    }

    if (!response) {
      throw new Error('Backend server is unavailable.')
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
