import { createClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_token`)
    }

    const supabase = createClient()

    const { data: record, error } = await supabase
      .from('verified_profiles')
      .select('*')
      .eq('verification_token', token)
      .single()

    if (error || !record) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_not_found`)
    }

    if (new Date(record.token_expires_at) < new Date()) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=token_expired`)
    }

    const { error: updateError } = await supabase
      .from('verified_profiles')
      .update({ verified: true, verification_token: null, token_expires_at: null })
      .eq('id', record.id)

    if (updateError) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=db_error`)
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?verified=true&username=${record.leetcode_username}`
    )
  } catch (err) {
    console.error('Confirm error:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=server_error`)
  }
}
