'use client'

import { useState } from 'react'

export default function VerifyLeetcodeSection({ verifiedProfile }) {
  const [username, setUsername] = useState(verifiedProfile?.leetcode_username || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isVerified = verifiedProfile?.verified === true

  async function handleVerify(e) {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/auth/verify-leetcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send verification email.')
      } else {
        setMessage('Verification email sent! Check your inbox and click the link.')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-1">Your LeetCode profile</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        {isVerified
          ? 'Your profile is verified. Quiz mode unlocks in Phase 2.'
          : 'Verify your profile to prove ownership and unlock the quiz feature.'}
      </p>

      {isVerified ? (
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-green-800 font-medium">@{verifiedProfile.leetcode_username} verified</span>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-2">
          <input
            className="input text-xs"
            placeholder="Your LeetCode username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="btn-primary w-full text-xs py-2"
          >
            {loading ? 'Sending...' : 'Send verification email'}
          </button>
          {message && <p className="text-green-700 text-xs bg-green-50 px-2 py-1.5 rounded-lg">{message}</p>}
          {error && <p className="text-red-600 text-xs bg-red-50 px-2 py-1.5 rounded-lg">{error}</p>}
        </form>
      )}
    </div>
  )
}
