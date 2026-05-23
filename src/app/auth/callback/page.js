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

    // With implicit flow, tokens arrive in the URL hash (#access_token=...)
    // The Supabase browser client detects them automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Small delay to ensure cookies are fully set
        setTimeout(() => router.push('/dashboard'), 100)
      }
    })

    // Check if there's already a session (e.g. from hash auto-detection)
    async function checkSession() {
      // Give the client a moment to process the hash
      await new Promise(r => setTimeout(r, 500))
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Callback error:', sessionError.message)
        setError(sessionError.message)
        setTimeout(() => router.push(`/auth/login?error=${encodeURIComponent(sessionError.message)}`), 2000)
        return
      }

      if (session) {
        router.push('/dashboard')
      } else if (!window.location.hash) {
        // No hash and no session — something went wrong
        setError('No authentication data received')
        setTimeout(() => router.push('/auth/login?error=no_auth_data'), 2000)
      }
      // If there's a hash but no session yet, the onAuthStateChange listener will handle it
    }

    checkSession()

    return () => subscription.unsubscribe()
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
