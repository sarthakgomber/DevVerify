'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { Shield, Search, Code2, BarChart3, LogOut, ArrowRight, ChevronRight, ExternalLink } from 'lucide-react'
import { GithubIcon as Github } from '../../components/icons'

const VERDICT_STYLES = {
  genuine:           { label: 'Genuine', color: 'var(--green)', bg: 'var(--green-glow)' },
  suspicious:        { label: 'Suspicious', color: 'var(--amber)', bg: 'var(--amber-glow)' },
  highly_suspicious: { label: 'Highly Suspicious', color: 'var(--red)', bg: 'var(--red-glow)' },
}

export default function DashboardClient({ user: serverUser, analyses }) {
  const [leetcode, setLeetcode] = useState('')
  const [github, setGithub] = useState('')
  const [codeforces, setCodeforces] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [user, setUser] = useState(serverUser)

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
      window.location.href = '/report/' + data.reportId
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayEmail = user?.email || '...'

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[var(--text)]">DevVerify</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-3)]">{displayEmail}</span>
            <button onClick={handleSignOut} className="btn-ghost text-sm flex items-center gap-1.5">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-20 pb-16 space-y-8">
        {/* Analyze Card */}
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-[var(--text)] mb-1">Analyze a developer profile</h2>
          <p className="text-[var(--text-2)] text-sm mb-4">Enter usernames from one or more platforms.</p>
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                <input type="text" value={leetcode} onChange={e => setLeetcode(e.target.value)}
                  placeholder="LeetCode username" className="input pl-11" disabled={loading} />
              </div>
              <button type="submit" disabled={loading || (!leetcode.trim() && !github.trim() && !codeforces.trim())}
                className="btn-primary whitespace-nowrap flex items-center gap-2">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing...</>
                ) : (<>Analyze <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[var(--text-3)] hover:text-[var(--accent-2)] flex items-center gap-1 transition-colors">
              <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              {showAdvanced ? 'Hide' : 'Add'} GitHub & Codeforces
            </button>

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
          {error && <p className="text-sm mt-3 bg-[var(--red-glow)] text-[var(--red)] px-4 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Analysis History */}
        <div className="animate-fade-in delay-200">
          <h2 className="font-semibold text-[var(--text)] mb-4">Your analyses</h2>
          {analyses.length === 0 ? (
            <div className="card p-12 text-center">
              <Search className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3" />
              <p className="text-[var(--text-2)] text-sm">No analyses yet. Enter a username above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map(a => {
                const v = VERDICT_STYLES[a.verdict] || VERDICT_STYLES.suspicious
                const platforms = [
                  a.leetcode_username && { icon: Code2, name: a.leetcode_username },
                  a.github_username && { icon: Github, name: a.github_username },
                  a.codeforces_handle && { icon: BarChart3, name: a.codeforces_handle },
                ].filter(Boolean)

                return (
                  <Link key={a.id} href={`/report/${a.report_id}`}
                    className="card p-4 flex items-center gap-4 hover:border-[var(--border-2)] transition-all block group">
                    <div className="w-11 h-11 rounded-xl bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {platforms.map((p, i) => (
                          <span key={i} className="flex items-center gap-1 text-sm text-[var(--text)]">
                            <p.icon className="w-3.5 h-3.5 text-[var(--text-3)]" />
                            <span className="font-semibold">{p.name}</span>
                          </span>
                        ))}
                      </div>
                      <div className="text-[var(--text-3)] text-xs mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: v.bg, color: v.color }}>
                        {v.label}
                      </span>
                      <span className="text-2xl font-bold text-[var(--text)] mono">{a.score}</span>
                      <span className="text-[var(--text-3)] text-xs">/100</span>
                      <ArrowRight className="w-4 h-4 text-[var(--text-3)] group-hover:text-[var(--accent-2)] transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}