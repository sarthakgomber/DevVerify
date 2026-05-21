'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { Shield } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    // The browser client has access to the PKCE code verifier it stored
    // It will automatically detect the ?code= param and exchange it
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })

    // Also try to get the session directly (handles the code exchange)
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Callback error:', error.message)
        setError(error.message)
        setTimeout(() => router.push(`/auth/login?error=${encodeURIComponent(error.message)}`), 2000)
        return
      }
      if (data?.session) {
        router.push('/dashboard')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
          <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        {error ? (
          <>
            <h2 className="text-lg font-semibold text-[var(--red)] mb-2">Authentication failed</h2>
            <p className="text-sm text-[var(--text-2)]">{error}</p>
            <p className="text-xs text-[var(--text-3)] mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Completing sign in...</h2>
            <p className="text-sm text-[var(--text-2)]">Please wait while we verify your identity.</p>
          </>
        )}
      </div>
    </div>
  )
}
