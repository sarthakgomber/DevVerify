'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyzeForm() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = username.trim()
    if (!clean) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      router.push(`/report/${data.reportId}`)
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        className="input flex-1"
        placeholder="Enter LeetCode username (e.g. neal_wu)"
        value={username}
        onChange={e => setUsername(e.target.value)}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !username.trim()}
        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing...
          </>
        ) : 'Analyze →'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1 sm:col-span-2">{error}</p>}
    </form>
  )
}
