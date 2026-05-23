'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sphere from '../components/Sphere'
import { createClient } from '../lib/supabase/client'
import { Zap, Target, TrendingUp, Clock, GitBranch, Brain, Search, Shield, ArrowRight, Code2 } from 'lucide-react'

export default function HomePage() {
  const [leetcode, setLeetcode] = useState('')
  const [github, setGithub] = useState('')
  const [codeforces, setCodeforces] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sphereState, setSphereState] = useState('idle')
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user)
      }
    })
  }, [])

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!leetcode.trim() && !github.trim() && !codeforces.trim()) return
    setLoading(true)
    setError('')
    setSphereState('analyzing')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leetcode: leetcode.trim(),
          github: github.trim(),
          codeforces: codeforces.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setSphereState('idle'); setLoading(false); return }
      setSphereState('complete')
      setTimeout(() => {
        if (data.reportId) {
          router.push('/report/' + data.reportId)
        }
      }, 1200)
    } catch {
      setError('Network error. Please try again.')
      setSphereState('idle')
      setLoading(false)
    }
  }

  const signals = [
    { icon: Zap, title: 'Burst Detection', desc: 'Flags days with 10+ problems solved in a single session', color: 'memphis-orange', accent: '#FF6B35' },
    { icon: Target, title: 'Accuracy Anomaly', desc: 'Zero wrong attempts across hundreds of problems = red flag', color: 'memphis-pink', accent: '#FF78B4' },
    { icon: TrendingUp, title: 'Difficulty Spikes', desc: 'Jumping Easy→Hard without any foundation', color: 'memphis-cyan', accent: '#00D2FF' },
    { icon: Clock, title: 'Time Gaps', desc: 'Months inactive then 100 problems in a week', color: 'memphis-yellow', accent: '#FECA57' },
    { icon: GitBranch, title: 'Git Forensics', desc: 'Commit frequency, repo quality & contribution patterns', color: 'memphis-green', accent: '#00E676' },
    { icon: Brain, title: 'AI Quiz', desc: 'Gemini-powered quiz to verify claimed skills', color: '', accent: '#6C5CE7' },
  ]

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar-memphis">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-memphis-orange to-memphis-violet flex items-center justify-center border-2 border-memphis-orange/30">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-txt-1">DevVerify</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="btn-memphis btn-memphis-primary text-sm py-2 px-5">
              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Dashboard'}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-memphis btn-memphis-outline text-sm py-2 px-5">Login</Link>
              <Link href="/auth/signup" className="btn-memphis btn-memphis-primary text-sm py-2 px-5 hidden sm:flex">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Geometric decorations */}
      <div className="geo-circle w-16 h-16 border-memphis-orange/20 top-32 left-8 animate-geo-float hidden lg:block" style={{ animationDelay: '0s' }} />
      <div className="geo-circle w-10 h-10 border-memphis-violet/20 top-48 right-16 animate-geo-float hidden lg:block" style={{ animationDelay: '2s' }} />
      <div className="geo-triangle border-b-memphis-cyan/20 top-60 left-[15%] animate-geo-float hidden lg:block" style={{ animationDelay: '1s' }} />
      <div className="geo-cross text-memphis-pink/20 bottom-32 right-[20%] animate-geo-spin hidden lg:block" />
      <div className="geo-dots text-memphis-yellow bottom-48 left-[10%] hidden lg:block" />

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-16 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — Copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-memphis-violet/30 bg-memphis-violet/5 mb-6">
              <div className="w-2 h-2 rounded-full bg-memphis-green animate-pulse" />
              <span className="font-mono text-xs text-txt-2 uppercase tracking-widest">The Sigil has spoken</span>
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              <span className="text-txt-1">Drop a profile.</span>
              <br />
              <span className="text-gradient-memphis">We&apos;ll read its</span>
              <br />
              <span className="text-gradient-memphis">Code DNA.</span>
            </h1>

            <p className="text-txt-2 text-lg max-w-lg mb-8 mx-auto lg:mx-0">
              DevVerify analyzes developer profiles across LeetCode, GitHub & Codeforces.
              It detects copy-paste patterns, burst submissions, and fake contributions
              — then delivers a verdict.
            </p>

            <form onSubmit={handleAnalyze} className="space-y-4 max-w-md mx-auto lg:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-3" />
                <input
                  type="text"
                  value={leetcode}
                  onChange={e => setLeetcode(e.target.value)}
                  placeholder="LeetCode username"
                  className="input-memphis input-memphis-icon"
                />
              </div>

              {showAdvanced && (
                <div className="space-y-3 animate-slide-up">
                  <div className="relative">
                    <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-3" />
                    <input
                      type="text"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      placeholder="GitHub username"
                      className="input-memphis input-memphis-icon"
                    />
                  </div>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-txt-3" />
                    <input
                      type="text"
                      value={codeforces}
                      onChange={e => setCodeforces(e.target.value)}
                      placeholder="Codeforces handle"
                      className="input-memphis input-memphis-icon"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-memphis btn-memphis-orange flex-1">
                  {loading ? 'Analyzing' : 'Analyze'}
                  {loading && <span className="animate-pulse">...</span>}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="btn-memphis btn-memphis-outline px-4"
                  title="More platforms"
                >
                  +
                </button>
              </div>

              {error && (
                <div className="card-memphis border-memphis-red/50 bg-memphis-red/5 p-3">
                  <p className="text-sm text-memphis-red font-medium">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Right — Sphere */}
          <div className="flex-1 flex justify-center relative">
            <Sphere state={sphereState} size={340} />
          </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-txt-1 mb-3">
            27 signals. One verdict.
          </h2>
          <p className="text-txt-3 text-lg max-w-xl mx-auto">
            DevVerify cross-references multiple data points to separate genuine developers from copy-paste engineers.
          </p>
        </div>

        <div className="bento-grid">
          {signals.map((s, i) => {
            const Icon = s.icon
            const spanClass = i === 0 || i === 5 ? 'bento-span-2' : ''
            const colorClass = `card-memphis-${s.color.replace('memphis-', '')}`
            return (
              <div
                key={i}
                className={`card-memphis ${colorClass} ${spanClass} animate-bento-pop flex flex-col gap-4`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border-3"
                  style={{ borderColor: s.accent, background: `${s.accent}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: s.accent }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-txt-1 mb-1">{s.title}</h3>
                  <p className="text-txt-3 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-3 border-surface-3 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-memphis-violet" />
            <span className="font-display font-bold text-txt-2">DevVerify</span>
          </div>
          <p className="text-txt-3 text-sm">Detecting copy-paste developers since 2024.</p>
        </div>
      </footer>
    </div>
  )
}
