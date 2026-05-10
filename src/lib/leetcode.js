const LEETCODE_GQL = 'https://leetcode.com/graphql'

async function gql(query, variables = {}) {
  const res = await fetch(LEETCODE_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'Origin': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'x-csrftoken': 'abcdefghij',
      'Cookie': 'csrftoken=abcdefghij',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('LeetCode API response:', text.slice(0, 300))
    throw new Error(`LeetCode API error: ${res.status}`)
  }

  const json = await res.json()
  if (json.errors) {
    console.error('LeetCode GraphQL errors:', JSON.stringify(json.errors))
    throw new Error(json.errors[0].message)
  }
  return json.data
}

export async function fetchUserProfile(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        userCalendar {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `
  const data = await gql(query, { username })
  if (!data.matchedUser) throw new Error('User not found on LeetCode')
  return data.matchedUser
}

export async function fetchRecentSubmissions(username) {
  const query = `
    query getRecentSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        lang
      }
    }
  `
  const data = await gql(query, { username, limit: 20 })
  return data.recentAcSubmissionList || []
}

export async function fetchSubmissionCalendar(username) {
  const query = `
    query getUserCalendar($username: String!) {
      matchedUser(username: $username) {
        userCalendar {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `
  const data = await gql(query, { username })
  const calendar = data.matchedUser?.userCalendar?.submissionCalendar
  if (!calendar) return {}
  return JSON.parse(calendar)
}

export async function fetchFullProfile(username) {
  const [profile, recentSubmissions, calendar] = await Promise.all([
    fetchUserProfile(username),
    fetchRecentSubmissions(username),
    fetchSubmissionCalendar(username),
  ])
  return { profile, recentSubmissions, calendar }
}