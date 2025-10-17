'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from '@/lib/locales'

interface HeaderProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  lastUpdate: Date
  isCached?: boolean
  dataTimestamp?: Date | null
  nextUpdateIn?: number // segundos até próxima atualização
}

export default function Header({ selectedMonth, onMonthChange, lastUpdate, isCached, dataTimestamp, nextUpdateIn }: HeaderProps) {
  const [months, setMonths] = useState<{ value: string; label: string }[]>([])
  const [countdown, setCountdown] = useState<string>('')

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

  // Atualizar contador a cada segundo
  useEffect(() => {
    if (!nextUpdateIn || nextUpdateIn <= 0) {
      setCountdown('')
      return
    }

    const updateCountdown = () => {
      const seconds = Math.max(0, Math.floor(nextUpdateIn - (Date.now() - lastUpdate.getTime()) / 1000))
      
      if (seconds <= 0) {
        setCountdown('Atualizando...')
        return
      }

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      
      if (minutes > 0) {
        setCountdown(`${minutes}min ${remainingSeconds}s`)
      } else {
        setCountdown(`${remainingSeconds}s`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextUpdateIn, lastUpdate])

  return (
    <header className="mb-8">
      {/* Title and Controls in one row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-dark-card border border-gray-700/50 rounded-lg p-6">
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            YoJornada
          </h1>
          <p className="text-gray-400 text-sm">
            Análise de desempenho de jogadores
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-gray-400 text-sm whitespace-nowrap">
              Período:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-dark-hover text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all cursor-pointer text-sm"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Info */}
          <div className="flex flex-col items-end gap-1 min-w-[200px]">
            <div className="text-gray-500 text-xs whitespace-nowrap" suppressHydrationWarning>
              {dataTimestamp ? (
                <>
                  {isCached ? 'Cache' : 'Atualizado'}: {format(dataTimestamp, "HH:mm:ss")}
                </>
              ) : (
                <>Visualizado: {format(lastUpdate, "HH:mm:ss")}</>
              )}
            </div>
            {isCached && countdown && (
              <div className="text-green-400 text-xs whitespace-nowrap">
                Proxima atualizacao: {countdown}
              </div>
            )}
            {isCached && !countdown && (
              <div className="text-green-400 text-xs whitespace-nowrap">
                Atualiza automaticamente a cada 15min
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

