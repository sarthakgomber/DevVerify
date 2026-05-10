import './globals.css'

export const metadata = {
  title: 'DevVerify — Detect Copy-Paste Developers. Verify Real Skill.',
  description: 'Analyze LeetCode, GitHub & Codeforces profiles for copy-paste patterns, burst submissions, and fake contributions. AI-powered quiz verification included.',
  keywords: 'leetcode analyzer, github profile checker, developer verification, coding profile analysis, copy-paste detection',
  authors: [{ name: 'DevVerify' }],
  openGraph: {
    title: 'DevVerify — Detect Fake Developer Profiles',
    description: 'Instantly analyze developer profiles across LeetCode, GitHub & Codeforces. Get a credibility score in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-grid">
        <div className="bg-radial-glow fixed inset-0 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
