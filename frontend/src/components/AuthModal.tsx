import React, { useState } from 'react'
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
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'

type AuthViewMode = 'LOGIN' | 'REGISTER' | 'FORGOT' | 'GUEST' | 'GOOGLE_PROMPT' | 'GITHUB_PROMPT'

export function AuthModal() {
  const { login, register, guestAuth, oauthGoogle, oauthGitHub } = useAuth()
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

  // OAuth Interactive Prompt states
  const [oauthEmail, setOauthEmail] = useState('developer@gmail.com')
  const [oauthUsername, setOauthUsername] = useState('octocat')

  // Handle Login Submit
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

  // Handle Register Submit
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

  // Handle Forgot Password Submit
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

  // Handle Guest Auth Submit
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

  // Handle Google OAuth
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oauthEmail.trim() || !oauthEmail.includes('@')) {
      toast.error('Please enter a valid Google Account email')
      return
    }

    setLoading(true)
    try {
      const cleanEmail = oauthEmail.trim().toLowerCase()
      const derivedUser = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
      await oauthGoogle({
        email: cleanEmail,
        username: derivedUser,
        name: derivedUser,
        picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanEmail}`,
      })
      toast.success('Signed in with Google!')
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle GitHub OAuth
  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oauthUsername.trim()) {
      toast.error('Please enter your GitHub username')
      return
    }

    setLoading(true)
    try {
      const cleanUser = oauthUsername.trim()
      await oauthGitHub({
        username: cleanUser,
        email: `${cleanUser.toLowerCase()}@users.noreply.github.com`,
        avatar_url: `https://github.com/${cleanUser}.png`,
      })
      toast.success('Signed in with GitHub!')
    } catch (err: any) {
      toast.error(err.message || 'GitHub authentication failed')
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
            {viewMode === 'GOOGLE_PROMPT' && 'Sign in with Google'}
            {viewMode === 'GITHUB_PROMPT' && 'Sign in with GitHub'}
          </h2>

          <p className="auth-subtitle">
            {viewMode === 'LOGIN' && 'Track issues and collaborate with your team'}
            {viewMode === 'REGISTER' && 'Track issues and collaborate with your team'}
            {viewMode === 'FORGOT' && 'Enter your email address and we will send a password recovery link'}
            {viewMode === 'GUEST' && 'Instant access for sandbox testing. No email required.'}
            {viewMode === 'GOOGLE_PROMPT' && 'Authenticate using your verified Google Identity.'}
            {viewMode === 'GITHUB_PROMPT' && 'Authenticate using your GitHub developer account.'}
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
                onClick={() => setViewMode('GOOGLE_PROMPT')}
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
                onClick={() => setViewMode('GITHUB_PROMPT')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>

              <button
                type="button"
                className="guest-auth-btn"
                onClick={() => setViewMode('GUEST')}
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
                onClick={() => setViewMode('REGISTER')}
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
                onClick={() => setViewMode('GOOGLE_PROMPT')}
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
                onClick={() => setViewMode('GITHUB_PROMPT')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Sign up with GitHub</span>
              </button>

              <button
                type="button"
                className="guest-auth-btn"
                onClick={() => setViewMode('GUEST')}
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
                onClick={() => setViewMode('LOGIN')}
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
                  onClick={() => setViewMode('LOGIN')}
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
                    onClick={() => setViewMode('LOGIN')}
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
                onClick={() => setViewMode('LOGIN')}
              >
                ← Return to standard sign in
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            5. GOOGLE OAUTH IN-APP DIALOG
           ========================================================================= */}
        {viewMode === 'GOOGLE_PROMPT' && (
          <form onSubmit={handleGoogleSubmit} className="auth-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Google Account Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="developer@gmail.com"
                value={oauthEmail}
                onChange={(e) => setOauthEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['developer@gmail.com', 'teamlead@gmail.com', 'qa.tester@gmail.com'].map((em) => (
                <button
                  key={em}
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '10px', padding: '3px 8px', border: '1px solid var(--border-subtle)' }}
                  onClick={() => setOauthEmail(em)}
                >
                  {em}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '10px', marginTop: '6px', fontWeight: 600, background: '#4285f4', borderColor: '#4285f4' }}
              disabled={loading || !oauthEmail}
            >
              {loading ? 'Connecting with Google...' : 'Authorize Google Account'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="auth-link"
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                onClick={() => setViewMode('LOGIN')}
              >
                Cancel and return
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            6. GITHUB OAUTH IN-APP DIALOG
           ========================================================================= */}
        {viewMode === 'GITHUB_PROMPT' && (
          <form onSubmit={handleGitHubSubmit} className="auth-form">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">GitHub Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. octocat"
                value={oauthUsername}
                onChange={(e) => setOauthUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['octocat', 'torvalds', 'dev-alex'].map((un) => (
                <button
                  key={un}
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '10px', padding: '3px 8px', border: '1px solid var(--border-subtle)' }}
                  onClick={() => setOauthUsername(un)}
                >
                  @{un}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', padding: '10px', marginTop: '6px', fontWeight: 600, background: '#24292f', borderColor: '#30363d' }}
              disabled={loading || !oauthUsername}
            >
              {loading ? 'Connecting with GitHub...' : 'Authorize GitHub Account'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="auth-link"
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                onClick={() => setViewMode('LOGIN')}
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
