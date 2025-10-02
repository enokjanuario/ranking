'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from '@/lib/locales'

interface HeaderProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  onRefresh: () => void
  lastUpdate: Date
}

export default function Header({ selectedMonth, onMonthChange, onRefresh, lastUpdate }: HeaderProps) {
  const [months, setMonths] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    // Generate list of available months (last 12 months)
    const monthList = []
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = format(date, 'MMMM yyyy', { locale: ptBR })
      monthList.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    
    setMonths(monthList)
  }, [])

  return (
    <header className="mb-12 animate-slide-down">
      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-pink bg-clip-text text-transparent animate-glow">
          YoJornada
        </h1>
        <p className="text-gray-400 text-lg">
          Acompanhe o desempenho dos melhores jogadores
        </p>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-dark-card p-6 rounded-xl border border-neon-purple/20 shadow-lg">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="month-select" className="text-gray-300 font-medium">
            Período:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-dark-hover text-white px-4 py-2 rounded-lg border border-neon-blue/30 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all cursor-pointer"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button and Last Update */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <span className="text-gray-400 text-sm" suppressHydrationWarning>
            Última atualização: {format(lastUpdate, "HH:mm:ss")}
          </span>
          <button
            onClick={onRefresh}
            className="bg-gradient-to-r from-neon-purple to-neon-blue text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-purple/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            🔄 Atualizar Agora
          </button>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center mt-4">
        <p className="text-gray-500 text-sm">
          ⏱️ Atualização automática a cada 5 minutos
        </p>
      </div>
    </header>
  )
}

