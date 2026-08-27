import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, UserPlus, LogIn, AlertCircle } from 'lucide-react'

export function AuthModal() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        if (!username || !email || !password) {
          throw new Error('All fields are required')
        }
        await register({ username, email, password })
      } else {
        if (!email || !password) {
          throw new Error('Email/username and password are required')
        }
        await login({ email, password })
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo">B</div>
          <h2>{isRegister ? 'Create Bugzilla Account' : 'Sign in to Bugzilla'}</h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Join your team to track issues and software releases'
              : 'Enter your credentials to access your workspaces'}
          </p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                minLength={3}
              />
            </div>
          )}

          <div className="form-group">
            <label>{isRegister ? 'Email Address' : 'Email or Username'}</label>
            <input
              type={isRegister ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRegister ? 'user@example.com' : 'user@example.com or admin'}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? (
              'Processing...'
            ) : isRegister ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
            }}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account yet? Create one"}
          </button>
        </div>
      </div>
    </div>
  )
}
