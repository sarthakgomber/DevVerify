// ============================================================
// DevVerify — GitHub Anomaly Detection & Scoring Engine
// ============================================================

const WEIGHTS = {
  ZERO_PRS:                -20,
  OWN_REPOS_ONLY:          -20,
  GENERIC_COMMIT_MSGS:     -15,
  HIGH_COMMITS_ZERO_ISSUES: -10,
  CLUSTERED_COMMITS:       -10,
  README_ONLY_STREAKS:     -20,
  LOW_CODE_DIVERSITY:      -5,
  EMPTY_REPOS_PADDING:     -10,
  MERGED_EXTERNAL_PRS:     +25,
  ISSUES_WITH_DISCUSSION:  +15,
  GOOD_REPO_QUALITY:       +10,
  ACCOUNT_AGE_BONUS:       +10,
  ACTIVE_CONTRIBUTOR:      +8,
  FORKED_AND_CONTRIBUTED:  +12,
}

const GENERIC_MSG_PATTERNS = [
  /^update$/i, /^fix$/i, /^add$/i, /^changes?$/i, /^commit$/i,
  /^initial commit$/i, /^first commit$/i, /^wip$/i, /^test$/i,
  /^\.$/i, /^-$/i, /^updated?$/i, /^fixed?$/i, /^added?$/i,
  /^minor$/i, /^patch$/i, /^modify$/i, /^edit$/i, /^temp$/i,
  /^save$/i, /^done$/i, /^stuff$/i, /^misc$/i, /^asdf$/i,
  /^readme$/i, /^update readme$/i, /^updated readme$/i,
]

function isGenericMessage(msg) {
  const clean = msg.trim().split('\n')[0].trim()
  if (clean.length <= 3) return true
  return GENERIC_MSG_PATTERNS.some(p => p.test(clean))
}

export function scoreGitHubProfile(profileData) {
  const { user, repos, events, commitData } = profileData

  let score = 100
  const signals = []

  // ── 1. Pull Request activity ──
  const prEvents = events.filter(e => e.type === 'PullRequestEvent')
  const prCreateEvents = prEvents.filter(e => e.payload?.action === 'opened')

  if (prEvents.length === 0) {
    score += WEIGHTS.ZERO_PRS
    signals.push({
      key: 'gh_zero_prs',
      label: 'No pull request activity',
      description: 'Zero pull requests found in recent activity — no evidence of collaborative coding',
      severity: 'high',
      deduction: WEIGHTS.ZERO_PRS,
    })
  }

  // ── 2. Commits only to own repos ──
  const pushEvents = events.filter(e => e.type === 'PushEvent')
  const uniqueRepoNames = [...new Set(pushEvents.map(e => e.repo?.name))]
  const ownRepoNames = repos.map(r => `${user.login}/${r.name}`)
  const externalPushes = uniqueRepoNames.filter(name => !ownRepoNames.includes(name))

  if (pushEvents.length > 5 && externalPushes.length === 0) {
    score += WEIGHTS.OWN_REPOS_ONLY
    signals.push({
      key: 'gh_own_repos_only',
      label: 'Commits only to own repositories',
      description: `All ${uniqueRepoNames.length} repos with commits are self-owned — no external contributions`,
      severity: 'high',
      deduction: WEIGHTS.OWN_REPOS_ONLY,
    })
  }

  // ── 3. Generic commit messages ──
  const allMessages = commitData.flatMap(r => r.commits.map(c => c.message))
  const genericCount = allMessages.filter(isGenericMessage).length
  const genericRate = allMessages.length > 0 ? (genericCount / allMessages.length) * 100 : 0

  if (genericRate > 60 && allMessages.length >= 10) {
    score += WEIGHTS.GENERIC_COMMIT_MSGS
    signals.push({
      key: 'gh_generic_commits',
      label: 'Mostly generic commit messages',
      description: `${genericRate.toFixed(0)}% of commit messages are generic ('update', 'fix', etc.) — low-effort pattern`,
      severity: 'medium',
      deduction: WEIGHTS.GENERIC_COMMIT_MSGS,
    })
  }

  // ── 4. High commits, zero issues ──
  const totalCommits = commitData.reduce((sum, r) => sum + r.commits.length, 0)
  const issueEvents = events.filter(e => e.type === 'IssuesEvent')

  if (totalCommits > 50 && issueEvents.length === 0 && user.public_repos > 5) {
    score += WEIGHTS.HIGH_COMMITS_ZERO_ISSUES
    signals.push({
      key: 'gh_no_issues',
      label: 'Many commits but zero issues opened',
      description: `${totalCommits} commits across repos but never opened an issue — atypical for active developers`,
      severity: 'medium',
      deduction: WEIGHTS.HIGH_COMMITS_ZERO_ISSUES,
    })
  }

  // ── 5. Clustered commits (all within same time window) ──
  let clusteredDayCount = 0
  for (const repoData of commitData) {
    const byDay = {}
    for (const c of repoData.commits) {
      if (!c.date) continue
      const day = c.date.slice(0, 10)
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(new Date(c.date).getTime())
    }

    for (const [, timestamps] of Object.entries(byDay)) {
      if (timestamps.length >= 5) {
        const sorted = timestamps.sort((a, b) => a - b)
        const span = (sorted[sorted.length - 1] - sorted[0]) / 60000 // in minutes
        if (span < 30) {
          clusteredDayCount++
        }
      }
    }
  }

  if (clusteredDayCount >= 3) {
    score += WEIGHTS.CLUSTERED_COMMITS
    signals.push({
      key: 'gh_clustered_commits',
      label: 'Time-clustered commit bursts',
      description: `${clusteredDayCount} days where 5+ commits happened within 30 minutes — possible automated or batch commits`,
      severity: 'medium',
      deduction: WEIGHTS.CLUSTERED_COMMITS,
    })
  }

  // ── 6. Empty/padding repos ──
  const emptyRepos = repos.filter(r => !r.fork && (r.size === 0 || r.size < 5))
  if (emptyRepos.length >= 5 && emptyRepos.length > repos.length * 0.4) {
    score += WEIGHTS.EMPTY_REPOS_PADDING
    signals.push({
      key: 'gh_empty_repos',
      label: 'Many empty/near-empty repositories',
      description: `${emptyRepos.length} of ${repos.length} repos are virtually empty — possible profile padding`,
      severity: 'medium',
      deduction: WEIGHTS.EMPTY_REPOS_PADDING,
    })
  }

  // ── POSITIVE SIGNALS ──

  // 7. Merged PRs in external repos
  const externalPRs = prEvents.filter(e => {
    const repoName = e.repo?.name
    return repoName && !ownRepoNames.includes(repoName)
  })
  if (externalPRs.length >= 2) {
    score += WEIGHTS.MERGED_EXTERNAL_PRS
    signals.push({
      key: 'gh_external_prs',
      label: 'Active external contributor',
      description: `${externalPRs.length} pull requests to external repositories — strong collaboration signal`,
      severity: 'positive',
      deduction: WEIGHTS.MERGED_EXTERNAL_PRS,
    })
  }

  // 8. Issues with discussion
  if (issueEvents.length >= 3) {
    score += WEIGHTS.ISSUES_WITH_DISCUSSION
    signals.push({
      key: 'gh_issues_discussion',
      label: 'Active issue participation',
      description: `${issueEvents.length} issue interactions — shows genuine engagement with community`,
      severity: 'positive',
      deduction: WEIGHTS.ISSUES_WITH_DISCUSSION,
    })
  }

  // 9. Good repo quality (has description, multiple languages, stars)
  const qualityRepos = repos.filter(r =>
    !r.fork && r.description && r.description.length > 10 && r.stargazers_count >= 1
  )
  if (qualityRepos.length >= 3) {
    score += WEIGHTS.GOOD_REPO_QUALITY
    signals.push({
      key: 'gh_good_repos',
      label: 'Well-maintained repositories',
      description: `${qualityRepos.length} repos have proper descriptions and engagement`,
      severity: 'positive',
      deduction: WEIGHTS.GOOD_REPO_QUALITY,
    })
  }

  // 10. Account age
  const accountAge = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  if (accountAge > 365) {
    score += WEIGHTS.ACCOUNT_AGE_BONUS
    signals.push({
      key: 'gh_account_age',
      label: 'Established GitHub account',
      description: `Account is ${Math.floor(accountAge / 365)} year(s) old`,
      severity: 'positive',
      deduction: WEIGHTS.ACCOUNT_AGE_BONUS,
    })
  }

  // 11. Forked and contributed
  const forkedRepos = repos.filter(r => r.fork)
  const forkedWithPushes = forkedRepos.filter(fr => {
    const fullName = `${user.login}/${fr.name}`
    return pushEvents.some(e => e.repo?.name === fullName)
  })
  if (forkedWithPushes.length >= 2) {
    score += WEIGHTS.FORKED_AND_CONTRIBUTED
    signals.push({
      key: 'gh_forked_contributed',
      label: 'Contributed to forked repositories',
      description: `${forkedWithPushes.length} forked repos have actual code contributions — genuine open-source behavior`,
      severity: 'positive',
      deduction: WEIGHTS.FORKED_AND_CONTRIBUTED,
    })
  }

  // ── Final clamp & verdict ──
  score = Math.max(0, Math.min(100, Math.round(score)))

  let verdict
  if (score >= 70)      verdict = 'genuine'
  else if (score >= 45) verdict = 'suspicious'
  else                  verdict = 'highly_suspicious'

  const summary = {
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    accountAge,
    totalCommitsAnalyzed: totalCommits,
    prActivityCount: prEvents.length,
    externalContributions: externalPushes.length,
    genericCommitRate: Math.round(genericRate),
    topLanguages: [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 8),
    starsReceived: repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
  }

  return {
    score,
    verdict,
    signals,
    summary,
    platform: 'github',
  }
}
