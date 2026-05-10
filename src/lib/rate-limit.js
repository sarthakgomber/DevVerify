// ============================================================
// DevVerify — In-Memory Rate Limiter
// Simple sliding window — sufficient for MVP, upgrade to Upstash later
// ============================================================

const store = new Map()

/**
 * Check if a request should be rate limited
 * @param {string} key - Unique identifier (IP, userId, etc.)
 * @param {number} limit - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function rateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now()

  if (!store.has(key)) {
    store.set(key, [])
  }

  const timestamps = store.get(key).filter(ts => now - ts < windowMs)
  store.set(key, timestamps)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    const resetIn = Math.ceil((oldest + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  timestamps.push(now)
  return { allowed: true, remaining: limit - timestamps.length, resetIn: 0 }
}

/**
 * Get client identifier from request
 */
export function getClientId(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of store.entries()) {
      const active = timestamps.filter(ts => now - ts < 300000)
      if (active.length === 0) store.delete(key)
      else store.set(key, active)
    }
  }, 300000)
}
