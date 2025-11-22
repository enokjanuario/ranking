'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface HeaderProps {
  lastUpdate: Date
  isCached?: boolean
  dataTimestamp?: Date | null
  nextUpdateIn?: number // segundos até próxima atualização
}

export default function Header({ lastUpdate, isCached, dataTimestamp, nextUpdateIn }: HeaderProps) {
  // Calcular tempo até próxima atualização (horários :00, :15, :30, :45)
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('')
  
  useEffect(() => {
    const updateNextCountdown = () => {
      const now = new Date()
      const currentMinutes = now.getMinutes()
      const currentSeconds = now.getSeconds()
      
      // Calcular minutos até próximo horário de atualização
      let minutesUntilNext: number
      if (currentMinutes < 15) {
        minutesUntilNext = 15 - currentMinutes
      } else if (currentMinutes < 30) {
        minutesUntilNext = 30 - currentMinutes
      } else if (currentMinutes < 45) {
        minutesUntilNext = 45 - currentMinutes
      } else {
        // Próximo é :00 da próxima hora
        minutesUntilNext = 60 - currentMinutes
      }
      
      // Se estamos exatamente no horário (ex: 14:15:00), próximo é o próximo intervalo
      if (minutesUntilNext === 0 && currentSeconds === 0) {
        minutesUntilNext = 15
      }
      
      // Calcular segundos restantes
      const secondsUntilNext = minutesUntilNext * 60 - currentSeconds
      
      if (secondsUntilNext <= 0) {
        setNextUpdateCountdown('00:00')
        return
      }

      const minutes = Math.floor(secondsUntilNext / 60)
      const seconds = secondsUntilNext % 60
      
      // Formato MM:SS
      setNextUpdateCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateNextCountdown()
    const interval = setInterval(updateNextCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="mb-8">
      {/* Header - Modern Minimalist Design - Same height as logo */}
      <div className="relative glass-light rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300">
        {/* Subtle accent line with animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        
        {/* Content Container - Height matches logo (130px) */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-4 px-4 lg:px-8 h-[200px]">
          
          {/* Logo Section - Larger and Centered */}
          <div className="flex items-center justify-center group h-full">
            <Image 
              src="/logo-horizontal-white.png" 
              alt="Academia Y Logo" 
              width={550}
              height={130}
              className="h-full w-auto max-w-[550px] object-contain opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
              priority
            />
          </div>

          {/* Controls Section - Minimalist & Compact - Absolute Position */}
          <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Status Info - With Countdown and Tooltip */}
            <div className="relative group">
              <div className="flex flex-col items-end gap-2 px-6 py-4 bg-dark-bg/30 rounded-xl shadow-soft backdrop-blur-sm cursor-help">
                {nextUpdateCountdown && (
                  <div className="flex items-center gap-2">
                    <span className="text-neutral/50 text-sm font-medium">Atualizando em</span>
                    <span className="text-primary-light text-lg font-bold tabular-nums">
                      {nextUpdateCountdown}
                    </span>
                  </div>
                )}
              </div>

              {/* Tooltip discreto sobre Auto Refresh */}
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card/85 text-neutral/70 text-[10px] px-2.5 py-1.5 rounded-md shadow-sm border border-neutral/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-sm">
                Atualização automática nos horários :00, :15, :30, :45
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  )
}

