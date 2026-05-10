import Link from 'next/link'

export default function Navbar({ rightSlot }) {
  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DV</span>
          </div>
          <span className="font-bold text-gray-900">DevVerify</span>
        </Link>
        {rightSlot}
      </div>
    </nav>
  )
}
