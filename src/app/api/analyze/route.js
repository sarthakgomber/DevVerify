import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { fetchFullProfile } from '../../../lib/leetcode'
import { scoreProfile } from '../../../lib/scorer'
import { fetchFullGitHubProfile } from '../../../lib/github'
import { scoreGitHubProfile } from '../../../lib/github-scorer'
import { fetchFullCFProfile } from '../../../lib/codeforces'
import { scoreCFProfile } from '../../../lib/codeforces-scorer'
import { rateLimit, getClientId } from '../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Rate limit: 10 analyses per minute per IP
    const clientId = getClientId(request)
    const rl = rateLimit(`analyze:${clientId}`, 10, 60000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${rl.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { leetcode, github, codeforces } = body

    // Support old format: { username } for backwards compat
    const lcUsername = (body.username || leetcode || '').trim().toLowerCase()
    const ghUsername = (github || '').trim()
    const cfHandle  = (codeforces || '').trim()

    if (!lcUsername && !ghUsername && !cfHandle) {
      return NextResponse.json({ error: 'At least one username is required' }, { status: 400 })
    }

    // Results per platform
    let lcResult = null, ghResult = null, cfResult = null
    let lcRaw = null, ghRaw = null, cfRaw = null
    const allSignals = []

    // ── LeetCode Analysis ──
    if (lcUsername) {
      try {
        const profileData = await fetchFullProfile(lcUsername)
        lcResult = scoreProfile(profileData)
        lcRaw = {
          summary: lcResult.summary,
          flaggedDays: lcResult.flaggedDays,
          calendarData: lcResult.calendarData,
          profile: {
            username: profileData.profile.username,
            avatar: profileData.profile.profile?.userAvatar,
            ranking: profileData.profile.profile?.ranking,
            realName: profileData.profile.profile?.realName,
          },
        }
        lcResult.signals.forEach(s => allSignals.push({ ...s, platform: 'leetcode' }))
      } catch (err) {
        if (err.message.includes('not found')) {
          return NextResponse.json({ error: 'LeetCode user not found' }, { status: 404 })
        }
        console.error('LeetCode error:', err.message)
        return NextResponse.json({ error: 'Failed to fetch LeetCode data: ' + err.message }, { status: 502 })
      }
    }

    // ── GitHub Analysis ──
    if (ghUsername) {
      try {
        const ghData = await fetchFullGitHubProfile(ghUsername)
        ghResult = scoreGitHubProfile(ghData)
        ghRaw = {
          summary: ghResult.summary,
          profile: {
            username: ghData.user.login,
            avatar: ghData.user.avatar_url,
            name: ghData.user.name,
            bio: ghData.user.bio,
            url: ghData.user.html_url,
          },
        }
        ghResult.signals.forEach(s => allSignals.push({ ...s, platform: 'github' }))
      } catch (err) {
        if (err.message.includes('not found')) {
          return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 })
        }
        console.error('GitHub error:', err.message)
      }
    }

    // ── Codeforces Analysis ──
    if (cfHandle) {
      try {
        const cfData = await fetchFullCFProfile(cfHandle)
        cfResult = scoreCFProfile(cfData)
        cfRaw = {
          summary: cfResult.summary,
          flaggedDays: cfResult.flaggedDays,
          profile: {
            handle: cfData.user.handle,
            avatar: cfData.user.titlePhoto,
            rank: cfData.user.rank,
            rating: cfData.user.rating,
            maxRating: cfData.user.maxRating,
          },
        }
        cfResult.signals.forEach(s => allSignals.push({ ...s, platform: 'codeforces' }))
      } catch (err) {
        if (err.message.includes('not found')) {
          return NextResponse.json({ error: 'Codeforces user not found' }, { status: 404 })
        }
        console.error('Codeforces error:', err.message)
      }
    }

    // ── Combined Score ──
    const scores = []
    if (lcResult) scores.push(lcResult.score)
    if (ghResult) scores.push(ghResult.score)
    if (cfResult) scores.push(cfResult.score)

    if (scores.length === 0) {
      return NextResponse.json({ error: 'Failed to analyze any platform' }, { status: 502 })
    }

    const combinedScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const verdict = combinedScore >= 70 ? 'genuine' : combinedScore >= 45 ? 'suspicious' : 'highly_suspicious'

    // ── Save to database ──
    // Use admin client (bypasses RLS) for inserts, fall back to regular client
    const adminSupabase = createAdminClient()
    const regularSupabase = createClient()
    const supabase = adminSupabase || regularSupabase

    let userId = null
    try {
      const { data: { session } } = await regularSupabase.auth.getSession()
      userId = session?.user?.id || null
    } catch {}

    // Build insert data — try new schema first, fall back to old schema
    const rawData = { leetcode: lcRaw, github: ghRaw, codeforces: cfRaw }
    // Also store in old format for backwards compat
    if (lcRaw) {
      rawData.summary = lcRaw.summary
      rawData.flaggedDays = lcRaw.flaggedDays
      rawData.calendarData = lcRaw.calendarData
      rawData.profile = lcRaw.profile
    }

    let analysis = null
    let dbError = null

    // Try new schema (with all platform columns)
    const newSchemaData = {
      run_by: userId,
      leetcode_username: lcUsername || null,
      github_username: ghUsername || null,
      codeforces_handle: cfHandle || null,
      leetcode_score: lcResult?.score ?? null,
      github_score: ghResult?.score ?? null,
      codeforces_score: cfResult?.score ?? null,
      score: combinedScore,
      verdict,
      signals: allSignals,
      raw_data: rawData,
    }

    const result1 = await supabase
      .from('analyses')
      .insert(newSchemaData)
      .select('report_id')
      .single()

    if (result1.error) {
      console.error('New schema insert failed:', result1.error.message)

      // Fall back to old schema (only leetcode_username, no platform-specific columns)
      const oldSchemaData = {
        run_by: userId,
        leetcode_username: lcUsername || 'unknown',
        score: combinedScore,
        verdict,
        signals: allSignals,
        raw_data: rawData,
      }

      const result2 = await supabase
        .from('analyses')
        .insert(oldSchemaData)
        .select('report_id')
        .single()

      if (result2.error) {
        console.error('Old schema insert also failed:', result2.error.message)
        dbError = result2.error

        // Return results even without saving — generate a temporary report ID
        return NextResponse.json({
          success: true,
          reportId: null,
          score: combinedScore,
          verdict,
          platforms: {
            leetcode: lcResult ? { score: lcResult.score, verdict: lcResult.verdict } : null,
            github: ghResult ? { score: ghResult.score, verdict: ghResult.verdict } : null,
            codeforces: cfResult ? { score: cfResult.score, verdict: cfResult.verdict } : null,
          },
          // Include full results inline when DB save fails
          signals: allSignals,
          raw_data: rawData,
          _dbError: 'Could not save report. Please run the latest supabase-schema.sql in your Supabase SQL Editor.',
        })
      }

      analysis = result2.data
    } else {
      analysis = result1.data
    }

    return NextResponse.json({
      success: true,
      reportId: analysis.report_id,
      score: combinedScore,
      verdict,
      platforms: {
        leetcode: lcResult ? { score: lcResult.score, verdict: lcResult.verdict } : null,
        github: ghResult ? { score: ghResult.score, verdict: ghResult.verdict } : null,
        codeforces: cfResult ? { score: cfResult.score, verdict: cfResult.verdict } : null,
      },
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}