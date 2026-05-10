import { getSeverityColor } from '../lib/scorer'

export default function SignalCard({ signal }) {
  const c = getSeverityColor(signal.severity)
  const isPositive = signal.severity === 'positive'

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`}></span>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${c.text}`}>{signal.label}</div>
        <div className="text-gray-600 text-xs mt-0.5 leading-relaxed">{signal.description}</div>
      </div>
      {signal.deduction !== undefined && (
        <span className={`text-xs font-bold flex-shrink-0 ${c.text}`}>
          {isPositive ? `+${signal.deduction}` : signal.deduction}
        </span>
      )}
    </div>
  )
}
