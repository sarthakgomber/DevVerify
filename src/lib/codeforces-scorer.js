// ============================================================
// DevVerify — Codeforces Anomaly Detection & Scoring Engine
// ============================================================

const WEIGHTS = {
  BURST_SOLVES: -20, ZERO_WRONG: -20, LOW_WRONG: -10,
  FAST_ACCOUNT: -25, DIFF_JUMP: -15, NO_CONTESTS: -8,
  RATING_GROWTH: +15, CONTESTS: +10, DIVERSE_TAGS: +8,
  HEALTHY_WA: +5, ACCOUNT_AGE: +10,
}

function groupByDay(subs) {
  const days = {}
  for (const s of subs) {
    if (s.verdict !== 'OK') continue
    const day = new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10)
    if (!days[day]) days[day] = []
    days[day].push(s)
  }
  return days
}

export function scoreCFProfile({ user, submissions, ratingHistory }) {
  let score = 100
  const signals = []
  const acDays = groupByDay(submissions)
  let burstDays = 0
  const flaggedDays = []

  for (const [day, subs] of Object.entries(acDays)) {
    const unique = new Set(subs.map(s => `${s.problem?.contestId}-${s.problem?.index}`)).size
    if (unique >= 10) { burstDays++; flaggedDays.push({ date: day, count: unique, severity: 'high' }) }
    else if (unique >= 6) { flaggedDays.push({ date: day, count: unique, severity: 'medium' }) }
  }

  if (burstDays >= 2) {
    const d = Math.max(burstDays * -8, WEIGHTS.BURST_SOLVES)
    score += d
    signals.push({ key: 'cf_burst', label: 'Burst solving days', description: `${burstDays} days with 10+ problems — statistically unusual`, severity: 'high', deduction: d })
  }

  const totalSubs = submissions.length
  const acSubs = submissions.filter(s => s.verdict === 'OK').length
  const wrongRate = totalSubs > 0 ? ((totalSubs - acSubs) / totalSubs) * 100 : 0

  if (totalSubs > 20 && wrongRate < 3) {
    score += WEIGHTS.ZERO_WRONG
    signals.push({ key: 'cf_zero_wrong', label: 'Near-zero wrong attempts', description: `Only ${wrongRate.toFixed(1)}% wrong — statistically improbable`, severity: 'high', deduction: WEIGHTS.ZERO_WRONG })
  } else if (totalSubs > 20 && wrongRate < 8) {
    score += WEIGHTS.LOW_WRONG
    signals.push({ key: 'cf_low_wrong', label: 'Very low wrong rate', description: `${wrongRate.toFixed(1)}% failed — unusually accurate`, severity: 'medium', deduction: WEIGHTS.LOW_WRONG })
  } else if (wrongRate >= 15 && wrongRate <= 45) {
    score += WEIGHTS.HEALTHY_WA
    signals.push({ key: 'cf_healthy_wa', label: 'Healthy attempt rate', description: `${wrongRate.toFixed(1)}% wrong — typical of genuine learning`, severity: 'positive', deduction: WEIGHTS.HEALTHY_WA })
  }

  const ageDays = user.registrationTimeSeconds ? Math.floor((Date.now() / 1000 - user.registrationTimeSeconds) / 86400) : 365
  const uniqueAC = new Set(submissions.filter(s => s.verdict === 'OK').map(s => `${s.problem?.contestId}-${s.problem?.index}`)).size

  if (ageDays < 30 && uniqueAC >= 50) {
    score += WEIGHTS.FAST_ACCOUNT
    signals.push({ key: 'cf_new_account', label: 'New account, many solves', description: `${ageDays} days old, ${uniqueAC} solved`, severity: 'high', deduction: WEIGHTS.FAST_ACCOUNT })
  } else if (ageDays > 365) {
    score += WEIGHTS.ACCOUNT_AGE
    signals.push({ key: 'cf_age', label: 'Established account', description: `${Math.floor(ageDays / 365)} year(s) old`, severity: 'positive', deduction: WEIGHTS.ACCOUNT_AGE })
  }

  const ratings = submissions.filter(s => s.verdict === 'OK' && s.problem?.rating).map(s => s.problem.rating)
  if (ratings.length > 10) {
    const easy = ratings.filter(r => r <= 1200).length
    const hard = ratings.filter(r => r >= 2000).length
    if (hard > easy && easy < 5) {
      score += WEIGHTS.DIFF_JUMP
      signals.push({ key: 'cf_diff_jump', label: 'Unusual difficulty distribution', description: `${hard} hard (2000+) but only ${easy} easy (≤1200)`, severity: 'high', deduction: WEIGHTS.DIFF_JUMP })
    }
  }

  if (ratingHistory.length === 0 && uniqueAC > 30) {
    score += WEIGHTS.NO_CONTESTS
    signals.push({ key: 'cf_no_contests', label: 'No contest participation', description: `${uniqueAC} solved but never competed`, severity: 'medium', deduction: WEIGHTS.NO_CONTESTS })
  } else if (ratingHistory.length >= 10) {
    score += WEIGHTS.CONTESTS
    signals.push({ key: 'cf_contests', label: 'Regular contestant', description: `${ratingHistory.length} rated contests`, severity: 'positive', deduction: WEIGHTS.CONTESTS })
  }

  if (ratingHistory.length >= 5) {
    const first = ratingHistory[0].newRating, last = ratingHistory[ratingHistory.length - 1].newRating
    if (last > first + 200) {
      score += WEIGHTS.RATING_GROWTH
      signals.push({ key: 'cf_rating_growth', label: 'Genuine rating progression', description: `Rating grew ${first} → ${last}`, severity: 'positive', deduction: WEIGHTS.RATING_GROWTH })
    }
  }

  const tags = new Set()
  submissions.filter(s => s.verdict === 'OK').forEach(s => (s.problem?.tags || []).forEach(t => tags.add(t)))
  if (tags.size >= 10) {
    score += WEIGHTS.DIVERSE_TAGS
    signals.push({ key: 'cf_tags', label: 'Diverse problem categories', description: `${tags.size} different tags`, severity: 'positive', deduction: WEIGHTS.DIVERSE_TAGS })
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const verdict = score >= 70 ? 'genuine' : score >= 45 ? 'suspicious' : 'highly_suspicious'

  return {
    score, verdict, signals, platform: 'codeforces',
    flaggedDays: flaggedDays.sort((a, b) => b.count - a.count).slice(0, 10),
    summary: {
      uniqueAC, totalSubmissions: totalSubs, wrongRate: Math.round(wrongRate * 10) / 10,
      contestsParticipated: ratingHistory.length, currentRating: user.rating || 0,
      maxRating: user.maxRating || 0, rank: user.rank || 'unrated',
      accountAge: ageDays, tagsCount: tags.size, topTags: [...tags].slice(0, 10),
    },
  }
}
