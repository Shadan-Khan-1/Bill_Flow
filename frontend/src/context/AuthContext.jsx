import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { getFromDB, saveToDB } from '../utils/indexedDB'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('bf_user')
  const [user, setUser] = useState(JSON.parse(stored))
  const [loading, setLoading] = useState(true)

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem('bf_token')
    // const stored = localStorage.getItem('bf_user')
    if (token && stored) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(JSON.parse(stored))
      } catch (_) { logout() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { token, user: u } = data
    localStorage.setItem('bf_token', token)
    localStorage.setItem('bf_user', JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bf_token')
    localStorage.removeItem('bf_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isStaff }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
