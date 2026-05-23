import { createClient } from '../../../lib/supabase/server'
import { getVerdictLabel, getVerdictColor, getSeverityColor } from '../../../lib/scorer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReportClient from './ReportClient'

export async function generateMetadata({ params }) {
  return {
    title: `DevVerify Report — ${params.id}`,
    description: 'Developer code DNA credibility report by DevVerify',
  }
}

export default async function ReportPage({ params }) {
  const supabase = createClient()

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('report_id', params.id)
    .single()

  if (error || !analysis) notFound()

  return <ReportClient analysis={analysis} />
}