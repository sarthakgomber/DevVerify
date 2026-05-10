import { createClient } from '../../../../lib/supabase/server'
import { generateQuizQuestions } from '../../../../lib/gemini'
import { rateLimit, getClientId } from '../../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Rate limit: 5 quiz generations per minute
    const clientId = getClientId(request)
    const rl = rateLimit(`quiz:${clientId}`, 5, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limited. Try again in ${rl.resetIn}s` }, { status: 429 })
    }

    const { analysisId, reportId } = await request.json()

    if (!analysisId && !reportId) {
      return NextResponse.json({ error: 'analysisId or reportId required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch the analysis
    let query = supabase.from('analyses').select('*')
    if (analysisId) query = query.eq('id', analysisId)
    else query = query.eq('report_id', reportId)

    const { data: analysis, error: fetchErr } = await query.single()
    if (fetchErr || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Extract problems to quiz on (from LeetCode flagged days or recent submissions)
    const rawData = analysis.raw_data || {}
    const lcData = rawData.leetcode || rawData // backwards compat
    const flaggedDays = lcData.flaggedDays || []
    const summary = lcData.summary || rawData.summary || {}

    // Build problem list from signals and raw data
    let problems = []

    // Try to get specific problem titles from recent submissions stored in raw_data
    if (rawData.recentSubmissions) {
      problems = rawData.recentSubmissions.slice(0, 5).map(s => ({
        title: s.title,
        titleSlug: s.titleSlug,
        difficulty: 'Unknown',
      }))
    }

    // If no specific problems, generate questions based on profile patterns
    if (problems.length === 0) {
      // Create synthetic problem references from the analysis
      const totalSolved = summary.totalSolved || 0
      const hardSolved = summary.hardSolved || 0
      const medSolved = summary.medSolved || 0

      // Generate questions about common LC patterns based on what they claim to know
      const commonProblems = [
        { title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy' },
        { title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium' },
        { title: 'Merge Intervals', titleSlug: 'merge-intervals', difficulty: 'Medium' },
        { title: 'Binary Tree Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium' },
        { title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', difficulty: 'Hard' },
      ]

      // Pick problems matching their claimed difficulty spread
      if (hardSolved > 0) {
        problems.push(commonProblems[4]) // Hard
        problems.push(commonProblems[2]) // Medium
        problems.push(commonProblems[1]) // Medium
      } else if (medSolved > 0) {
        problems.push(commonProblems[1])
        problems.push(commonProblems[2])
        problems.push(commonProblems[3])
      } else {
        problems.push(commonProblems[0])
        problems.push(commonProblems[1])
        problems.push(commonProblems[2])
      }
    }

    // Limit to 3 problems
    problems = problems.slice(0, 3)

    // Generate questions via Gemini
    const questions = await generateQuizQuestions(problems)

    // Create quiz session in DB
    const { data: session, error: dbErr } = await supabase
      .from('quiz_sessions')
      .insert({
        analysis_id: analysis.id,
        user_id: null, // anonymous for now
        status: 'pending',
        questions,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      })
      .select('id, questions, expires_at')
      .single()

    if (dbErr) {
      console.error('Quiz session DB error:', dbErr)
      return NextResponse.json({ error: 'Failed to create quiz session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      questions: questions.map(q => ({
        problemTitle: q.problemTitle,
        questionType: q.questionType,
        question: q.question,
      })), // Don't send keyPoints to client
      totalQuestions: questions.length,
      timePerQuestion: 180,
      expiresAt: session.expires_at,
    })
  } catch (err) {
    console.error('Quiz generate error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate quiz' }, { status: 500 })
  }
}
