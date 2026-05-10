'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Zap, Target, TrendingUp, Clock, GitBranch, Award, ArrowRight, Search, Code2, BarChart3, Brain, Share2, ChevronRight } from 'lucide-react'
import { GithubIcon as Github } from '../components/icons'

export default function HomePage() {
  const [leetcode, setLeetcode] = useState('')
  const [github, setGithub] = useState('')
  const [codeforces, setCodeforces] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const router = useRouter()

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!leetcode.trim() && !github.trim() && !codeforces.trim()) return
    setLoading(true)
    setError('')
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
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      if (data.reportId) {
        router.push('/report/' + data.reportId)
      } else {
        setError(`Analysis complete (Score: ${data.score}/100, ${data.verdict}) but report could not be saved. Please run the updated schema in Supabase SQL Editor.`)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const signals = [
    { icon: Zap, title: 'Burst Detection', desc: 'Flags days with 10+ problems solved in a single session — statistically near-impossible.', color: 'from-amber-500 to-orange-600' },
    { icon: Target, title: 'Accuracy Analysis', desc: 'Zero wrong attempts across hundreds of problems? That\'s a red flag we catch.', color: 'from-red-500 to-rose-600' },
    { icon: TrendingUp, title: 'Difficulty Spikes', desc: 'Jumping Easy→Hard without foundation signals copy-paste behavior.', color: 'from-violet-500 to-purple-600' },
    { icon: Clock, title: 'Account Age Check', desc: 'A 2-week-old account with 200 solved problems doesn\'t add up.', color: 'from-blue-500 to-cyan-600' },
    { icon: GitBranch, title: 'GitHub Deep Scan', desc: 'README-only commits, zero PRs, generic messages — we detect padding.', color: 'from-emerald-500 to-teal-600' },
    { icon: Brain, title: 'AI Quiz Engine', desc: 'Flagged profiles get quizzed on their own solutions. Can they explain them?', color: 'from-indigo-500 to-violet-600' },
  ]

  const platforms = [
    { name: 'LeetCode', icon: Code2, count: '9 signals', color: '#FFA116' },
    { name: 'GitHub', icon: Github, count: '11 signals', color: '#238636' },
    { name: 'Codeforces', icon: BarChart3, count: '7 signals', color: '#1890FF' },
  ]

  const stats = [
    { label: 'Detection Signals', value: '27+' },
    { label: 'AI Quiz Types', value: '5' },
    { label: 'Platforms', value: '3' },
    { label: 'Cost to You', value: 'Free' },
  ]

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[var(--text)]">DevVerify</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">Sign up free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 badge-accent mb-8">
            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
            Multi-platform anomaly detection — free & open
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in delay-100 text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
            Is that developer profile{' '}
            <span className="gradient-text-accent">actually real?</span>
          </h1>

          <p className="animate-fade-in delay-200 text-lg md:text-xl text-[var(--text-2)] mb-12 max-w-2xl mx-auto leading-relaxed">
            DevVerify detects copy-paste patterns across LeetCode, GitHub & Codeforces.
            Get a credibility score backed by <span className="text-[var(--text)] font-medium">27+ behavioral signals</span> and an AI-powered quiz.
          </p>

          {/* Analyze Form */}
          <div className="animate-fade-in delay-300 max-w-2xl mx-auto">
            <form onSubmit={handleAnalyze} className="space-y-3">
              {/* Main input */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                  <input
                    type="text" value={leetcode}
                    onChange={e => setLeetcode(e.target.value)}
                    placeholder="LeetCode username"
                    className="input pl-12 text-base py-4"
                    disabled={loading}
                  />
                </div>
                <button type="submit" disabled={loading || (!leetcode.trim() && !github.trim() && !codeforces.trim())}
                  className="btn-primary whitespace-nowrap py-4 px-8 text-base flex items-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing...</>
                  ) : (<>Analyze<ArrowRight className="w-5 h-5" /></>)}
                </button>
              </div>

              {/* Advanced toggle */}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-[var(--text-3)] hover:text-[var(--accent-2)] flex items-center gap-1 transition-colors">
                  <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                  {showAdvanced ? 'Hide' : 'Add'} GitHub & Codeforces
                </button>
                <span className="text-xs text-[var(--text-3)]">No account needed</span>
              </div>

              {/* Advanced inputs */}
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                    <input type="text" value={github} onChange={e => setGithub(e.target.value)}
                      placeholder="GitHub username" className="input pl-11" disabled={loading} />
                  </div>
                  <div className="relative">
                    <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                    <input type="text" value={codeforces} onChange={e => setCodeforces(e.target.value)}
                      placeholder="Codeforces handle" className="input pl-11" disabled={loading} />
                  </div>
                </div>
              )}
            </form>

            {error && <p className="text-[var(--red)] text-sm mt-3 bg-[var(--red-glow)] px-4 py-2 rounded-lg">{error}</p>}
          </div>

          {/* Platform badges */}
          <div className="animate-fade-in delay-400 flex items-center justify-center gap-6 mt-10">
            {platforms.map(p => (
              <div key={p.name} className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <p.icon className="w-4 h-4" style={{ color: p.color }} />
                <span>{p.name}</span>
                <span className="text-[var(--text-3)] text-xs">({p.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="max-w-4xl mx-auto mt-20 animate-fade-in delay-500">
          <div className="card p-1">
            <div className="grid grid-cols-4 divide-x divide-[var(--border)]">
              {stats.map(s => (
                <div key={s.label} className="py-6 px-4 text-center">
                  <div className="text-3xl font-bold gradient-text-accent mono">{s.value}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signals grid */}
        <div className="max-w-5xl mx-auto mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              27+ detection signals.{' '}
              <span className="text-[var(--text-3)]">Every pattern matters.</span>
            </h2>
            <p className="text-[var(--text-2)] max-w-xl mx-auto">
              From burst submissions to README-only contributions, DevVerify catches what human reviewers miss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.map((item, i) => (
              <div key={item.title}
                className={`card p-6 group hover:border-[var(--border-2)] transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">How DevVerify works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Enter Usernames', desc: 'Drop in LeetCode, GitHub, or Codeforces usernames. No login needed.', icon: Search },
              { step: '02', title: 'AI Analysis', desc: '27+ behavioral signals are checked across all platforms in seconds.', icon: BarChart3 },
              { step: '03', title: 'Get Verdict', desc: 'A shareable credibility report with score breakdown and AI quiz option.', icon: Share2 },
            ].map((item, i) => (
              <div key={item.step} className="card p-6 text-center animate-fade-in" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                <div className="text-xs mono text-[var(--accent-2)] font-semibold mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-[var(--glow)] flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[var(--accent-2)]" />
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-2)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-24 text-center">
          <div className="card p-12 glow-border">
            <Award className="w-12 h-12 text-[var(--accent-2)] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
              Ready to verify a profile?
            </h2>
            <p className="text-[var(--text-2)] mb-8 max-w-md mx-auto">
              Stop wasting interview time on padded profiles. Get a credibility score in under 60 seconds.
            </p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn-primary text-lg py-4 px-10">
              Start analyzing — it's free
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-10 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--text-3)]">
            <Shield className="w-4 h-4 text-[var(--accent)]" />
            <span>DevVerify</span>
            <span className="mx-2">·</span>
            <span>Detect copy-paste developers</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--text-3)]">
            <Link href="/auth/login" className="hover:text-[var(--text)] transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-[var(--text)] transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
