'use client'

interface StatsBarProps {
  value: number
  max: number
  color?: string
  showValue?: boolean
}

export default function StatsBar({ value, max, color = 'bg-neon-blue', showValue = false }: StatsBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs text-gray-400 w-12 text-right">
          {value.toFixed(0)}
        </span>
      )}
    </div>
  )
}

