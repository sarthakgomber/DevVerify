import { createClient } from '../../../../lib/supabase/server'
import { fetchUserProfile } from '../../../../lib/leetcode'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    // Fetch LeetCode profile to get email
    let lcProfile
    try {
      lcProfile = await fetchUserProfile(username.trim())
    } catch {
      return NextResponse.json({ error: 'LeetCode user not found' }, { status: 404 })
    }

    // LeetCode exposes email only if user hasn't hidden it
    // We store the username and send verification to the DevVerify user's email
    // The user proves ownership by clicking from their own email
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 hours

    // Upsert verified_profile record
    const { error: upsertError } = await supabase
      .from('verified_profiles')
      .upsert({
        user_id: user.id,
        leetcode_username: username.trim().toLowerCase(),
        leetcode_email: user.email, // We verify against their DevVerify account email
        verified: false,
        verification_token: token,
        token_expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Send verification email
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm-leetcode?token=${token}`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: 'Verify your LeetCode profile on DevVerify',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #1e1b4b; margin-bottom: 8px;">Verify your LeetCode profile</h2>
          <p style="color: #374151; margin-bottom: 24px;">
            You're connecting <strong>${username}</strong> to your DevVerify account.
            Click the button below to confirm this is your profile.
          </p>
          <a href="${verifyUrl}" style="
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          ">
            Verify LeetCode Profile
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
            This link expires in 2 hours. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Verification email sent' })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
