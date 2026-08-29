import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bug, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export function AuthModal() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegister) {
        await register({ username: username.trim(), email: email.trim(), password })
        toast.success('Account created successfully! Welcome to Bugzilla.')
      } else {
        const identifier = username.trim()
        const isEmail = identifier.includes('@')
        await login({
          [isEmail ? 'email' : 'username']: identifier,
          password,
        })
        toast.success('Signed in successfully!')
      }
    } catch (err: any) {
      toast.error(err.message || (isRegister ? 'Registration failed' : 'Authentication failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ background: 'radial-gradient(ellipse at top, #18181b 0%, #09090b 100%)' }}>
      <div className="modal-card" style={{ maxWidth: '400px', border: '1px solid var(--border-muted)' }}>
        {/* Brand Banner */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            className="brand-icon"
            style={{ width: '40px', height: '40px', margin: '0 auto 12px', borderRadius: '10px' }}
          >
            <Bug size={22} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isRegister ? 'Create Bugzilla Account' : 'Sign in to Bugzilla'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isRegister ? 'Track issues and collaborate with your team' : 'Modern developer-productivity issue tracking'}
          </p>
        </div>

        {/* Tab Toggle */}
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

        {/* Form */}
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
              <label className="form-label">Password</label>
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
              disabled={loading || !password || (!username && !email)}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
