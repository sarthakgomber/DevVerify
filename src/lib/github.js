// ============================================================
// DevVerify — GitHub API Client
// Uses GitHub REST API v3 (unauthenticated: 60 req/hr, token: 5000 req/hr)
// ============================================================

const GITHUB_API = 'https://api.github.com'

function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DevVerify/1.0',
  }
  // Use token if available for higher rate limits
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // cache for 5 min
  })

  if (res.status === 404) {
    throw new Error('GitHub user not found')
  }
  if (res.status === 403) {
    throw new Error('GitHub API rate limit exceeded. Try again later.')
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Fetch basic user profile
 */
export async function fetchGitHubUser(username) {
  return ghFetch(`/users/${username}`)
}

/**
 * Fetch user's public repositories (up to 100, sorted by updated)
 */
export async function fetchGitHubRepos(username) {
  return ghFetch(`/users/${username}/repos?per_page=100&sort=updated&type=owner`)
}

/**
 * Fetch recent public events (up to 100)
 */
export async function fetchGitHubEvents(username) {
  try {
    return await ghFetch(`/users/${username}/events/public?per_page=100`)
  } catch {
    return []
  }
}

/**
 * Fetch recent commits for a specific repo (up to 30)
 */
export async function fetchRepoCommits(owner, repo, count = 30) {
  try {
    return await ghFetch(`/repos/${owner}/${repo}/commits?per_page=${count}`)
  } catch {
    return []
  }
}

/**
 * Fetch full GitHub profile data for analysis
 */
export async function fetchFullGitHubProfile(username) {
  const [user, repos, events] = await Promise.all([
    fetchGitHubUser(username),
    fetchGitHubRepos(username),
    fetchGitHubEvents(username),
  ])

  // Get commit messages from top 5 most-committed repos
  const topRepos = repos
    .filter(r => !r.fork)
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5)

  const commitData = await Promise.all(
    topRepos.map(async (repo) => {
      const commits = await fetchRepoCommits(username, repo.name, 30)
      return {
        repo: repo.name,
        commits: commits.map(c => ({
          sha: c.sha,
          message: c.commit?.message || '',
          date: c.commit?.author?.date || c.commit?.committer?.date,
          author: c.commit?.author?.name,
        })),
      }
    })
  )

  return {
    user,
    repos,
    events,
    commitData,
  }
}
