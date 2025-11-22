'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import PlayerTable from '@/components/PlayerTable'
import LoadingSpinner from '@/components/LoadingSpinner'
import Footer from '@/components/Footer'
import { PlayerStats } from '@/types'

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isCached, setIsCached] = useState(false)
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null)
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(0)

  // Verificar se o campeonato já começou
  const COMPETITION_START = new Date('2025-11-24T03:00:00.000Z') // 00:00 BRT
  const isDev = process.env.NODE_ENV === 'development'
  const isPaused = !isDev && new Date() < COMPETITION_START

  useEffect(() => {
    // Set November 2025 as default
    setSelectedMonth('2025-11')
  }, [])

  const fetchRankingData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    
    try {
      const url = `/api/ranking?month=${selectedMonth}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setPlayers(data.players)
        setLastUpdate(new Date())
        setIsCached(data.cached || false)
        
        // Set data timestamp based on whether it's cached or freshly updated
        let timestamp: Date
        if (data.cached && data.cachedAt) {
          timestamp = new Date(data.cachedAt)
        } else if (data.updatedAt) {
          timestamp = new Date(data.updatedAt)
        } else {
          timestamp = new Date()
        }
        setDataTimestamp(timestamp)

        // Se os dados estão desatualizados (stale ou mais de 15 min), forçar atualização
        const dataAge = Date.now() - timestamp.getTime()
        const isDataStale = data.stale === true || dataAge > 15 * 60 * 1000
        if (isDataStale && !silent) {
          // Forçar atualização em background
          setTimeout(() => {
            fetch(`/api/ranking?month=${selectedMonth}&force=true`)
              .then(res => res.json())
              .then(freshData => {
                if (freshData.success) {
                  setPlayers(freshData.players)
                  setLastUpdate(new Date())
                  setIsCached(false)
                  if (freshData.updatedAt) {
                    setDataTimestamp(new Date(freshData.updatedAt))
                  }
                }
              })
              .catch(console.error)
          }, 100)
        }

        // Calcular tempo até próxima atualização (horários terminados em 00, 15, 30, 45)
        const now = new Date()
        const currentMinutes = now.getMinutes()
        
        // Encontrar próximo múltiplo de 15 minutos
        let nextUpdateMinutes: number
        if (currentMinutes < 15) {
          nextUpdateMinutes = 15
        } else if (currentMinutes < 30) {
          nextUpdateMinutes = 30
        } else if (currentMinutes < 45) {
          nextUpdateMinutes = 45
        } else {
          nextUpdateMinutes = 60 // Próxima hora (00)
        }
        
        // Criar data do próximo horário de atualização
        const nextUpdateTime = new Date(now)
        nextUpdateTime.setMinutes(nextUpdateMinutes)
        nextUpdateTime.setSeconds(0)
        nextUpdateTime.setMilliseconds(0)
        
        // Se passou dos 45, ir para próxima hora
        if (nextUpdateMinutes === 60) {
          nextUpdateTime.setHours(nextUpdateTime.getHours() + 1)
          nextUpdateTime.setMinutes(0)
        }
        
        // Calcular diferença em segundos
        const remainingSeconds = Math.max(0, Math.floor((nextUpdateTime.getTime() - now.getTime()) / 1000))
        setNextUpdateIn(remainingSeconds)
      } else {
        console.error('Failed to fetch ranking data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching ranking data:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    if (selectedMonth) {
      fetchRankingData()
    }
  }, [selectedMonth, fetchRankingData])

  // Auto-refresh nos horários :00, :15, :30, :45
  useEffect(() => {
    if (!selectedMonth) return

    // Função para calcular próximo horário de atualização
    const getNextUpdateTime = (): number => {
      const now = new Date()
      const currentMinutes = now.getMinutes()
      
      let nextUpdateMinutes: number
      if (currentMinutes < 15) {
        nextUpdateMinutes = 15
      } else if (currentMinutes < 30) {
        nextUpdateMinutes = 30
      } else if (currentMinutes < 45) {
        nextUpdateMinutes = 45
      } else {
        nextUpdateMinutes = 60 // Próxima hora (00)
      }
      
      const nextUpdateTime = new Date(now)
      nextUpdateTime.setMinutes(nextUpdateMinutes)
      nextUpdateTime.setSeconds(0)
      nextUpdateTime.setMilliseconds(0)
      
      if (nextUpdateMinutes === 60) {
        nextUpdateTime.setHours(nextUpdateTime.getHours() + 1)
        nextUpdateTime.setMinutes(0)
      }
      
      return nextUpdateTime.getTime() - now.getTime()
    }

    // Calcular tempo até próxima atualização
    let timeoutId: NodeJS.Timeout | null = null
    
    const scheduleNextUpdate = () => {
      const delay = getNextUpdateTime()
      
      // Se já passou do horário, agendar para o próximo
      timeoutId = setTimeout(() => {
        fetchRankingData(true)
        // Agendar próxima atualização
        scheduleNextUpdate()
      }, delay)
    }

    scheduleNextUpdate()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [selectedMonth, fetchRankingData])

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  // Página de aviso quando o campeonato ainda não começou
  if (isPaused) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url(/background-colorido.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/70 via-dark-bg/75 to-dark-bg/80"></div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-[1400px] relative z-10 flex flex-col items-center justify-center min-h-screen">
          <div className="bg-dark-card/90 backdrop-blur-sm rounded-lg p-8 md:p-12 max-w-2xl text-center border border-gray-700">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ranking Pausado
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-4">
              O campeonato comeca no dia 24 de novembro de 2025 as 00h.
            </p>
            <p className="text-gray-400">
              O ranking sera atualizado automaticamente a partir desse horario.
            </p>
            <div className="mt-8 p-4 bg-dark-bg/50 rounded-lg">
              <p className="text-sm text-gray-500">
                Data de inicio: 24/11/2025 as 00:00 (horario de Brasilia)
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background colorido da Academia Y */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background-colorido.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay para melhorar legibilidade - mais transparente para mostrar o background */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/70 via-dark-bg/75 to-dark-bg/80"></div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-[1400px] relative z-10">
        <Header
          lastUpdate={lastUpdate}
          isCached={isCached}
          dataTimestamp={dataTimestamp}
          nextUpdateIn={nextUpdateIn}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <PlayerTable
            players={players}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />
        )}

        <Footer />
      </div>
    </main>
  )
}

