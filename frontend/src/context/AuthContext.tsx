import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import { api } from '../api/client'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<void>
  register: (credentials: { username: string; email: string; password: string }) => Promise<void>
  guestAuth: (credentials: { username: string; password: string }) => Promise<void>
  oauthGoogle: (data: { email: string; username?: string; name?: string; picture?: string }) => Promise<void>
  oauthGitHub: (data: { username: string; email?: string; avatar_url?: string }) => Promise<void>
  completeOAuthRegistration: (data: { pending_token: string; username: string }) => Promise<void>
  setSessionToken: (token: string) => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bugzilla_auth_token'))
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    const activeToken = localStorage.getItem('bugzilla_auth_token')
    if (!activeToken) {
      setUser(null)
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
    }
  }

  const setSessionToken = async (newToken: string) => {
    localStorage.setItem('bugzilla_auth_token', newToken)
    setToken(newToken)
    try {
      const { user: fetchedUser } = await api.auth.me()
      setUser(fetchedUser)
    } catch (err) {
      console.error('Failed to load user with token:', err)
      localStorage.removeItem('bugzilla_auth_token')
      setToken(null)
      setUser(null)
      throw err
    }
  }

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false)
        return
      }
      await refreshUser()
      setIsLoading(false)
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

  const guestAuth = async (credentials: { username: string; password: string }) => {
    const { user: guestUser, access_token } = await api.auth.guest(credentials)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(guestUser)
  }

  const oauthGoogle = async (data: { email: string; username?: string; name?: string; picture?: string }) => {
    const { user: googleUser, access_token } = await api.auth.oauthGoogle(data)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(googleUser)
  }

  const oauthGitHub = async (data: { username: string; email?: string; avatar_url?: string }) => {
    const { user: githubUser, access_token } = await api.auth.oauthGitHub(data)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(githubUser)
  }

  const completeOAuthRegistration = async (data: { pending_token: string; username: string }) => {
    const { user: newUser, access_token } = await api.auth.completeOAuthRegistration(data)
    localStorage.setItem('bugzilla_auth_token', access_token)
    setToken(access_token)
    setUser(newUser)
  }

  const updateUser = async (data: Partial<User>) => {
    const res = await api.auth.updateProfile(data)
    setUser(res.user)
  }

  const logout = () => {
    api.auth.logout().catch(() => {})
    localStorage.removeItem('bugzilla_auth_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        guestAuth,
        oauthGoogle,
        oauthGitHub,
        completeOAuthRegistration,
        setSessionToken,
        refreshUser,
        updateUser,
        logout,
      }}
    >
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
