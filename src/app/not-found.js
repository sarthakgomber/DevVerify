import Link from 'next/link'
import { Shield, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <Search className="w-16 h-16 text-[var(--text-3)] mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-[var(--text)] mb-3">Report not found</h1>
        <p className="text-[var(--text-2)] mb-8">This report link may be invalid or expired.</p>
        <Link href="/" className="btn-primary text-lg py-3 px-8">Analyze a profile →</Link>
      </div>
    </div>
  )
}
