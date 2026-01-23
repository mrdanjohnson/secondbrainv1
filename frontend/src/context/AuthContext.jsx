import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')
      setUser(response.data.data)
      setIsAuthenticated(true)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user: userData } = response.data.data
    
    localStorage.setItem('token', token)
    setUser(userData)
    setIsAuthenticated(true)
    
    return userData
  }

  const register = async (email, password, name) => {
    const response = await api.post('/auth/register', { email, password, name })
    const { token, user: userData } = response.data.data
    
    localStorage.setItem('token', token)
    setUser(userData)
    setIsAuthenticated(true)
    
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data)
    setUser(response.data.data)
    return response.data.data
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: loadUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
