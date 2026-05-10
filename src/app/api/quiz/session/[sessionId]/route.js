import { createClient } from '../../../../../lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .select('id, questions, status, expires_at, quiz_score, final_score')
      .eq('id', params.sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 })
    }

    if (session.status === 'expired' || (session.expires_at && new Date(session.expires_at) < new Date())) {
      return NextResponse.json({ error: 'Quiz session expired' }, { status: 400 })
    }

    // Don't send keyPoints to the client
    const questions = (session.questions || []).map(q => ({
      problemTitle: q.problemTitle,
      questionType: q.questionType,
      question: q.question,
    }))

    // Mark as in_progress if pending
    if (session.status === 'pending') {
      await supabase.from('quiz_sessions')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', params.sessionId)
    }

    return NextResponse.json({
      sessionId: session.id,
      questions,
      status: session.status,
      timePerQuestion: 180,
    })
  } catch (err) {
    console.error('Quiz session error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
