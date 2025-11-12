'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'

interface HeaderProps {
  lastUpdate: Date
  isCached?: boolean
  dataTimestamp?: Date | null
  nextUpdateIn?: number // segundos até próxima atualização
}

export default function Header({ lastUpdate, isCached, dataTimestamp, nextUpdateIn }: HeaderProps) {
  const [countdown, setCountdown] = useState<string>('')

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

  // Calcular tempo até próxima atualização
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('')
  
  useEffect(() => {
    if (!nextUpdateIn || nextUpdateIn <= 0) {
      setNextUpdateCountdown('')
      return
    }

    const updateNextCountdown = () => {
      // Calcular tempo decorrido desde lastUpdate
      const elapsed = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
      // Tempo restante = tempo total - tempo decorrido
      const remaining = Math.max(0, nextUpdateIn - elapsed)
      
      if (remaining <= 0) {
        setNextUpdateCountdown('Atualizando...')
        return
      }

      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      
      // Sempre mostrar minutos e segundos formatados
      setNextUpdateCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateNextCountdown()
    const interval = setInterval(updateNextCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextUpdateIn, lastUpdate])

  return (
    <header className="mb-8">
      {/* Header - Modern Minimalist Design - Same height as logo */}
      <div className="relative glass-light rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
        {/* Subtle accent line with animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        
        {/* Content Container - Height matches logo (110px) */}
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-4 px-4 lg:px-8 h-[110px]">
          
          {/* Logo Section - Original Size */}
          <div className="flex items-center justify-center lg:justify-start group h-full">
            <Image 
              src="/logo-horizontal-white.png" 
              alt="Academia Y Logo" 
              width={450}
              height={110}
              className="h-full w-auto max-w-[450px] object-contain opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
              priority
            />
          </div>

          {/* Controls Section - Minimalist & Compact */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Status Info - With Countdown and Tooltip */}
            <div className="relative group">
              <div className="flex flex-col items-end gap-1 px-4 py-2 bg-dark-bg/30 rounded-xl shadow-soft backdrop-blur-sm cursor-help">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-secondary rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-neutral/70 text-xs font-semibold tabular-nums" suppressHydrationWarning>
                    {dataTimestamp ? format(dataTimestamp, "HH:mm:ss") : format(lastUpdate, "HH:mm:ss")}
                  </span>
                </div>
                {nextUpdateCountdown && (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral/50 text-[10px] font-medium">Próxima:</span>
                    <span className="text-primary-light text-[10px] font-bold tabular-nums">
                      {nextUpdateCountdown}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Tooltip discreto sobre Auto Refresh */}
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card/85 text-neutral/70 text-[10px] px-2.5 py-1.5 rounded-md shadow-sm border border-neutral/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-sm">
                Auto-refresh a cada 15 minutos
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  )
}

