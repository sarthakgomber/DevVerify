// ============================================================
// DevVerify — Codeforces API Client
// Fully open API, no key required
// ============================================================

const CF_API = 'https://codeforces.com/api'

async function cfFetch(path) {
  const res = await fetch(`${CF_API}${path}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const text = await res.text()
    if (text.includes('not found') || text.includes('no such handle')) {
      throw new Error('Codeforces user not found')
    }
    throw new Error(`Codeforces API error: ${res.status}`)
  }

  const json = await res.json()
  if (json.status !== 'OK') {
    if (json.comment?.includes('not found')) {
      throw new Error('Codeforces user not found')
    }
    throw new Error(`Codeforces error: ${json.comment || 'Unknown'}`)
  }

  return json.result
}

/**
 * Fetch user info
 */
export async function fetchCFUser(handle) {
  const users = await cfFetch(`/user.info?handles=${handle}`)
  return users[0]
}

/**
 * Fetch user submissions (up to 1000)
 */
export async function fetchCFSubmissions(handle, count = 1000) {
  return cfFetch(`/user.status?handle=${handle}&from=1&count=${count}`)
}

/**
 * Fetch user rating history
 */
export async function fetchCFRatingHistory(handle) {
  try {
    return await cfFetch(`/user.rating?handle=${handle}`)
  } catch {
    return []
  }
}

/**
 * Fetch full Codeforces profile for analysis
 */
export async function fetchFullCFProfile(handle) {
  const [user, submissions, ratingHistory] = await Promise.all([
    fetchCFUser(handle),
    fetchCFSubmissions(handle),
    fetchCFRatingHistory(handle),
  ])

  return {
    user,
    submissions,
    ratingHistory,
  }
}
