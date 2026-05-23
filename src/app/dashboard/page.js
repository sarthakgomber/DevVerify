import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard — DevVerify',
  description: 'Manage your profile analyses and verification status',
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, created_at, leetcode_username, github_username, codeforces_handle, score, verdict, report_id')
    .eq('run_by', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <DashboardClient
      user={user}
      analyses={analyses || []}
    />
  )
}