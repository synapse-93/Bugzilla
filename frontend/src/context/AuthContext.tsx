import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import { api } from '../api/client'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<void>
  register: (credentials: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bugzilla_auth_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const { user: fetchedUser } = await api.auth.me()
        setUser(fetchedUser)
      } catch (err) {
        console.error('Session restoration failed:', err)
        localStorage.removeItem('bugzilla_auth_token')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [token])

  const login = async (credentials: { email?: string; username?: string; password: string }) => {
    const { user: loggedInUser, access_token } = await api.auth.login(credentials)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(loggedInUser)
  }

  const register = async (credentials: { username: string; email: string; password: string }) => {
    const { user: registeredUser, access_token } = await api.auth.register(credentials)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(registeredUser)
  }

  const logout = () => {
    localStorage.removeItem('bugzilla_auth_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
