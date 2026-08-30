import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import {
  Bug,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  FlaskConical,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type AuthViewMode = 'LOGIN' | 'REGISTER' | 'FORGOT' | 'GUEST' | 'NEW_OAUTH_USER'

interface PendingOAuthData {
  pending_token: string
  provider: 'GOOGLE' | 'GITHUB'
  email?: string
  username?: string
  github_username?: string
  name?: string
}

export function AuthModal() {
  const { login, register, guestAuth, completeOAuthRegistration, setSessionToken } = useAuth()
  const [viewMode, setViewMode] = useState<AuthViewMode>('LOGIN')

  // Form states
  const [identifier, setIdentifier] = useState('') // Login username or email
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Pending OAuth state for new user onboarding (only username asked)
  const [pendingOAuth, setPendingOAuth] = useState<PendingOAuthData | null>(null)
  const [chosenUsername, setChosenUsername] = useState('')

  // Centralized state reset
  const resetOAuthState = useCallback(() => {
    setLoading(false)
    setPendingOAuth(null)
    setChosenUsername('')
    setViewMode('LOGIN')
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  // Clear loading state on back/forward navigation (bfcache) or window focus
  useEffect(() => {
    const handlePageShow = () => {
      setLoading(false)
    }
    const handleFocus = () => {
      setLoading(false)
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Check URL hash for OAuth redirect results on component mount or hash changes
  useEffect(() => {
    const processHash = () => {
      const hash = window.location.hash
      if (!hash) return

      const hashContent = hash.startsWith('#') ? hash.substring(1) : hash
      const params = new URLSearchParams(hashContent)

      const authToken = params.get('auth_token')
      const oauthPending = params.get('oauth_pending')
      const oauthError = params.get('oauth_error')

      if (authToken) {
        // Clear hash immediately
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setLoading(true)
        setSessionToken(authToken)
          .then(() => {
            toast.success('Signed in successfully with OAuth!')
          })
          .catch((err: any) => {
            toast.error(err.message || 'Failed to establish session')
          })
          .finally(() => {
            setLoading(false)
          })
        return
      }

      if (oauthPending) {
        const provider = (params.get('provider') || 'GOOGLE') as 'GOOGLE' | 'GITHUB'
        const userEmail = params.get('email') || undefined
        const ghUsername = params.get('github_username') || undefined
        const suggested = params.get('suggested') || ghUsername || (userEmail ? userEmail.split('@')[0] : '')
        const name = params.get('name') || undefined

        // Clear hash from URL immediately
        window.history.replaceState(null, '', window.location.pathname + window.location.search)

        setLoading(false)
        setPendingOAuth({
          pending_token: oauthPending,
          provider,
          email: userEmail,
          github_username: ghUsername,
          name,
        })
        setChosenUsername(suggested.replace(/[^a-zA-Z0-9_-]/g, '_'))
        setViewMode('NEW_OAUTH_USER')
        return
      }

      if (oauthError) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setLoading(false)
        setPendingOAuth(null)
        setViewMode('LOGIN')
        const decodedError = decodeURIComponent(oauthError)
        if (decodedError.toLowerCase().includes('denied') || decodedError.toLowerCase().includes('cancel')) {
          toast.info('Sign-in was canceled.')
        } else {
          toast.error(decodedError)
        }
      }
    }

    processHash()
    window.addEventListener('hashchange', processHash)
    return () => window.removeEventListener('hashchange', processHash)
  }, [setSessionToken])

  // =========================================================================
  // Google OAuth Real Authorization Flow
  // =========================================================================
  const handleGoogleOAuth = async () => {
    setLoading(true)
    try {
      const res = await api.auth.getGoogleAuthUrl()
      if (res.url) {
        window.location.href = res.url
      } else {
        toast.error('Failed to obtain Google authorization URL')
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Google OAuth is currently unavailable')
      setLoading(false)
    }
  }

  // =========================================================================
  // GitHub OAuth Real Authorization Flow
  // =========================================================================
  const handleGitHubOAuth = async () => {
    setLoading(true)
    try {
      const res = await api.auth.getGitHubAuthUrl()
      if (res.url) {
        window.location.href = res.url
      } else {
        toast.error('Failed to obtain GitHub authorization URL')
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'GitHub OAuth is currently unavailable')
      setLoading(false)
    }
  }

  // =========================================================================
  // Submit Final Username for New OAuth Account
  // =========================================================================
  const handleFinishOAuthRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanUser = chosenUsername.trim()
    if (!cleanUser || !pendingOAuth) {
      toast.error('Please enter a username for your Bugzilla account')
      return
    }

    if (cleanUser.length < 3 || cleanUser.length > 50) {
      toast.error('Username must be between 3 and 50 characters')
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      toast.error('Username can only contain letters, numbers, hyphens, and underscores')
      return
    }

    setLoading(true)
    try {
      await completeOAuthRegistration({
        pending_token: pendingOAuth.pending_token,
        username: cleanUser,
      })
      toast.success(
        `Account created with ${pendingOAuth.provider === 'GOOGLE' ? 'Google' : 'GitHub'}! Welcome, ${cleanUser}.`
      )
      setPendingOAuth(null)
      setChosenUsername('')
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete registration')
    } finally {
      setLoading(false)
    }
  }

  // =========================================================================
  // Standard Email / Password Handlers
  // =========================================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      toast.error('Please enter your username/email and password')
      return
    }

    setLoading(true)
    try {
      const isEmail = identifier.includes('@')
      await login({
        [isEmail ? 'email' : 'username']: identifier.trim(),
        password,
      })
      toast.success('Signed in successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Invalid username/email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password) {
      toast.error('Please fill in all registration fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      toast.success('Account created! A verification email has been dispatched.')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await api.auth.forgotPassword(forgotEmail.trim().toLowerCase())
      setForgotSent(true)
      toast.success('Password recovery email dispatched')
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch recovery email')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Guest username and password are required')
      return
    }

    setLoading(true)
    try {
      await guestAuth({
        username: username.trim(),
        password,
      })
      toast.success(`Welcome to Sandbox, ${username.trim()}!`)
    } catch (err: any) {
      toast.error(err.message || 'Guest authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Bug size={24} />
          </div>

          <h2 className="auth-title">
            {viewMode === 'LOGIN' && 'Sign in to Bugzilla'}
            {viewMode === 'REGISTER' && 'Create your Bugzilla account'}
            {viewMode === 'FORGOT' && 'Reset your password'}
            {viewMode === 'GUEST' && 'Guest Sandbox Access'}
            {viewMode === 'NEW_OAUTH_USER' && 'Choose your username'}
          </h2>

          <p className="auth-subtitle">
            {viewMode === 'LOGIN' && 'Track issues and collaborate with your team'}
            {viewMode === 'REGISTER' && 'Track issues and collaborate with your team'}
            {viewMode === 'FORGOT' && 'Enter your email address and we will send a password recovery link'}
            {viewMode === 'GUEST' && 'Instant access for sandbox testing. No email required.'}
            {viewMode === 'NEW_OAUTH_USER' &&
              (pendingOAuth?.provider === 'GOOGLE'
                ? `Verified with Google as ${pendingOAuth.email}`
                : `Verified with GitHub as @${pendingOAuth?.github_username || pendingOAuth?.username}`)}
          </p>
        </div>

        {/* =========================================================================
            1. LOGIN VIEW
           ========================================================================= */}
        {viewMode === 'LOGIN' && (
          <>
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username or Email</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="name@work-email.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button
                    type="button"
                    className="auth-link"
                    style={{ fontSize: '11px' }}
                    onClick={() => {
                      setForgotSent(false)
                      setForgotEmail(identifier.includes('@') ? identifier : '')
                      setViewMode('FORGOT')
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '36px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    style={{ position: 'absolute', right: '4px', top: '4px', padding: '4px', color: 'var(--text-muted)' }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: '100%', padding: '10px', marginTop: '4px', fontWeight: 600 }}
                disabled={loading || !identifier || !password}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="auth-divider">or continue with</div>

            <div className="auth-social-buttons">
              <button
                type="button"
                className="social-auth-btn"
                onClick={handleGoogleOAuth}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="social-auth-btn"
                onClick={handleGitHubOAuth}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>

              <button
                type="button"
                className="guest-auth-btn"
                onClick={() => {
                  setLoading(false)
                  setViewMode('GUEST')
                }}
                disabled={loading}
              >
                <FlaskConical size={14} className="text-muted" />
                <span>Continue as Guest (Testing Sandbox)</span>
              </button>
            </div>

            <div className="auth-footer">
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setLoading(false)
                  setViewMode('REGISTER')
                }}
              >
                Create one
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            2. REGISTER VIEW
           ========================================================================= */}
        {viewMode === 'REGISTER' && (
          <>
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@work-email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '36px' }}
                    placeholder="Create a password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    style={{ position: 'absolute', right: '4px', top: '4px', padding: '4px', color: 'var(--text-muted)' }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: '100%', padding: '10px', marginTop: '4px', fontWeight: 600 }}
                disabled={loading || !username || !email || !password}
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="auth-divider">or continue with</div>

            <div className="auth-social-buttons">
              <button
                type="button"
                className="social-auth-btn"
                onClick={handleGoogleOAuth}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <button
                type="button"
                className="social-auth-btn"
                onClick={handleGitHubOAuth}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Sign up with GitHub</span>
              </button>

              <button
                type="button"
                className="guest-auth-btn"
                onClick={() => {
                  setLoading(false)
                  setViewMode('GUEST')
                }}
                disabled={loading}
              >
                <FlaskConical size={14} className="text-muted" />
                <span>Create Guest Account (Sandbox Testing)</span>
              </button>
            </div>

            <div className="auth-footer">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setLoading(false)
                  setViewMode('LOGIN')
                }}
              >
                Sign in
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            3. FORGOT PASSWORD VIEW
           ========================================================================= */}
        {viewMode === 'FORGOT' && (
          <div>
            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Recovery Link Sent
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                  If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been dispatched. Please check your inbox.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '9px' }}
                  onClick={() => {
                    setLoading(false)
                    setViewMode('LOGIN')
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="auth-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Registered Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@work-email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{ width: '100%', padding: '10px', marginTop: '4px', fontWeight: 600 }}
                  disabled={loading || !forgotEmail}
                >
                  {loading ? 'Sending link...' : 'Send Recovery Link'}
                  {!loading && <ArrowRight size={14} />}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="auth-link"
                    style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                    onClick={() => {
                      setLoading(false)
                      setViewMode('LOGIN')
                    }}
                  >
                    ← Return to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            4. GUEST ACCESS VIEW
           ========================================================================= */}
        {viewMode === 'GUEST' && (
          <form onSubmit={handleGuestSubmit} className="auth-form">
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', color: '#93c5fd', lineHeight: 1.4 }}>
                <strong>Sandbox Testing:</strong> Instant login without email verification. Guest accounts cannot use email-based password recovery.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Guest Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. tester_alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Guest Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '10px', marginTop: '6px', fontWeight: 600 }}
              disabled={loading || !username || !password}
            >
              {loading ? 'Entering Sandbox...' : 'Continue to Bugzilla'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="auth-link"
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setLoading(false)
                  setViewMode('LOGIN')
                }}
              >
                ← Return to standard sign in
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            5. NEW OAUTH USER ONBOARDING (ASK ONLY USERNAME, NO EMAIL/PASSWORD)
           ========================================================================= */}
        {viewMode === 'NEW_OAUTH_USER' && (
          <form onSubmit={handleFinishOAuthRegistration} className="auth-form">
            <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} className="text-emerald-400" />
              </div>
              <div style={{ flex: 1, fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Identity Verified</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '1px' }}>
                  {pendingOAuth?.provider === 'GOOGLE'
                    ? `Google account ${pendingOAuth.email}`
                    : `GitHub account @${pendingOAuth?.github_username || pendingOAuth?.username}`}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose your Bugzilla Username *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. dev_alex"
                  value={chosenUsername}
                  onChange={(e) => setChosenUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                This will be your unique handle displayed on issues and commits.
              </span>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '10px', marginTop: '6px', fontWeight: 600 }}
              disabled={loading || !chosenUsername.trim()}
            >
              {loading ? 'Creating account...' : 'Complete Account Setup'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="auth-link"
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                onClick={resetOAuthState}
              >
                Cancel and return
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
