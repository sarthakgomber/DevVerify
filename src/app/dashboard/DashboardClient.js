'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Sphere from '../../components/Sphere'
import { Shield, Search, Code2, Target, LogOut, ArrowRight, ExternalLink, BarChart3, Hash, Zap } from 'lucide-react'

const VERDICT_CONFIG = {
  genuine:           { label: 'Genuine', badge: 'badge-genuine' },
  suspicious:        { label: 'Suspicious', badge: 'badge-suspicious' },
  highly_suspicious: { label: 'Highly Suspicious', badge: 'badge-highly_suspicious' },
}

export default function DashboardClient({ user: serverUser, analyses }) {
  const [leetcode, setLeetcode] = useState('')
  const [github, setGithub] = useState('')
  const [codeforces, setCodeforces] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sphereState, setSphereState] = useState('idle')
  const [user, setUser] = useState(serverUser)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user || !user.email) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setUser(data.user)
      })
    }
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
        body: JSON.stringify({ leetcode: leetcode.trim(), github: github.trim(), codeforces: codeforces.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Analysis failed'); setSphereState('idle'); setLoading(false); return }
      setSphereState('complete')
      setTimeout(() => {
        if (data.reportId) router.push('/report/' + data.reportId)
      }, 1200)
    } catch {
      setError('Network error')
      setSphereState('idle')
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const genuineCount = analyses.filter(a => a.verdict === 'genuine').length
  const suspiciousCount = analyses.filter(a => a.verdict === 'suspicious' || a.verdict === 'highly_suspicious').length
  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + (a.score || 0), 0) / analyses.length) : 0

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar-memphis">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-memphis-orange to-memphis-violet flex items-center justify-center border-2 border-memphis-orange/30">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">DevVerify</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-txt-3 text-sm hidden sm:block font-mono">{user?.email}</span>
          <button onClick={handleSignOut} className="btn-memphis btn-memphis-outline text-sm py-2 px-4">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome + Stats Bento */}
        <div className="bento-grid mb-8">
          {/* Welcome Card */}
          <div className="card-memphis bento-span-2 flex flex-col justify-between">
            <div>
              <p className="text-txt-3 text-sm font-mono uppercase tracking-widest mb-2">Welcome back</p>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-txt-1 mb-2">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer'}
              </h1>
              <p className="text-txt-2 text-sm">The SIGIL oracle is ready to read.</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-memphis-green animate-pulse" />
              <span className="text-memphis-green text-xs font-mono uppercase">Online</span>
            </div>
          </div>

          {/* Total Analyses */}
          <div className="card-memphis card-memphis-violet flex flex-col items-center justify-center text-center">
            <Hash className="w-6 h-6 text-memphis-violet mb-2" />
            <span className="font-display font-bold text-3xl text-txt-1">{analyses.length}</span>
            <span className="text-txt-3 text-xs font-mono uppercase mt-1">Analyses</span>
          </div>

          {/* Avg Score */}
          <div className="card-memphis card-memphis-cyan flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-6 h-6 text-memphis-cyan mb-2" />
            <span className="font-display font-bold text-3xl text-txt-1">{avgScore}</span>
            <span className="text-txt-3 text-xs font-mono uppercase mt-1">Avg Score</span>
          </div>

          {/* Genuine Count */}
          <div className="card-memphis card-memphis-green flex flex-col items-center justify-center text-center">
            <Zap className="w-6 h-6 text-memphis-green mb-2" />
            <span className="font-display font-bold text-3xl text-txt-1">{genuineCount}</span>
            <span className="text-txt-3 text-xs font-mono uppercase mt-1">Genuine</span>
          </div>

          {/* Flagged Count */}
          <div className="card-memphis card-memphis-orange flex flex-col items-center justify-center text-center">
            <Target className="w-6 h-6 text-memphis-orange mb-2" />
            <span className="font-display font-bold text-3xl text-txt-1">{suspiciousCount}</span>
            <span className="text-txt-3 text-xs font-mono uppercase mt-1">Flagged</span>
          </div>

          {/* Analyze Card — with Sphere */}
          <div className="card-memphis bento-span-2 bento-row-2">
            <h2 className="font-display font-bold text-xl text-txt-1 mb-4">New Analysis</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <Sphere state={sphereState} size={180} />
              </div>
              <form onSubmit={handleAnalyze} className="flex-1 space-y-3 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3" />
                  <input value={leetcode} onChange={e => setLeetcode(e.target.value)}
                    placeholder="LeetCode username" className="input-memphis pl-11 text-sm" />
                </div>
                {showAdvanced && (
                  <div className="space-y-3 animate-slide-up">
                    <div className="relative">
                      <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3" />
                      <input value={github} onChange={e => setGithub(e.target.value)}
                        placeholder="GitHub username" className="input-memphis pl-11 text-sm" />
                    </div>
                    <div className="relative">
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3" />
                      <input value={codeforces} onChange={e => setCodeforces(e.target.value)}
                        placeholder="Codeforces handle" className="input-memphis pl-11 text-sm" />
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="btn-memphis btn-memphis-orange flex-1 text-sm py-3">
                    {loading ? 'Reading' : 'Analyze'}{loading && '...'} {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                    className="btn-memphis btn-memphis-outline px-4 text-sm py-3">+</button>
                </div>
                {error && <p className="text-memphis-red text-sm font-medium">{error}</p>}
              </form>
            </div>
          </div>

          {/* Recent Analyses — wide table */}
          <div className="card-memphis bento-span-2 bento-row-2">
            <h2 className="font-display font-bold text-xl text-txt-1 mb-4">Recent Readings</h2>
            {analyses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 border-3 border-surface-3">
                  <Search className="w-7 h-7 text-txt-3" />
                </div>
                <p className="text-txt-3 text-sm">No analyses yet. Drop a profile above.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {analyses.map((a) => {
                  const v = VERDICT_CONFIG[a.verdict] || VERDICT_CONFIG.genuine
                  return (
                    <Link key={a.id} href={`/report/${a.report_id || a.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-surface-1 border-2 border-surface-3 hover:border-memphis-violet transition-all group">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {a.leetcode_username && <span className="font-mono text-sm text-txt-1">{a.leetcode_username}</span>}
                          {a.github_username && <span className="font-mono text-sm text-memphis-cyan">@{a.github_username}</span>}
                          {a.codeforces_handle && <span className="font-mono text-sm text-memphis-yellow">cf:{a.codeforces_handle}</span>}
                        </div>
                        <span className="text-txt-3 text-xs">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-lg text-txt-1">{a.score}</span>
                        <span className={v.badge}>{v.label}</span>
                        <ExternalLink className="w-4 h-4 text-txt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}