# DevVerify

Detect fake, rushed, and copy-paste LeetCode profiles. Get a credibility score in seconds.

## Stack
- Next.js 14 (App Router, JavaScript)
- Tailwind CSS
- Supabase (Postgres + Auth)
- Resend (verification emails)

---

## Setup in 5 steps

### 1. Clone and install
```bash
git clone <your-repo>
cd devverify
npm install
```

### 2. Set up Supabase
1. Go to https://supabase.com and create a free project
2. In the SQL Editor, paste and run the entire contents of `supabase-schema.sql`
3. Go to Authentication → Providers → enable **Google** (add your OAuth credentials)
4. Go to Authentication → URL Configuration → add `http://localhost:3000/auth/callback` to Redirect URLs

### 3. Set up Resend (free email)
1. Go to https://resend.com → create free account
2. Create an API key
3. Add and verify a sending domain (or use the sandbox for dev)

### 4. Create environment file
```bash
cp .env.local.example .env.local
```
Fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=verify@yourdomain.com
```

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000

---

## Project structure
```
src/
├── app/
│   ├── page.js                        ← Landing page
│   ├── layout.js                      ← Root layout
│   ├── not-found.js                   ← 404 page
│   ├── auth/
│   │   ├── login/page.js              ← Login
│   │   ├── signup/page.js             ← Signup
│   │   └── callback/route.js          ← OAuth callback
│   ├── dashboard/
│   │   ├── page.js                    ← Dashboard (server)
│   │   └── DashboardClient.js         ← Dashboard (client)
│   ├── report/[id]/page.js            ← Shareable report
│   └── api/
│       ├── analyze/route.js           ← Run analysis
│       └── auth/
│           ├── verify-leetcode/       ← Send verification email
│           └── confirm-leetcode/      ← Confirm token from email
├── components/
│   ├── Navbar.js
│   ├── ShareButton.js
│   ├── ScoreRing.js
│   └── SignalCard.js
├── lib/
│   ├── leetcode.js                    ← LeetCode GraphQL fetcher
│   ├── scorer.js                      ← Anomaly detection engine
│   └── supabase/
│       ├── client.js                  ← Browser Supabase client
│       └── server.js                  ← Server Supabase client
└── middleware.js                      ← Route protection
```

---

## Detection signals

| Signal | Weight | Description |
|--------|--------|-------------|
| Burst days (10+ solves) | -8 each | Extreme solve counts in a single day |
| Burst days (6-9 solves) | -4 each | High volume days |
| Near-zero wrong attempts | -20 | WA rate < 3% — statistically impossible |
| Low wrong attempts | -10 | WA rate 3-8% — suspiciously low |
| New account + many solved | -25 | < 30 days old, 50+ solved |
| New account + some solved | -15 | < 30 days old, 20+ solved |
| Difficulty spike | -15 | More Hard solved than Easy |
| High AC rate | -10 | Acceptance rate > 85% |
| Consistent language | +8 | Only 1-2 languages used |
| Account age bonus | +10 | Account > 1 year old |
| Healthy WA rate | +5 | WA rate 15-40% (normal learner) |
| Good streak | +5 | 30+ day streak |

---

## Verdict thresholds
- **70-100** → Genuine
- **45-69** → Suspicious  
- **0-44** → Highly Suspicious

---

## Deployment (Vercel — free)
```bash
npm install -g vercel
vercel
```
Add all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.
Update `NEXT_PUBLIC_APP_URL` to your Vercel URL.
Add your Vercel URL to Supabase redirect URLs.

---

## Phase 2 (coming next)
- GitHub profile analysis
- AI-powered quiz engine (Gemini API — free)
- Voice explanation mode
