import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearSession, getStoredUser, storeSession } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('busgo-logout', onLogout)
    return () => window.removeEventListener('busgo-logout', onLogout)
  }, [])

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (data.user.role === 'user') {
      throw new Error('This portal is for admins and bus operators only.')
    }
    storeSession(data.token, data.user)
    setUser(data.user)
    return data.user
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
