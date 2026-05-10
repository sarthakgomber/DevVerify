import { createClient } from '../../../../lib/supabase/server'
import { evaluateAnswer } from '../../../../lib/gemini'
import { rateLimit, getClientId } from '../../../../lib/rate-limit'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const clientId = getClientId(request)
    const rl = rateLimit(`evaluate:${clientId}`, 10, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limited. Try again in ${rl.resetIn}s` }, { status: 429 })
    }

    const { sessionId, answers } = await request.json()

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'sessionId and answers array required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch quiz session
    const { data: session, error: fetchErr } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Quiz already completed' }, { status: 400 })
    }

    // Check expiry
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      await supabase.from('quiz_sessions').update({ status: 'expired' }).eq('id', sessionId)
      return NextResponse.json({ error: 'Quiz session expired' }, { status: 400 })
    }

    const questions = session.questions || []

    // Evaluate each answer via Gemini
    const evaluations = []
    for (let i = 0; i < questions.length; i++) {
      const answer = answers[i] || ''
      if (!answer.trim()) {
        evaluations.push({
          score: 0, correctness: 0, depth: 0, clarity: 0,
          feedback: 'No answer provided', isLikelyGenuine: false,
        })
        continue
      }

      const evaluation = await evaluateAnswer(questions[i], answer)
      evaluations.push(evaluation)
    }

    // Calculate quiz score (average of all evaluations)
    const quizScore = evaluations.length > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.score || 0), 0) / evaluations.length)
      : 0

    // Calculate final combined score
    const { data: analysis } = await supabase
      .from('analyses')
      .select('score')
      .eq('id', session.analysis_id)
      .single()

    const profileScore = analysis?.score || 50
    const finalScore = Math.round(profileScore * 0.6 + quizScore * 0.4)

    // Update quiz session
    const { error: updateErr } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'completed',
        answers,
        evaluations,
        quiz_score: quizScore,
        final_score: finalScore,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateErr) {
      console.error('Quiz update error:', updateErr)
    }

    return NextResponse.json({
      success: true,
      quizScore,
      profileScore,
      finalScore,
      formula: 'finalScore = profileScore × 0.6 + quizScore × 0.4',
      evaluations: evaluations.map(e => ({
        score: e.score,
        correctness: e.correctness,
        depth: e.depth,
        clarity: e.clarity,
        feedback: e.feedback,
        isLikelyGenuine: e.isLikelyGenuine,
      })),
    })
  } catch (err) {
    console.error('Quiz evaluate error:', err)
    return NextResponse.json({ error: 'Failed to evaluate answers' }, { status: 500 })
  }
}
