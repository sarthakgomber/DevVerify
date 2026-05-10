// Supabase Admin Client — uses service role key to bypass RLS
// Only use this server-side in API routes for writes
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  adminClient = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return adminClient
}
