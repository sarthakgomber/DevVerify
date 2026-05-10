'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Clock, Brain, ArrowRight, CheckCircle2, XCircle, Loader2, Award, Send, AlertTriangle } from 'lucide-react'

function Timer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onExpire])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct = (remaining / seconds) * 100
  const isLow = remaining < 30
  const color = isLow ? 'var(--red)' : remaining < 60 ? 'var(--amber)' : 'var(--accent-2)'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={`flex items-center gap-1.5 mono text-sm font-semibold ${isLow ? 'animate-pulse' : ''}`}
        style={{ color }}>
        <Clock className="w-4 h-4" />
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
    </div>
  )
}

export default function QuizPage({ params }) {
  const { sessionId } = params
  const router = useRouter()

  const [phase, setPhase] = useState('loading') // loading | quiz | submitting | results | error
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [timePerQuestion] = useState(180)

  // Fetch quiz session
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/quiz/session/${sessionId}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Failed to load quiz')
          setPhase('error')
          return
        }
        const data = await res.json()
        setQuestions(data.questions)
        setAnswers(new Array(data.questions.length).fill(''))
        setPhase('quiz')
      } catch {
        // If session endpoint doesn't exist yet, try to work with URL params
        setError('Quiz session not found. Please generate a new quiz from a report page.')
        setPhase('error')
      }
    }
    load()
  }, [sessionId])

  const handleTimerExpire = useCallback(() => {
    // Auto-advance to next question or submit
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
    }
  }, [currentQ, questions.length])

  function handleAnswerChange(text) {
    const updated = [...answers]
    updated[currentQ] = text
    setAnswers(updated)
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    }
  }

  function handlePrev() {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    }
  }

  async function handleSubmit() {
    setPhase('submitting')
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to evaluate')
        setPhase('error')
        return
      }
      setResults(data)
      setPhase('results')
    } catch {
      setError('Network error during evaluation')
      setPhase('error')
    }
  }

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-2)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-2)]">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-[var(--amber)] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text)] mb-3">Quiz Error</h1>
          <p className="text-[var(--text-2)] text-sm mb-6">{error}</p>
          <Link href="/" className="btn-primary">Back to home</Link>
        </div>
      </div>
    )
  }

  // Submitting state
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-[var(--accent-2)] animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">Evaluating your answers...</h2>
          <p className="text-[var(--text-2)] text-sm">Our AI is analyzing your explanations for correctness, depth, and clarity.</p>
        </div>
      </div>
    )
  }

  // Results state
  if (phase === 'results' && results) {
    const scoreColor = results.finalScore >= 70 ? 'var(--green)' : results.finalScore >= 45 ? 'var(--amber)' : 'var(--red)'

    return (
      <div className="min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[var(--text)]">DevVerify</span>
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          {/* Score Summary */}
          <div className="card p-8 text-center mb-8 animate-fade-in glow-border">
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: scoreColor }} />
            <h1 className="text-4xl font-bold mb-2 mono" style={{ color: scoreColor }}>{results.finalScore}/100</h1>
            <p className="text-[var(--text-2)] mb-6">Combined Credibility Score</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 rounded-xl bg-[var(--surface)]">
                <div className="text-xl font-bold text-[var(--text)] mono">{results.profileScore}</div>
                <div className="text-xs text-[var(--text-3)]">Profile</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface)]">
                <div className="text-xl font-bold text-[var(--text)] mono">{results.quizScore}</div>
                <div className="text-xs text-[var(--text-3)]">Quiz</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface)]">
                <div className="text-xl font-bold mono" style={{ color: scoreColor }}>{results.finalScore}</div>
                <div className="text-xs text-[var(--text-3)]">Final</div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-3)] mt-4 mono">{results.formula}</p>
          </div>

          {/* Per-question results */}
          <div className="space-y-4">
            {results.evaluations.map((ev, i) => (
              <div key={i} className="card p-6 animate-fade-in" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                <div className="flex items-start gap-3 mb-4">
                  {ev.isLikelyGenuine ?
                    <CheckCircle2 className="w-5 h-5 text-[var(--green)] flex-shrink-0 mt-0.5" /> :
                    <XCircle className="w-5 h-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text)] text-sm mb-1">Question {i + 1}</h3>
                    <p className="text-xs text-[var(--text-2)]">{questions[i]?.question}</p>
                  </div>
                  <span className="mono text-lg font-bold" style={{
                    color: ev.score >= 70 ? 'var(--green)' : ev.score >= 40 ? 'var(--amber)' : 'var(--red)'
                  }}>{ev.score}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Correctness', value: ev.correctness, max: 40 },
                    { label: 'Depth', value: ev.depth, max: 30 },
                    { label: 'Clarity', value: ev.clarity, max: 30 },
                  ].map(d => (
                    <div key={d.label} className="text-center p-2 rounded-lg bg-[var(--surface)]">
                      <div className="text-sm font-semibold text-[var(--text)] mono">{d.value}/{d.max}</div>
                      <div className="text-xs text-[var(--text-3)]">{d.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-2)] bg-[var(--surface)] p-3 rounded-lg">{ev.feedback}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="btn-primary">Analyze another profile</Link>
          </div>
        </main>
      </div>
    )
  }

  // Quiz state
  const q = questions[currentQ]
  const answeredCount = answers.filter(a => a.trim().length > 0).length
  const allAnswered = answeredCount === questions.length

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--accent-2)]" />
            <span className="font-semibold text-[var(--text)]">AI Quiz</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--text-2)]">
            <span>{currentQ + 1} / {questions.length}</span>
            <span className="text-[var(--text-3)]">·</span>
            <span>{answeredCount} answered</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Timer */}
        <div className="mb-6">
          <Timer key={currentQ} seconds={timePerQuestion} onExpire={handleTimerExpire} />
        </div>

        {/* Question */}
        {q && (
          <div className="card p-8 mb-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-accent">Question {currentQ + 1}</span>
              {q.questionType && <span className="text-xs text-[var(--text-3)]">{q.questionType}</span>}
            </div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">{q.problemTitle}</h2>
            <p className="text-[var(--text-2)] leading-relaxed">{q.question}</p>
          </div>
        )}

        {/* Answer */}
        <div className="card p-6 mb-6">
          <label className="text-sm font-medium text-[var(--text-2)] mb-3 block">Your explanation</label>
          <textarea
            value={answers[currentQ] || ''}
            onChange={e => handleAnswerChange(e.target.value)}
            placeholder="Explain your approach, why it works, and how you handle edge cases..."
            className="input min-h-[180px] resize-y text-sm leading-relaxed"
            style={{ fontFamily: 'inherit' }}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-[var(--text-3)]">
              {(answers[currentQ] || '').length} characters
            </span>
            <span className="text-xs text-[var(--text-3)]">3 minutes per question</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={handlePrev} disabled={currentQ === 0}
            className="btn-secondary py-2.5 px-6 disabled:opacity-30">
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  i === currentQ
                    ? 'bg-[var(--accent)] text-white'
                    : answers[i]?.trim()
                      ? 'bg-[var(--green-glow)] text-[var(--green)]'
                      : 'bg-[var(--surface)] text-[var(--text-3)]'
                }`}>
                {i + 1}
              </button>
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button onClick={handleNext} className="btn-primary py-2.5 px-6 flex items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!allAnswered}
              className="btn-primary py-2.5 px-6 flex items-center gap-2">
              <Send className="w-4 h-4" /> Submit quiz
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
