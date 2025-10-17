'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Set current month as default
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(monthStr)
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchRankingData()
    }
  }, [selectedMonth])

  // Auto-refresh every 16 minutes (slightly more than cache duration)
  // to ensure we always get fresh data after cache expires
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedMonth) {
        fetchRankingData(true)
      }
    }, 16 * 60 * 1000) // 16 minutes

    return () => clearInterval(interval)
  }, [selectedMonth])

  const fetchRankingData = async (silent = false) => {
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
        
        // Calculate seconds until next update (15 minutes = 900 seconds)
        if (data.cached || data.updatedAt) {
          const cacheAge = (Date.now() - timestamp.getTime()) / 1000 // segundos desde a atualização
          const remainingSeconds = Math.max(0, 900 - cacheAge) // 900 segundos = 15 minutos
          setNextUpdateIn(remainingSeconds)
        } else {
          setNextUpdateIn(900)
        }
      } else {
        console.error('Failed to fetch ranking data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching ranking data:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  return (
    <main className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Left Side Image */}
      <div 
        className="fixed top-0 left-0 bottom-0 z-0 pointer-events-none"
        style={{
          width: 'calc((100vw - 1400px) / 2)',
        }}
      >
        <img 
          src="/lateral1.jpg" 
          alt="Background" 
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'right center',
            opacity: 0.25,
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-6 max-w-[1400px] relative z-10">
        <Header 
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          lastUpdate={lastUpdate}
          isCached={isCached}
          dataTimestamp={dataTimestamp}
          nextUpdateIn={nextUpdateIn}
        />
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <PlayerTable players={players} />
        )}

        <Footer />
      </div>
    </main>
  )
}

