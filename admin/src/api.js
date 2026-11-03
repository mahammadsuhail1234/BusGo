const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TOKEN_KEY = 'busgoStaffToken'
const USER_KEY = 'busgoStaffUser'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}
export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function api(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE}${path}`
  if (params) {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    if ([...q].length) url += `?${q}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on port 5000?')
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && getToken()) {
    clearSession()
    window.dispatchEvent(new Event('busgo-logout'))
  }
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}
