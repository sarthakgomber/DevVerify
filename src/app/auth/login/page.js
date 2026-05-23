'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { Shield } from 'lucide-react'
import { GithubIcon } from '../../../components/icons'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [searchParams])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setOauthLoading('') }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      {/* DevVerify Branding */}
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
          <div className="w-12 h-12 rounded-memphis bg-memphis-violet border-3 border-memphis-orange flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-txt-1 text-2xl tracking-tight">DevVerify</span>
        </Link>
        <h1 className="font-display text-3xl font-bold text-txt-1 mb-2">Welcome back</h1>
        <p className="text-txt-3 text-sm font-mono tracking-wide uppercase">Sign in to your account</p>
      </div>

      {/* Main Card */}
      <div className="card-memphis p-8">
        {/* Geometric decoration inside card */}
        <div className="geo-circle w-8 h-8 border-memphis-orange top-4 right-4 opacity-40" />
        <div className="geo-triangle border-b-memphis-cyan bottom-4 left-4 opacity-30" />

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6 relative z-10">
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="btn-memphis btn-memphis-outline w-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={!!oauthLoading}
            className="btn-memphis btn-memphis-outline w-full"
          >
            <GithubIcon className="w-5 h-5" />
            {oauthLoading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[3px] bg-surface-3 rounded-full" />
          <span className="text-txt-3 text-xs font-mono uppercase tracking-widest">or</span>
          <div className="flex-1 h-[3px] bg-surface-3 rounded-full" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-display font-semibold text-txt-2 mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-memphis"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-display font-semibold text-txt-2 mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-memphis"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm bg-memphis-red/10 text-memphis-red border-3 border-memphis-red/30 px-4 py-3 rounded-memphis font-display font-semibold">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-memphis btn-memphis-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
      </div>

      {/* Bottom Link */}
      <p className="text-center text-sm text-txt-3 mt-8 font-display">
        No account?{' '}
        <Link href="/auth/signup" className="text-memphis-orange hover:text-memphis-yellow font-bold transition-colors underline underline-offset-4 decoration-2 decoration-memphis-orange/50 hover:decoration-memphis-yellow">
          Sign up free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-memphis flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Geometric Decorations */}
      <div className="geo-circle w-32 h-32 border-memphis-violet top-[10%] left-[5%] opacity-20 animate-geo-float" />
      <div className="geo-circle w-20 h-20 border-memphis-orange top-[20%] right-[10%] opacity-15 animate-geo-float" style={{ animationDelay: '2s' }} />
      <div className="geo-circle w-14 h-14 border-memphis-cyan bottom-[15%] left-[12%] opacity-20 animate-geo-float" style={{ animationDelay: '4s' }} />
      <div className="geo-triangle border-b-memphis-pink top-[30%] left-[20%] opacity-15 animate-geo-spin" />
      <div className="geo-triangle border-b-memphis-yellow bottom-[25%] right-[15%] opacity-15 animate-geo-spin" style={{ animationDelay: '3s' }} />
      <div className="geo-dots text-memphis-violet top-[60%] right-[8%]" />
      <div className="geo-dots text-memphis-orange top-[8%] left-[40%]" />
      <div className="geo-cross text-memphis-cyan bottom-[30%] right-[30%] opacity-20" />
      <div className="geo-cross text-memphis-pink top-[50%] left-[8%] opacity-20" />

      <Suspense fallback={
        <div className="text-txt-2 font-mono text-sm animate-pulse tracking-widest uppercase">Loading...</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
