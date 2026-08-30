import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import {
  Bug,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { StackedLogo } from './StackedLogo'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface PendingOAuthData {
  pending_token: string
  provider: string
  email: string
  name: string
  suggested_username: string
  github_username?: string
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'GUEST' | 'FORGOT' | 'RESET' | 'NEW_OAUTH_USER'

export function AuthModal() {
  const { login, register, guestAuth, completeOAuthRegistration, setSessionToken } = useAuth()

  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN')
  const [loading, setLoading] = useState(false)
  const [oauthInitiating, setOauthInitiating] = useState<'google' | 'github' | null>(null)

  // Form Fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')

  // OAuth Pending state
  const [pendingOAuth, setPendingOAuth] = useState<PendingOAuthData | null>(null)
  const [chosenUsername, setChosenUsername] = useState('')

  // Parse OAuth Callback or Hash parameters
  useEffect(() => {
    const processHash = () => {
      const hash = window.location.hash
      if (!hash) return

      const hashContent = hash.startsWith('#') ? hash.substring(1) : hash
      const params = new URLSearchParams(hashContent)

      const oauthError = params.get('oauth_error')
      const authToken = params.get('auth_token')
      const oauthPending = params.get('oauth_pending')

      if (oauthError) {
        toast.error(decodeURIComponent(oauthError))
        resetOAuthState()
        return
      }

      if (authToken) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        setLoading(true)
        setSessionToken(authToken)
          .then(() => {
            toast.success('Signed in successfully!')
          })
          .catch((err: any) => {
            toast.error(err.message || 'Failed to establish session')
          })
          .finally(() => {
            setLoading(false)
            setOauthInitiating(null)
          })
        return
      }

      if (oauthPending) {
        const provider = params.get('provider') || 'GOOGLE'
        const pendingEmail = params.get('email') || ''
        const pendingName = params.get('name') || ''
        const suggested = params.get('suggested') || pendingEmail.split('@')[0] || ''
        const githubUsername = params.get('github_username') || undefined

        setPendingOAuth({
          pending_token: oauthPending,
          provider,
          email: pendingEmail,
          name: pendingName,
          suggested_username: suggested,
          github_username: githubUsername,
        })
        setChosenUsername(suggested)
        setAuthMode('NEW_OAUTH_USER')
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }

    processHash()
    window.addEventListener('hashchange', processHash)
    return () => window.removeEventListener('hashchange', processHash)
  }, [])

  const resetOAuthState = () => {
    setPendingOAuth(null)
    setChosenUsername('')
    setOauthInitiating(null)
    setLoading(false)
    setAuthMode('LOGIN')
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  // Google OAuth Initiate
  const handleGoogleOAuth = async () => {
    setOauthInitiating('google')
    try {
      const res = await api.auth.getGoogleAuthUrl()
      if (res.url) {
        window.location.href = res.url
      }
    } catch (err: any) {
      toast.error(err.message || 'Google OAuth failed to start')
      setOauthInitiating(null)
    }
  }

  // GitHub OAuth Initiate
  const handleGitHubOAuth = async () => {
    setOauthInitiating('github')
    try {
      const res = await api.auth.getGitHubAuthUrl()
      if (res.url) {
        window.location.href = res.url
      }
    } catch (err: any) {
      toast.error(err.message || 'GitHub OAuth failed to start')
      setOauthInitiating(null)
    }
  }

  // Email / Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Please enter your username/email and password')
      return
    }

    setLoading(true)
    try {
      await login({
        username: username.includes('@') ? undefined : username.trim(),
        email: username.includes('@') ? username.trim() : undefined,
        password,
      })
      toast.success('Welcome back to Kaizen!')
    } catch (err: any) {
      toast.error(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  // Email / Password Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password) {
      toast.error('All fields are required')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      })
      toast.success('Account created! Welcome to Kaizen.')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Guest Instant Session
  const handleGuestAuth = async () => {
    const randomGuestNum = Math.floor(1000 + Math.random() * 9000)
    const guestUser = `guest_${randomGuestNum}`
    const guestPass = `KaizenGuest_${randomGuestNum}!2026`

    setLoading(true)
    try {
      await guestAuth({
        username: guestUser,
        password: guestPass,
      })
      toast.success(`Guest session started as @${guestUser}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start guest session')
    } finally {
      setLoading(false)
    }
  }

  // Complete OAuth Username Selection
  const handleCompleteOAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingOAuth || !chosenUsername.trim()) return

    const cleanUser = chosenUsername.trim()
    if (cleanUser.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setLoading(true)
    try {
      await completeOAuthRegistration({
        pending_token: pendingOAuth.pending_token,
        username: cleanUser,
      })
      toast.success(`Account verified! Welcome, @${cleanUser}.`)
      resetOAuthState()
    } catch (err: any) {
      toast.error(err.message || 'Username registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      await api.auth.forgotPassword(email.trim())
      toast.success('If an account exists, a password reset link has been dispatched.')
      setAuthMode('LOGIN')
    } catch (err: any) {
      toast.error(err.message || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Decorative Mesh & Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 text-primary shadow-xs">
            <StackedLogo size={20} color="currentColor" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              KAIZEN
            </CardTitle>
            <CardDescription className="text-[12px] text-muted-foreground">
              Issue tracking, refined.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OAuth Username Selection Mode */}
          {authMode === 'NEW_OAUTH_USER' && pendingOAuth ? (
            <form onSubmit={handleCompleteOAuth} className="space-y-4">
              <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-[12px] space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Identity Verified via {pendingOAuth.provider}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {pendingOAuth.email ? `Linked email: ${pendingOAuth.email}` : `GitHub: @${pendingOAuth.github_username}`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">
                  Choose your Kaizen handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-mono">
                    @
                  </span>
                  <Input
                    type="text"
                    value={chosenUsername}
                    onChange={(e) => setChosenUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="username"
                    className="pl-7 font-mono text-[13px]"
                    required
                    minLength={3}
                    maxLength={50}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Letters, numbers, underscores, and hyphens only.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetOAuthState}
                  disabled={loading}
                  className="w-1/3 text-[12px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !chosenUsername.trim()}
                  className="w-2/3 text-[12px] gap-1.5"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  Complete Setup
                </Button>
              </div>
            </form>
          ) : authMode === 'FORGOT' ? (
            /* Forgot Password Mode */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@domain.com"
                    className="pl-8 text-[13px]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthMode('LOGIN')}
                  className="text-[12px] gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Button>
                <Button type="submit" disabled={loading} className="text-[12px]">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          ) : (
            /* Standard Auth (Login / Register / Guest) */
            <>
              {/* OAuth Provider Buttons */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleOAuth}
                  disabled={Boolean(oauthInitiating) || loading}
                  className="w-full justify-center gap-2 h-9 text-[12.5px] border-border hover:bg-muted/40 font-medium"
                >
                  {oauthInitiating === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5c0 2.6.7 4.9 1.9 7.2l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.6 7.5 24 12 24z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGitHubOAuth}
                  disabled={Boolean(oauthInitiating) || loading}
                  className="w-full justify-center gap-2 h-9 text-[12.5px] border-border hover:bg-muted/40 font-medium"
                >
                  {oauthInitiating === 'github' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0 fill-current text-foreground" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  )}
                  <span>Continue with GitHub</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <Tabs value={authMode} onValueChange={(val) => setAuthMode(val as AuthMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="LOGIN" className="text-[12px]">Sign In</TabsTrigger>
                  <TabsTrigger value="REGISTER" className="text-[12px]">Create Account</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sign In Form */}
              {authMode === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Username or Email
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="developer or dev@domain.com"
                        className="pl-8 text-[13px]"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-muted-foreground">Password</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('FORGOT')}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-8 text-[13px]"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full text-[12.5px] font-medium mt-1">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              )}

              {/* Create Account Form */}
              {authMode === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="username"
                        className="pl-8 text-[13px]"
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dev@domain.com"
                        className="pl-8 text-[13px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pl-8 text-[13px]"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full text-[12.5px] font-medium mt-1">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              )}

              {/* Guest / Sandbox Quick Session */}
              <div className="pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="subtle"
                  onClick={handleGuestAuth}
                  disabled={loading}
                  className="w-full justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground h-8"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Start Instant Guest Sandbox Session</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
