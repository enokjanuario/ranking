'use client'

import { motion } from 'framer-motion'

interface StatsBarProps {
  value: number
  max: number
  color?: string
  showValue?: boolean
  animated?: boolean
}

export default function StatsBar({ 
  value, 
  max, 
  color = 'bg-primary', 
  showValue = false,
  animated = true 
}: StatsBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-dark-bg/40 rounded-full h-2.5 overflow-hidden shadow-inner backdrop-blur-sm">
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={`h-full ${color} rounded-full relative overflow-hidden`}
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </motion.div>
        ) : (
          <div
            className={`h-full ${color} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        )}
      </div>
      {showValue && (
        <span className="text-xs text-neutral/60 w-14 text-right font-semibold tabular-nums">
          {value.toFixed(0)}
        </span>
      )}
    </div>
  )
}

