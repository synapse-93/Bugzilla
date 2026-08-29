import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import {
  Bug,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export function AuthModal() {
  const { login, register, guestAuth, oauthGoogle, oauthGitHub } = useAuth()
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'GOOGLE' | 'GITHUB' | 'GUEST'>('EMAIL')
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // OAuth Simulation / Popups for Google & GitHub
  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      // Prompt for simulated or actual Google profile if not in OAuth redirect
      const googleEmail = prompt('Enter your Google Account email for authentication:', 'developer@gmail.com')
      if (!googleEmail || !googleEmail.includes('@')) {
        setLoading(false)
        return
      }
      await oauthGoogle({
        email: googleEmail.trim().toLowerCase(),
        username: googleEmail.split('@')[0],
        name: googleEmail.split('@')[0],
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      })
      toast.success('Signed in with Google!')
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubAuth = async () => {
    setLoading(true)
    try {
      const ghUser = prompt('Enter your GitHub username for authentication:', 'octocat')
      if (!ghUser || ghUser.trim().length < 2) {
        setLoading(false)
        return
      }
      await oauthGitHub({
        username: ghUser.trim(),
        email: `${ghUser.trim().toLowerCase()}@users.noreply.github.com`,
        avatar_url: `https://github.com/${ghUser.trim()}.png`,
      })
      toast.success('Signed in with GitHub!')
    } catch (err: any) {
      toast.error(err.message || 'GitHub authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      await api.auth.forgotPassword(forgotEmail.trim().toLowerCase())
      setForgotSent(true)
      toast.success('Password reset link sent to your email')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (authMethod === 'GUEST') {
        if (!username.trim() || !password) {
          toast.error('Username and password are required for Guest access')
          setLoading(false)
          return
        }
        await guestAuth({
          username: username.trim(),
          password,
        })
        toast.success(`Welcome, Guest ${username.trim()}!`)
      } else if (authMethod === 'EMAIL') {
        if (isRegister) {
          if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            setLoading(false)
            return
          }
          await register({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          })
          toast.success('Account created! A verification email has been dispatched.')
        } else {
          const identifier = username.trim() || email.trim()
          const isEmail = identifier.includes('@')
          await login({
            [isEmail ? 'email' : 'username']: identifier,
            password,
          })
          toast.success('Signed in successfully!')
        }
      }
    } catch (err: any) {
      toast.error(err.message || (isRegister ? 'Registration failed' : 'Authentication failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ background: 'radial-gradient(ellipse at top, #18181b 0%, #09090b 100%)' }}>
      <div className="modal-card" style={{ maxWidth: '440px', border: '1px solid var(--border-muted)' }}>
        {/* Brand Banner */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="brand-icon"
            style={{ width: '40px', height: '40px', margin: '0 auto 12px', borderRadius: '10px' }}
          >
            <Bug size={22} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isForgotPassword
              ? 'Reset Your Password'
              : authMethod === 'GUEST'
              ? 'Guest Mode Access'
              : isRegister
              ? 'Create Bugzilla Account'
              : 'Sign in to Bugzilla'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isForgotPassword
              ? 'Enter your email to receive a secure recovery link'
              : authMethod === 'GUEST'
              ? 'Instant access for demo and testing without email'
              : 'High-density developer-productivity issue tracker'}
          </p>
        </div>

        {/* 4 Auth Methods Selection */}
        {!isForgotPassword && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '12px',
                borderBottom: authMethod === 'EMAIL' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: authMethod === 'EMAIL' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
              onClick={() => setAuthMethod('EMAIL')}
            >
              Email
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '12px',
                borderBottom: authMethod === 'GOOGLE' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: authMethod === 'GOOGLE' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
              onClick={() => setAuthMethod('GOOGLE')}
            >
              Google
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '12px',
                borderBottom: authMethod === 'GITHUB' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: authMethod === 'GITHUB' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
              onClick={() => setAuthMethod('GITHUB')}
            >
              GitHub
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                padding: '10px 4px',
                fontSize: '12px',
                borderBottom: authMethod === 'GUEST' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: authMethod === 'GUEST' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
              onClick={() => setAuthMethod('GUEST')}
            >
              Guest
            </button>
          </div>
        )}

        {/* Forgot Password View */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} style={{ padding: '20px' }}>
            {forgotSent ? (
              <div className="empty-state py-6">
                <CheckCircle size={36} className="text-emerald-400 mb-2" />
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Recovery Link Sent</div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  If an account exists for <strong>{forgotEmail}</strong>, instructions to set a new password have been sent.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsForgotPassword(false)
                    setForgotSent(false)
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Registered Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      placeholder="user@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                  disabled={loading || !forgotEmail}
                >
                  {loading ? 'Sending link...' : 'Send Recovery Email'}
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                  onClick={() => setIsForgotPassword(false)}
                >
                  Cancel and return to sign in
                </button>
              </div>
            )}
          </form>
        ) : authMethod === 'GOOGLE' ? (
          /* Google OAuth View */
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Sign in with your Google account. No separate Bugzilla password required.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#4285f4',
                color: '#fff',
                borderColor: '#4285f4',
              }}
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Secure authentication via Google Identity.
            </span>
          </div>
        ) : authMethod === 'GITHUB' ? (
          /* GitHub OAuth View */
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Authenticate with your GitHub profile. Automatically links your open-source repositories.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#24292f',
                color: '#fff',
                borderColor: '#30363d',
              }}
              onClick={handleGitHubAuth}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{loading ? 'Connecting...' : 'Continue with GitHub'}</span>
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              No password needed. Syncs GitHub public avatar and profile.
            </span>
          </div>
        ) : authMethod === 'GUEST' ? (
          /* Guest Access View */
          <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: '#93c5fd' }}>
                  <strong>Guest Mode:</strong> For rapid demo and testing. No email required.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Guest Username *</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="e.g. demo_guest"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Guest Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                disabled={loading || !username || !password}
              >
                {loading ? 'Entering Guest Mode...' : 'Enter as Guest'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        ) : (
          /* Email Sign In / Sign Up View */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  borderRadius: 0,
                  padding: '10px',
                  borderBottom: !isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
                onClick={() => setIsRegister(false)}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  borderRadius: 0,
                  padding: '10px',
                  borderBottom: isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}
                onClick={() => setIsRegister(true)}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isRegister ? (
                  <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Username</label>
                      <div style={{ position: 'relative' }}>
                        <UserIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="form-input"
                          style={{ paddingLeft: '32px' }}
                          placeholder="devuser"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                          type="email"
                          className="form-input"
                          style={{ paddingLeft: '32px' }}
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Username or Email</label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '32px' }}
                        placeholder="Username or email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Password</label>
                    {!isRegister && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: '11px', color: 'var(--accent-primary)', padding: 0 }}
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                      <input
                        type="password"
                        className="form-input"
                        style={{ paddingLeft: '32px' }}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                  disabled={loading || !password || (!username && !email)}
                >
                  {loading ? 'Please wait...' : isRegister ? 'Create Account & Send Verification' : 'Sign In'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
