// ============================================================
// DevVerify — Anomaly Detection & Scoring Engine
// ============================================================

const WEIGHTS = {
  BURST_DAY_PENALTY:        -8,
  BURST_DAY_MODERATE:       -4,
  ZERO_WRONG_ATTEMPTS:      -20,
  LOW_WRONG_ATTEMPTS:       -10,
  FAST_ACCOUNT_MANY_SOLVED: -25,
  FAST_ACCOUNT_SOME_SOLVED: -15,
  DIFFICULTY_SPIKE:         -15,
  HIGH_AC_RATE:             -10,
  CONSISTENT_LANGUAGE:      +8,
  ACCOUNT_AGE_BONUS:        +10,
  HEALTHY_WA_RATE:          +5,
  GOOD_STREAK:              +5,
}

// Parse calendar into { 'YYYY-MM-DD': totalSubmissionCount }
function parseDays(calendar) {
  const days = {}
  for (const [ts, count] of Object.entries(calendar)) {
    const date = new Date(parseInt(ts) * 1000).toISOString().slice(0, 10)
    days[date] = (days[date] || 0) + count
  }
  return days
}

// Count unique AC problems per day from recent submissions
function parseUniqueSolvedPerDay(recentSubmissions) {
  const days = {}
  const seen = new Set()
  for (const sub of recentSubmissions) {
    if (!sub.timestamp || !sub.titleSlug) continue
    const date = new Date(parseInt(sub.timestamp) * 1000).toISOString().slice(0, 10)
    const key = `${date}:${sub.titleSlug}`
    if (!seen.has(key)) {
      seen.add(key)
      days[date] = (days[date] || 0) + 1
    }
  }
  return days
}

function getAccountAgeDays(createdAt) {
  if (!createdAt) return 365
  const created = new Date(parseInt(createdAt) * 1000)
  return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
}

export function scoreProfile(profileData) {
  const { profile, recentSubmissions, calendar } = profileData

  let score = 100
  const signals = []
  const flaggedDays = []

  // ── 1. Parse submission calendar (total submissions per day)
  const submissionDays = parseDays(calendar)

  // ── 2. Parse unique AC problems per day from recent submissions
  const uniqueSolvedDays = parseUniqueSolvedPerDay(recentSubmissions || [])

  // ── 3. Burst day detection using TOTAL submissions from calendar
  //       but also show unique solved count where available
  let extremeBurstDays = 0
  let moderateBurstDays = 0

  for (const [date, totalSubmissions] of Object.entries(submissionDays)) {
    const uniqueSolved = uniqueSolvedDays[date] || null

    // Estimate unique problems: if we have recent data use it,
    // otherwise estimate as ~60% of total submissions (avg attempts per problem)
    const estimatedUnique = uniqueSolved !== null
      ? uniqueSolved
      : Math.round(totalSubmissions * 0.6)

    if (estimatedUnique >= 10) {
      extremeBurstDays++
      flaggedDays.push({
        date,
        count: estimatedUnique,
        totalSubmissions,
        uniqueSolved,
        severity: 'high'
      })
    } else if (estimatedUnique >= 6) {
      moderateBurstDays++
      flaggedDays.push({
        date,
        count: estimatedUnique,
        totalSubmissions,
        uniqueSolved,
        severity: 'medium'
      })
    }
  }

  if (extremeBurstDays > 0) {
    const deduction = Math.max(extremeBurstDays * WEIGHTS.BURST_DAY_PENALTY, -32)
    score += deduction
    signals.push({
      key: 'burst_days_extreme',
      label: 'Extreme burst days',
      description: `${extremeBurstDays} day(s) with 10+ problems solved — statistically abnormal`,
      severity: 'high',
      value: extremeBurstDays,
      deduction,
    })
  }

  if (moderateBurstDays > 0) {
    const deduction = Math.max(moderateBurstDays * WEIGHTS.BURST_DAY_MODERATE, -16)
    score += deduction
    signals.push({
      key: 'burst_days_moderate',
      label: 'High-volume days',
      description: `${moderateBurstDays} day(s) with 6–9 problems solved`,
      severity: 'medium',
      value: moderateBurstDays,
      deduction,
    })
  }

  // ── 4. Wrong attempt rate
  const stats = profile.submitStats
  const totalAC  = stats?.acSubmissionNum?.find(s => s.difficulty === 'All')
  const totalAll = stats?.totalSubmissionNum?.find(s => s.difficulty === 'All')

  let wrongAttemptRate = null
  if (totalAC && totalAll && totalAll.submissions > 0) {
    const acSubmissions  = totalAC.submissions
    const allSubmissions = totalAll.submissions
    wrongAttemptRate = ((allSubmissions - acSubmissions) / allSubmissions) * 100

    if (wrongAttemptRate < 3) {
      score += WEIGHTS.ZERO_WRONG_ATTEMPTS
      signals.push({
        key: 'zero_wrong_attempts',
        label: 'Near-zero wrong attempts',
        description: `Only ${wrongAttemptRate.toFixed(1)}% of submissions are wrong — statistically abnormal`,
        severity: 'high',
        value: wrongAttemptRate,
        deduction: WEIGHTS.ZERO_WRONG_ATTEMPTS,
      })
    } else if (wrongAttemptRate < 8) {
      score += WEIGHTS.LOW_WRONG_ATTEMPTS
      signals.push({
        key: 'low_wrong_attempts',
        label: 'Very low wrong attempt rate',
        description: `${wrongAttemptRate.toFixed(1)}% wrong attempts — unusually low`,
        severity: 'medium',
        value: wrongAttemptRate,
        deduction: WEIGHTS.LOW_WRONG_ATTEMPTS,
      })
    } else if (wrongAttemptRate >= 15 && wrongAttemptRate <= 40) {
      score += WEIGHTS.HEALTHY_WA_RATE
      signals.push({
        key: 'healthy_wa_rate',
        label: 'Healthy attempt rate',
        description: `${wrongAttemptRate.toFixed(1)}% wrong answers — typical of genuine learning`,
        severity: 'positive',
        value: wrongAttemptRate,
        deduction: WEIGHTS.HEALTHY_WA_RATE,
      })
    }
  }

  // ── 5. Account age vs problems solved
  const ageDays    = getAccountAgeDays(profile.createdAt)
  const totalSolved = totalAC?.count || 0

  if (ageDays < 30 && totalSolved >= 50) {
    score += WEIGHTS.FAST_ACCOUNT_MANY_SOLVED
    signals.push({
      key: 'new_account_many_solved',
      label: 'New account, massive solve count',
      description: `Account is ${ageDays} days old but has ${totalSolved} problems solved`,
      severity: 'high',
      value: { ageDays, totalSolved },
      deduction: WEIGHTS.FAST_ACCOUNT_MANY_SOLVED,
    })
  } else if (ageDays < 30 && totalSolved >= 20) {
    score += WEIGHTS.FAST_ACCOUNT_SOME_SOLVED
    signals.push({
      key: 'new_account_some_solved',
      label: 'New account with high solve count',
      description: `Account is ${ageDays} days old with ${totalSolved} problems solved`,
      severity: 'medium',
      value: { ageDays, totalSolved },
      deduction: WEIGHTS.FAST_ACCOUNT_SOME_SOLVED,
    })
  } else if (ageDays > 365) {
    score += WEIGHTS.ACCOUNT_AGE_BONUS
    signals.push({
      key: 'account_age_bonus',
      label: 'Established account',
      description: `Account is ${Math.floor(ageDays / 365)} year(s) old`,
      severity: 'positive',
      value: ageDays,
      deduction: WEIGHTS.ACCOUNT_AGE_BONUS,
    })
  }

  // ── 6. Difficulty spike
  const easySolved = stats?.acSubmissionNum?.find(s => s.difficulty === 'Easy')?.count  || 0
  const medSolved  = stats?.acSubmissionNum?.find(s => s.difficulty === 'Medium')?.count || 0
  const hardSolved = stats?.acSubmissionNum?.find(s => s.difficulty === 'Hard')?.count   || 0

  if (hardSolved > 0 && hardSolved > easySolved && easySolved < 10) {
    score += WEIGHTS.DIFFICULTY_SPIKE
    signals.push({
      key: 'difficulty_spike',
      label: 'Unusual difficulty distribution',
      description: `${hardSolved} Hard solved but only ${easySolved} Easy — genuine learners build foundations first`,
      severity: 'high',
      value: { easySolved, medSolved, hardSolved },
      deduction: WEIGHTS.DIFFICULTY_SPIKE,
    })
  }

  // ── 7. AC rate
  if (totalAC && totalAll && totalAll.count > 10) {
    const acRate = (totalAC.count / totalAll.count) * 100
    if (acRate > 85) {
      score += WEIGHTS.HIGH_AC_RATE
      signals.push({
        key: 'high_ac_rate',
        label: 'Suspiciously high acceptance rate',
        description: `${acRate.toFixed(0)}% of attempted problems were accepted — very unusual`,
        severity: 'medium',
        value: acRate,
        deduction: WEIGHTS.HIGH_AC_RATE,
      })
    }
  }

  // ── 8. Language consistency (positive)
  const langs = [...new Set((recentSubmissions || []).map(s => s.lang).filter(Boolean))]
  if (langs.length <= 2 && langs.length > 0) {
    score += WEIGHTS.CONSISTENT_LANGUAGE
    signals.push({
      key: 'consistent_language',
      label: 'Consistent language use',
      description: `Uses ${langs.join(', ')} consistently — typical of a genuine developer`,
      severity: 'positive',
      value: langs,
      deduction: WEIGHTS.CONSISTENT_LANGUAGE,
    })
  }

  // ── 9. Streak (positive)
  const streak = profile.userCalendar?.streak || 0
  if (streak >= 30) {
    score += WEIGHTS.GOOD_STREAK
    signals.push({
      key: 'good_streak',
      label: 'Active streak',
      description: `${streak}-day streak shows consistent practice`,
      severity: 'positive',
      value: streak,
      deduction: WEIGHTS.GOOD_STREAK,
    })
  }

  // ── Final clamp & verdict
  score = Math.max(0, Math.min(100, Math.round(score)))

  let verdict
  if (score >= 70)      verdict = 'genuine'
  else if (score >= 45) verdict = 'suspicious'
  else                  verdict = 'highly_suspicious'

  const totalActiveDays = profile.userCalendar?.totalActiveDays || 0
  const summary = {
    totalSolved,
    easySolved,
    medSolved,
    hardSolved,
    streak,
    totalActiveDays,
    ageDays,
    wrongAttemptRate: wrongAttemptRate ? Math.round(wrongAttemptRate * 10) / 10 : null,
    recentLanguages: langs,
  }

  return {
    score,
    verdict,
    signals,
    flaggedDays: flaggedDays.sort((a, b) => b.count - a.count).slice(0, 10),
    summary,
    calendarData: submissionDays,
  }
}

export function getVerdictLabel(verdict) {
  const map = {
    genuine:           'Looks Genuine',
    suspicious:        'Suspicious Profile',
    highly_suspicious: 'Highly Suspicious',
  }
  return map[verdict] || verdict
}

export function getVerdictColor(verdict) {
  const map = {
    genuine:           { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', ring: '#16a34a' },
    suspicious:        { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', ring: '#d97706' },
    highly_suspicious: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   ring: '#dc2626' },
  }
  return map[verdict] || map.suspicious
}

export function getSeverityColor(severity) {
  const map = {
    high:     { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'   },
    medium:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    positive: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  }
  return map[severity] || map.medium
}