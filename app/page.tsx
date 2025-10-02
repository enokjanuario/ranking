'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import RankingList from '@/components/RankingList'
import LoadingSpinner from '@/components/LoadingSpinner'
import { PlayerStats } from '@/types'

export default function Home() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

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

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedMonth) {
        fetchRankingData(true)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [selectedMonth])

  const fetchRankingData = async (silent = false) => {
    if (!silent) setLoading(true)
    
    try {
      const response = await fetch(`/api/ranking?month=${selectedMonth}`)
      const data = await response.json()
      
      if (data.success) {
        setPlayers(data.players)
        setLastUpdate(new Date())
      } else {
        console.error('Failed to fetch ranking data:', data.error)
      }
    } catch (error) {
      console.error('Error fetching ranking data:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchRankingData()
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header 
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          onRefresh={handleRefresh}
          lastUpdate={lastUpdate}
        />
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <RankingList players={players} />
        )}
      </div>

      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-purple opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-blue opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink opacity-5 rounded-full blur-3xl"></div>
      </div>
    </main>
  )
}

