'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Share2, Copy, Check, ExternalLink, AlertTriangle, CheckCircle2, Code2, BarChart3, Brain, ChevronDown, ChevronUp, ArrowRight, Hash } from 'lucide-react'
import { GithubIcon } from '../../../components/icons'

const VERDICT_CONFIG = {
  genuine: { 
    label: 'Genuine DNA', 
    color: '#00E676', 
    bg: 'rgba(0, 230, 118, 0.05)', 
    border: '#00E676', 
    emoji: '🟢', 
    badgeClass: 'badge-genuine',
    cardClass: 'border-memphis-green bg-memphis-green/5',
    textClass: 'text-memphis-green',
  },
  suspicious: { 
    label: 'Suspicious Profile', 
    color: '#FECA57', 
    bg: 'rgba(254, 202, 87, 0.05)', 
    border: '#FECA57', 
    emoji: '🟡', 
    badgeClass: 'badge-suspicious',
    cardClass: 'border-memphis-yellow bg-memphis-yellow/5',
    textClass: 'text-memphis-yellow',
  },
  highly_suspicious: { 
    label: 'Highly Suspicious', 
    color: '#FF4757', 
    bg: 'rgba(255, 71, 87, 0.05)', 
    border: '#FF4757', 
    emoji: '🔴', 
    badgeClass: 'badge-highly_suspicious',
    cardClass: 'border-memphis-red bg-memphis-red/5',
    textClass: 'text-memphis-red',
  },
}

const PLATFORM_ICONS = { leetcode: Code2, github: GithubIcon, codeforces: BarChart3 }
const PLATFORM_COLORS = { leetcode: '#FFA116', github: '#00E676', codeforces: '#00D2FF' }
const PLATFORM_NAMES = { leetcode: 'LeetCode', github: 'GitHub', codeforces: 'Codeforces' }

function ScoreRing({ score, color, size = 130 }) {
  const r = 50, circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" className="-rotate-90">
        {/* Shadow circle for Memphis styling */}
        <circle cx="63" cy="63" r={r} fill="none" stroke="#000000" strokeWidth="12" opacity="0.3" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2A2A40" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-bold text-txt-1 leading-none">{score}</span>
        <span className="text-[10px] text-txt-3 mt-1 font-mono font-bold uppercase">DNA Score</span>
      </div>
    </div>
  )
}

function MiniScoreBar({ score, color, label }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-txt-2 w-24 font-mono font-bold uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-4 rounded-full bg-surface-3 border-2 border-surface-2 overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-txt-1 font-mono w-8 text-right">{score}%</span>
    </div>
  )
}

function SignalItem({ signal }) {
  const isPositive = signal.severity === 'positive'
  const colors = {
    high: { border: 'border-memphis-red', text: 'text-memphis-red', bg: 'bg-memphis-red/10', badge: '🚨 High Alert' },
    medium: { border: 'border-memphis-yellow', text: 'text-memphis-yellow', bg: 'bg-memphis-yellow/10', badge: '⚠️ Medium Alert' },
    positive: { border: 'border-memphis-green', text: 'text-memphis-green', bg: 'bg-memphis-green/10', badge: '✨ Boost Indicator' },
  }
  const c = colors[signal.severity] || colors.medium
  const PlatformIcon = PLATFORM_ICONS[signal.platform]
  return (
    <div className={`p-4 rounded-xl border-3 ${c.border} ${c.bg} flex items-start gap-4 transition-all hover:scale-[1.01]`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${c.text} border border-current bg-void`}>
            {c.badge}
          </span>
          {PlatformIcon && <PlatformIcon className="w-3.5 h-3.5" style={{ color: PLATFORM_COLORS[signal.platform] || 'var(--text-3)' }} />}
          <span className="text-[10px] font-mono font-bold text-txt-3 tracking-wider uppercase">{PLATFORM_NAMES[signal.platform]}</span>
        </div>
        <h4 className="font-display font-bold text-sm text-txt-1 mb-1">{signal.label}</h4>
        <p className="text-txt-2 text-xs leading-relaxed">{signal.description}</p>
      </div>
      <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border-2 ${c.border} bg-void ${c.text} flex-shrink-0`}>
        {isPositive ? `+${signal.deduction}` : signal.deduction}
      </div>
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
    <div className="min-h-screen bg-memphis text-txt-1 relative overflow-hidden">
      {/* Background Geometric Decorations */}
      <div className="geo-circle w-32 h-32 border-memphis-violet top-[10%] left-[5%] opacity-15 animate-geo-float" />
      <div className="geo-circle w-20 h-20 border-memphis-cyan top-[20%] right-[10%] opacity-10 animate-geo-float" style={{ animationDelay: '2s' }} />
      <div className="geo-triangle border-b-memphis-pink bottom-[20%] left-[10%] opacity-10 animate-geo-spin" />
      <div className="geo-cross text-memphis-orange bottom-[15%] right-[15%] opacity-20 animate-geo-float" style={{ animationDelay: '4s' }} />
      <div className="geo-dots text-memphis-yellow top-[40%] left-[50%] opacity-10 animate-geo-spin" style={{ animationDelay: '1s' }} />

      {/* Nav */}
      <nav className="navbar-memphis">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-memphis-orange to-memphis-violet flex items-center justify-center border-2 border-memphis-orange/30">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">SIGIL</span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={handleCopy} className="btn-memphis btn-memphis-outline text-xs py-2.5 px-4 flex items-center gap-2">
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
          </button>
          <Link href="/" className="btn-memphis btn-memphis-primary text-xs py-2.5 px-4">
            <ArrowRight className="w-4 h-4" /> New Run
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Profile Header */}
        <div className="card-memphis p-6 mb-8 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-6 border-memphis-violet/40">
          <div className="flex items-center gap-5 flex-wrap">
            {lcProfile.avatar ? (
              <img src={lcProfile.avatar} alt="" className="w-16 h-16 rounded-memphis border-3 border-surface-3 flex-shrink-0" />
            ) : ghProfile?.avatar ? (
              <img src={ghProfile.avatar} alt="" className="w-16 h-16 rounded-memphis border-3 border-surface-3 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-memphis bg-surface-3 flex items-center justify-center flex-shrink-0 border-3 border-surface-3">
                <span className="text-2xl">👤</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-txt-1">
                  {analysis.leetcode_username || analysis.github_username || analysis.codeforces_handle}
                </h1>
                <div className="flex gap-2 flex-wrap">
                  {analysis.leetcode_username && (
                    <a href={`https://leetcode.com/${analysis.leetcode_username}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 bg-[#FFA116]/10 text-[#FFA116] border-[#FFA116]/40 hover:scale-105 transition-transform">
                      <Code2 className="w-3.5 h-3.5" /> LeetCode <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                  {analysis.github_username && (
                    <a href={`https://github.com/${analysis.github_username}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 bg-[#00E676]/10 text-[#00E676] border-[#00E676]/40 hover:scale-105 transition-transform">
                      <GithubIcon className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                  {analysis.codeforces_handle && (
                    <a href={`https://codeforces.com/profile/${analysis.codeforces_handle}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 bg-[#00D2FF]/10 text-[#00D2FF] border-[#00D2FF]/40 hover:scale-105 transition-transform">
                      <BarChart3 className="w-3.5 h-3.5" /> Codeforces <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-txt-3 text-xs font-mono uppercase tracking-widest">
                DNA DECODED ON {new Date(analysis.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Main Verdict & Score Card */}
          <div className={`card-memphis bento-span-2 flex flex-col md:flex-row items-center gap-8 ${vc.cardClass} border-3`}>
            <ScoreRing score={analysis.score} color={vc.color} />
            <div className="flex-1 text-center md:text-left">
              <div className={`font-display font-extrabold text-3xl mb-2 flex items-center justify-center md:justify-start gap-2 ${vc.textClass}`}>
                <span>{vc.emoji}</span>
                <span>{vc.label}</span>
              </div>
              <p className="text-txt-2 text-sm leading-relaxed mb-4">
                {analysis.verdict === 'genuine' && 'This profile displays robust, organic learning trajectories and consistent programming style across environments.'}
                {analysis.verdict === 'suspicious' && 'Moderate structural anomalies detected. Highly localized submission bursts and atypical complexity distributions suggest potential copy-pasting.'}
                {analysis.verdict === 'highly_suspicious' && 'Severe pattern matching anomalies. Discovered copy-paste code DNA signature, extreme burst submission metrics, and mismatched solve speed profiles.'}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold bg-void/50 border border-surface-3 px-3 py-1 rounded-full text-txt-3">
                  {negSignals.length} RED FLAGS
                </span>
                <span className="text-xs font-mono font-bold bg-void/50 border border-surface-3 px-3 py-1 rounded-full text-txt-3">
                  {posSignals.length} POSITIVE INDICATORS
                </span>
              </div>
            </div>
          </div>

          {/* AI Quiz Challenge Card */}
          <div className="card-memphis bento-span-2 border-memphis-violet/60 bg-memphis-violet/5 flex flex-col justify-between hover:border-memphis-violet transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-memphis-violet flex items-center justify-center text-white">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="font-display font-bold text-lg text-txt-1">AI DNA Verifier Challenge</h3>
              </div>
              <p className="text-txt-2 text-sm leading-relaxed mb-4">
                {analysis.verdict === 'genuine'
                  ? 'Cement your elite developer status. Complete a custom, real-time AI quiz based on your profile submission history to solidify your authentic rating.'
                  : 'Establish integrity. Run through a fast 3-question AI oral defense focused on your exact problem choices and code logic to overwrite potential false positives.'}
              </p>
            </div>
            <div>
              <button onClick={handleStartQuiz} disabled={quizLoading} className="btn-memphis btn-memphis-orange w-full flex items-center justify-center gap-2 text-sm">
                {quizLoading ? 'Generating Questions...' : <><Brain className="w-4 h-4" /> Initiate DNA Verification <ArrowRight className="w-4 h-4 animate-pulse" /></>}
              </button>
            </div>
          </div>

          {/* Cross-Platform Credentials */}
          {(analysis.leetcode_score != null || analysis.github_score != null || analysis.codeforces_score != null) && (
            <div className="card-memphis bento-span-2 border-memphis-cyan/50 flex flex-col justify-center">
              <h3 className="font-display font-bold text-md text-txt-1 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-memphis-cyan" /> Cross-Platform Credentials
              </h3>
              <div className="space-y-4">
                {analysis.leetcode_score != null && <MiniScoreBar score={analysis.leetcode_score} color="#FFA116" label="LeetCode" />}
                {analysis.github_score != null && <MiniScoreBar score={analysis.github_score} color="#00E676" label="GitHub" />}
                {analysis.codeforces_score != null && <MiniScoreBar score={analysis.codeforces_score} color="#00D2FF" label="Codeforces" />}
              </div>
            </div>
          )}

          {/* DNA Score Adjustment Log */}
          <div className="card-memphis bento-span-2 border-memphis-pink/50">
            <h3 className="font-display font-bold text-md text-txt-1 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-memphis-pink" /> DNA Score Adjustment Log
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center bg-void/50 p-2.5 rounded-lg border border-surface-3">
                <span className="text-txt-3">INITIAL TRUST DNA STATUS</span>
                <span className="font-bold text-memphis-green">100</span>
              </div>
              <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {signals.map((s, idx) => (
                  <div key={s.key || idx} className="flex justify-between items-center bg-void/30 p-2 rounded-md border border-surface-2">
                    <span className="text-txt-2 truncate max-w-[240px] uppercase">{s.label}</span>
                    <span className={`font-bold ${s.severity === 'positive' ? 'text-memphis-green' : 'text-memphis-red'}`}>
                      {s.deduction > 0 ? `+${s.deduction}` : s.deduction}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-surface-3 pt-3 mt-2 flex justify-between items-center">
                <span className="font-display font-bold text-sm text-txt-1">FINAL DECIDED RATING</span>
                <span className="font-display font-extrabold text-xl" style={{ color: vc.color }}>{analysis.score}</span>
              </div>
            </div>
          </div>

          {/* LeetCode Stats */}
          {lcSummary.totalSolved != null && (
            <div className="card-memphis bento-span-2 border-[#FFA116]/50 bg-[#FFA116]/5 hover:border-[#FFA116] transition-colors">
              <h3 className="font-display font-bold text-md text-txt-1 mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#FFA116]" /> LeetCode Solve Matrix
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">TOTAL PROBLEMS</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{lcSummary.totalSolved}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">ACTIVE SECTOR DAYS</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{lcSummary.totalActiveDays}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3 col-span-2 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <span className="text-[10px] text-memphis-green block font-mono font-bold">EASY</span>
                    <span className="text-sm font-bold text-txt-1">{lcSummary.easySolved}</span>
                  </div>
                  <div className="text-center border-x border-surface-3">
                    <span className="text-[10px] text-memphis-yellow block font-mono font-bold">MEDIUM</span>
                    <span className="text-sm font-bold text-txt-1">{lcSummary.medSolved}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-memphis-red block font-mono font-bold">HARD</span>
                    <span className="text-sm font-bold text-txt-1">{lcSummary.hardSolved}</span>
                  </div>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">CURRENT STREAK</span>
                  <span className="text-md font-bold text-memphis-orange">{lcSummary.streak ? `${lcSummary.streak} Days` : '0 Days'}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">WRONG RATE</span>
                  <span className="text-md font-bold text-memphis-red">{lcSummary.wrongAttemptRate != null ? `${lcSummary.wrongAttemptRate}%` : '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* GitHub Stats */}
          {ghSummary && (
            <div className="card-memphis bento-span-2 border-[#00E676]/50 bg-[#00E676]/5 hover:border-[#00E676] transition-colors">
              <h3 className="font-display font-bold text-md text-txt-1 mb-4 flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-[#00E676]" /> GitHub Commits DNA
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">PUBLIC REPOS</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{ghSummary.publicRepos}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">STARS HARVESTED</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{ghSummary.starsReceived}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">PR ACTIVITY COUNT</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{ghSummary.prActivityCount}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">GENERIC COMMITS RATE</span>
                  <span className={`text-xl font-display font-extrabold ${ghSummary.genericCommitRate > 40 ? 'text-memphis-red' : 'text-memphis-green'}`}>{ghSummary.genericCommitRate}%</span>
                </div>
                {ghSummary.topLanguages?.length > 0 && (
                  <div className="bg-void/40 p-3 rounded-xl border border-surface-3 col-span-2">
                    <span className="text-xs text-txt-3 block font-mono mb-2">PRIMARY LANGUAGES</span>
                    <div className="flex flex-wrap gap-2">
                      {ghSummary.topLanguages.slice(0, 5).map(l => (
                        <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-surface-3 text-txt-2 border border-surface-2 font-mono font-bold uppercase">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Codeforces Stats */}
          {cfSummary && (
            <div className="card-memphis bento-span-2 border-[#00D2FF]/50 bg-[#00D2FF]/5 hover:border-[#00D2FF] transition-colors">
              <h3 className="font-display font-bold text-md text-txt-1 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00D2FF]" /> Codeforces Rating Profile
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">UNIQUE PROBLEMS SOLVED</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{cfSummary.uniqueAC}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">CONTEST RATING</span>
                  <span className="text-xl font-display font-extrabold text-memphis-orange">{cfSummary.currentRating || '—'}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">MAX RATING PEAK</span>
                  <span className="text-xl font-display font-extrabold text-txt-1">{cfSummary.maxRating || '—'}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3">
                  <span className="text-xs text-txt-3 block font-mono">RANK DEGREE</span>
                  <span className="text-md font-bold text-memphis-cyan font-mono uppercase">{cfSummary.rank || '—'}</span>
                </div>
                <div className="bg-void/40 p-3 rounded-xl border border-surface-3 col-span-2 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-txt-3 block font-mono">CONTEST PARTICIPATION</span>
                    <span className="text-lg font-bold text-txt-1">{cfSummary.contestsParticipated} Contests</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-txt-3 block font-mono">SUBMISSION ERROR RATE</span>
                    <span className="text-lg font-bold text-memphis-red">{cfSummary.wrongRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Red Flags / Anomalies */}
          {negSignals.length > 0 ? (
            <div className="card-memphis bento-span-2 border-memphis-red/40">
              <h2 className="font-display font-bold text-lg text-txt-1 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-memphis-red animate-bounce" /> Anomalous Patterns Identified
              </h2>
              <div className="space-y-3">
                {displaySignals.map((s, idx) => <SignalItem key={s.key || idx} signal={s} />)}
              </div>
              {negSignals.length > 5 && (
                <button onClick={() => setShowAllSignals(!showAllSignals)}
                  className="btn-memphis btn-memphis-outline w-full text-xs py-2 mt-4 flex items-center justify-center gap-1">
                  {showAllSignals ? <><ChevronUp className="w-4 h-4" /> Show Less</> : <><ChevronDown className="w-4 h-4" /> Show All {negSignals.length} Anomalies</>}
                </button>
              )}
            </div>
          ) : (
            <div className="card-memphis bento-span-2 border-memphis-green/50 bg-memphis-green/5 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-4 animate-bounce">🎉</div>
              <h3 className="font-display font-extrabold text-xl text-memphis-green mb-2">Flawless Code DNA</h3>
              <p className="text-txt-2 text-sm max-w-sm">
                Absolutely no anomalous behavior indices detected. Consistent learning speed and organic patterns.
              </p>
            </div>
          )}

          {/* Positive Signals & Activity Days */}
          <div className="bento-span-2 space-y-6">
            {posSignals.length > 0 && (
              <div className="card-memphis border-memphis-green/40">
                <h2 className="font-display font-bold text-lg text-txt-1 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-memphis-green" /> DNA Integrity Accelerators
                </h2>
                <div className="space-y-3">
                  {posSignals.map((s, idx) => <SignalItem key={s.key || idx} signal={s} />)}
                </div>
              </div>
            )}

            {flaggedDays.length > 0 && (
              <div className="card-memphis border-memphis-yellow/40">
                <h2 className="font-display font-bold text-lg text-txt-1 mb-1 flex items-center gap-2">
                  📅 Atypical Activity Sectors
                </h2>
                <p className="text-xs text-txt-3 mb-4 font-mono">SURGE INTENSITY METRICS PER SOLAR DAY</p>
                <div className="space-y-3">
                  {flaggedDays.map((day, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-void/50 border border-surface-3 transition-all hover:scale-[1.01]">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${day.severity === 'high' ? 'bg-memphis-red animate-pulse' : 'bg-memphis-yellow'}`} />
                        <span className="text-sm text-txt-1 font-mono font-bold">{day.date}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-txt-2 font-mono font-bold">~{day.count} Solves</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          day.severity === 'high' ? 'bg-memphis-red/20 text-memphis-red border border-memphis-red/30' : 'bg-memphis-yellow/20 text-memphis-yellow border border-memphis-yellow/30'
                        }`}>{day.severity === 'high' ? 'BURST ACTIVE' : 'ATYPICAL'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t-3 border-surface-3 py-10 text-center text-sm text-txt-3 bg-void/80 relative z-10 mt-16">
        <div className="flex items-center justify-center gap-2 font-display font-bold text-txt-1 text-md mb-2">
          <Shield className="w-5 h-5 text-memphis-orange" />
          SIGIL · Code DNA Credibility Protocol
        </div>
        <p className="text-xs text-txt-3 max-w-md mx-auto leading-relaxed">
          Confidence reports are generated based on structural heuristic analysis of public programming logs. These metrics provide robust credibility indicators but do not constitute formal background certifications.
        </p>
      </footer>
    </div>
  )
}
