import './globals.css'

export const metadata = {
  title: 'SIGIL — Read the Code DNA',
  description: 'Drop a developer profile. SIGIL reads its code DNA across LeetCode, GitHub & Codeforces. Detect copy-paste patterns, burst submissions, and fake contributions.',
  keywords: 'developer verification, leetcode analyzer, github profile checker, coding profile analysis, copy-paste detection, sigil',
  authors: [{ name: 'SIGIL' }],
  openGraph: {
    title: 'SIGIL — Read the Code DNA',
    description: 'Drop a developer profile. SIGIL reads the truth.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-memphis">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
