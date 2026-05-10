'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Share2, Copy, Check, ExternalLink, AlertTriangle, CheckCircle2, Code2, BarChart3, Brain, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { GithubIcon as Github } from '../../../components/icons'

const VERDICT_CONFIG = {
  genuine: { label: 'Looks Genuine', color: '#22c55e', bg: 'var(--green-glow)', border: 'rgba(34,197,94,0.3)', emoji: '✅' },
  suspicious: { label: 'Suspicious Profile', color: '#f59e0b', bg: 'var(--amber-glow)', border: 'rgba(245,158,11,0.3)', emoji: '⚠️' },
  highly_suspicious: { label: 'Highly Suspicious', color: '#ef4444', bg: 'var(--red-glow)', border: 'rgba(239,68,68,0.3)', emoji: '🚨' },
}

const PLATFORM_ICONS = { leetcode: Code2, github: Github, codeforces: BarChart3 }
const PLATFORM_COLORS = { leetcode: '#FFA116', github: '#238636', codeforces: '#1890FF' }
const PLATFORM_NAMES = { leetcode: 'LeetCode', github: 'GitHub', codeforces: 'Codeforces' }

function ScoreRing({ score, color, size = 120 }) {
  const r = 50, circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[var(--text)]">{score}</span>
        <span className="text-xs text-[var(--text-3)]">/100</span>
      </div>
    </div>
  )
}

function MiniScoreBar({ score, color, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-2)] w-20">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-[var(--text)] mono w-8 text-right">{score}</span>
    </div>
  )
}

function SignalItem({ signal }) {
  const isPositive = signal.severity === 'positive'
  const colors = {
    high: { bg: 'var(--red-glow)', text: 'var(--red)', dot: 'bg-red-500' },
    medium: { bg: 'var(--amber-glow)', text: 'var(--amber)', dot: 'bg-amber-500' },
    positive: { bg: 'var(--green-glow)', text: 'var(--green)', dot: 'bg-green-500' },
  }
  const c = colors[signal.severity] || colors.medium
  const PlatformIcon = PLATFORM_ICONS[signal.platform]
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: c.bg }}>
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: c.text }}>{signal.label}</span>
          {PlatformIcon && <PlatformIcon className="w-3 h-3" style={{ color: PLATFORM_COLORS[signal.platform] || 'var(--text-3)' }} />}
        </div>
        <div className="text-[var(--text-2)] text-xs mt-0.5 leading-relaxed">{signal.description}</div>
      </div>
      <span className="text-xs font-bold flex-shrink-0 mono" style={{ color: c.text }}>
        {isPositive ? `+${signal.deduction}` : signal.deduction}
      </span>
    </div>
  )
}

export default function ReportClient({ analysis }) {
  const [copied, setCopied] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [showAllSignals, setShowAllSignals] = useState(false)
  const router = useRouter()

  const vc = VERDICT_CONFIG[analysis.verdict] || VERDICT_CONFIG.suspicious
  const signals = analysis.signals || []
  const raw = analysis.raw_data || {}
  const negSignals = signals.filter(s => s.severity !== 'positive')
  const posSignals = signals.filter(s => s.severity === 'positive')
  const displaySignals = showAllSignals ? negSignals : negSignals.slice(0, 5)

  // Platform data
  const lcData = raw.leetcode || raw
  const ghData = raw.github
  const cfData = raw.codeforces
  const lcProfile = lcData?.profile || raw.profile || {}
  const ghProfile = ghData?.profile
  const cfProfile = cfData?.profile
  const lcSummary = lcData?.summary || raw.summary || {}
  const ghSummary = ghData?.summary
  const cfSummary = cfData?.summary
  const flaggedDays = lcData?.flaggedDays || raw.flaggedDays || []

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStartQuiz() {
    setQuizLoading(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: analysis.report_id }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Failed to generate quiz'); return }
      router.push(`/quiz/${data.sessionId}`)
    } catch {
      alert('Failed to start quiz. Make sure GEMINI_API_KEY is configured.')
    } finally {
      setQuizLoading(false)
    }
  }

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
          <div className="flex items-center gap-3">
            <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Share report</>}
            </button>
            <Link href="/" className="btn-primary text-sm py-2 px-4">Analyze another</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        {/* Profile Header */}
        <div className="card p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-5 flex-wrap">
            {lcProfile.avatar ? (
              <img src={lcProfile.avatar} alt="" className="w-16 h-16 rounded-2xl border-2 border-[var(--border)] flex-shrink-0" />
            ) : ghProfile?.avatar ? (
              <img src={ghProfile.avatar} alt="" className="w-16 h-16 rounded-2xl border-2 border-[var(--border)] flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--glow)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-[var(--text)]">
                  {analysis.leetcode_username || analysis.github_username || analysis.codeforces_handle}
                </h1>
                {analysis.leetcode_username && (
                  <a href={`https://leetcode.com/${analysis.leetcode_username}`} target="_blank" rel="noopener noreferrer"
                    className="badge-accent text-xs flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> LeetCode <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {analysis.github_username && (
                  <a href={`https://github.com/${analysis.github_username}`} target="_blank" rel="noopener noreferrer"
                    className="badge-accent text-xs flex items-center gap-1" style={{ background: 'rgba(35,134,54,0.15)', color: '#238636', borderColor: 'rgba(35,134,54,0.3)' }}>
                    <Github className="w-3 h-3" /> GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {analysis.codeforces_handle && (
                  <a href={`https://codeforces.com/profile/${analysis.codeforces_handle}`} target="_blank" rel="noopener noreferrer"
                    className="badge-accent text-xs flex items-center gap-1" style={{ background: 'rgba(24,144,255,0.15)', color: '#1890FF', borderColor: 'rgba(24,144,255,0.3)' }}>
                    <BarChart3 className="w-3 h-3" /> Codeforces <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[var(--text-3)] text-xs">
                Analyzed {new Date(analysis.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <div className="card p-6 animate-fade-in delay-100" style={{ borderColor: vc.border }}>
              <div className="flex items-center gap-8">
                <ScoreRing score={analysis.score} color={vc.color} />
                <div>
                  <div className="text-2xl font-bold mb-1" style={{ color: vc.color }}>{vc.emoji} {vc.label}</div>
                  <p className="text-[var(--text-2)] text-sm mb-4 max-w-sm">
                    {analysis.verdict === 'genuine' && 'This profile shows normal learning patterns with no major red flags.'}
                    {analysis.verdict === 'suspicious' && 'Some patterns look unusual. This profile may have copied solutions on certain days.'}
                    {analysis.verdict === 'highly_suspicious' && 'Multiple strong signals of copy-paste behavior detected.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs" style={{ color: vc.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: vc.color }} />
                    {negSignals.length} red flag{negSignals.length !== 1 ? 's' : ''} · {posSignals.length} positive signal{posSignals.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Per-platform scores */}
              {(analysis.leetcode_score != null || analysis.github_score != null || analysis.codeforces_score != null) && (
                <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-3">
                  {analysis.leetcode_score != null && <MiniScoreBar score={analysis.leetcode_score} color="#FFA116" label="LeetCode" />}
                  {analysis.github_score != null && <MiniScoreBar score={analysis.github_score} color="#238636" label="GitHub" />}
                  {analysis.codeforces_score != null && <MiniScoreBar score={analysis.codeforces_score} color="#1890FF" label="Codeforces" />}
                </div>
              )}
            </div>

            {/* Red Flags */}
            {negSignals.length > 0 && (
              <div className="card p-6 animate-fade-in delay-200">
                <h2 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--red)]" /> Anomalies detected
                </h2>
                <div className="space-y-3">
                  {displaySignals.map(s => <SignalItem key={s.key} signal={s} />)}
                </div>
                {negSignals.length > 5 && (
                  <button onClick={() => setShowAllSignals(!showAllSignals)}
                    className="mt-3 text-xs text-[var(--accent-2)] hover:underline flex items-center gap-1">
                    {showAllSignals ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {negSignals.length} signals</>}
                  </button>
                )}
              </div>
            )}

            {/* Positive Signals */}
            {posSignals.length > 0 && (
              <div className="card p-6 animate-fade-in delay-300">
                <h2 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--green)]" /> Positive signals
                </h2>
                <div className="space-y-3">
                  {posSignals.map(s => <SignalItem key={s.key} signal={s} />)}
                </div>
              </div>
            )}

            {/* Flagged Days */}
            {flaggedDays.length > 0 && (
              <div className="card p-6 animate-fade-in delay-400">
                <h2 className="font-semibold text-[var(--text)] mb-1 flex items-center gap-2">📅 Suspicious activity days</h2>
                <p className="text-xs text-[var(--text-3)] mb-4">Estimated unique problems solved per day</p>
                <div className="space-y-2">
                  {flaggedDays.map((day, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--surface)]">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${day.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-sm text-[var(--text)] font-medium mono">{day.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text)] font-medium">~{day.count} problems</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          day.severity === 'high' ? 'bg-[var(--red-glow)] text-[var(--red)]' : 'bg-[var(--amber-glow)] text-[var(--amber)]'
                        }`}>{day.severity === 'high' ? 'Very suspicious' : 'Suspicious'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {negSignals.length === 0 && (
              <div className="card p-8 text-center animate-fade-in delay-200" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-semibold text-[var(--green)] mb-1">No anomalies detected</h3>
                <p className="text-[var(--text-2)] text-sm">This profile shows consistent, natural learning patterns.</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* LeetCode Stats */}
            {lcSummary.totalSolved != null && (
              <div className="card p-5 animate-fade-in delay-200">
                <h3 className="font-semibold text-[var(--text)] text-sm mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4" style={{ color: '#FFA116' }} /> LeetCode Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total solved', value: lcSummary.totalSolved },
                    { label: 'Easy', value: lcSummary.easySolved, color: 'var(--green)' },
                    { label: 'Medium', value: lcSummary.medSolved, color: 'var(--amber)' },
                    { label: 'Hard', value: lcSummary.hardSolved, color: 'var(--red)' },
                    { label: 'Active days', value: lcSummary.totalActiveDays },
                    { label: 'Streak', value: lcSummary.streak ? `${lcSummary.streak}d` : '—' },
                    { label: 'Wrong rate', value: lcSummary.wrongAttemptRate != null ? `${lcSummary.wrongAttemptRate}%` : '—' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-3)]">{item.label}</span>
                      <span className="text-sm font-semibold" style={{ color: item.color || 'var(--text)' }}>{item.value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GitHub Stats */}
            {ghSummary && (
              <div className="card p-5 animate-fade-in delay-300">
                <h3 className="font-semibold text-[var(--text)] text-sm mb-4 flex items-center gap-2">
                  <Github className="w-4 h-4" style={{ color: '#238636' }} /> GitHub Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Repos', value: ghSummary.publicRepos },
                    { label: 'Followers', value: ghSummary.followers },
                    { label: 'Stars', value: ghSummary.starsReceived },
                    { label: 'PRs', value: ghSummary.prActivityCount },
                    { label: 'Generic msgs', value: `${ghSummary.genericCommitRate}%` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-3)]">{item.label}</span>
                      <span className="text-sm font-semibold text-[var(--text)]">{item.value ?? '—'}</span>
                    </div>
                  ))}
                  {ghSummary.topLanguages?.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <span className="text-xs text-[var(--text-3)] mb-2 block">Languages</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ghSummary.topLanguages.slice(0, 6).map(l => (
                          <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-2)]">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Codeforces Stats */}
            {cfSummary && (
              <div className="card p-5 animate-fade-in delay-300">
                <h3 className="font-semibold text-[var(--text)] text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: '#1890FF' }} /> Codeforces Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Unique solved', value: cfSummary.uniqueAC },
                    { label: 'Rank', value: cfSummary.rank },
                    { label: 'Rating', value: cfSummary.currentRating },
                    { label: 'Max rating', value: cfSummary.maxRating },
                    { label: 'Contests', value: cfSummary.contestsParticipated },
                    { label: 'Wrong rate', value: `${cfSummary.wrongRate}%` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-3)]">{item.label}</span>
                      <span className="text-sm font-semibold text-[var(--text)]">{item.value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="card p-5 animate-fade-in delay-400">
              <h3 className="font-semibold text-[var(--text)] text-sm mb-4">Score breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-3)]">Base score</span>
                  <span className="font-semibold text-[var(--text)] mono">100</span>
                </div>
                {signals.map(s => (
                  <div key={s.key} className="flex justify-between text-xs">
                    <span className="text-[var(--text-3)] truncate max-w-[140px]">{s.label}</span>
                    <span className={`font-semibold mono ${s.severity === 'positive' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                      {s.deduction > 0 ? `+${s.deduction}` : s.deduction}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-[var(--text)]">Final score</span>
                  <span className="font-bold mono" style={{ color: vc.color }}>{analysis.score}</span>
                </div>
              </div>
            </div>

            {/* Quiz CTA */}
            <div className="card p-5 glow-border animate-fade-in delay-500">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-[var(--accent-2)]" />
                <h3 className="font-semibold text-[var(--text)] text-sm">AI Quiz Challenge</h3>
              </div>
              <p className="text-xs text-[var(--text-2)] mb-4 leading-relaxed">
                {analysis.verdict === 'genuine'
                  ? 'Prove your profile is real by acing a 3-question quiz on your solved problems.'
                  : 'Take a quiz to explain your solutions and improve your credibility score.'}
              </p>
              <button onClick={handleStartQuiz} disabled={quizLoading} className="btn-primary text-sm py-2.5 w-full flex items-center justify-center gap-2">
                {quizLoading ? 'Generating questions...' : <><Brain className="w-4 h-4" /> Start quiz <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--text-3)]">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-[var(--accent)]" />
          DevVerify · <Link href="/" className="hover:text-[var(--text)] transition-colors">Analyze another profile</Link>
        </div>
        <p className="text-xs text-[var(--text-3)] mt-2 max-w-md mx-auto">
          Disclaimer: Scores reflect statistical patterns, not definitive judgments. Always verify through interviews.
        </p>
      </footer>
    </div>
  )
}
