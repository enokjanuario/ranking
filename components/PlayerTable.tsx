'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from '@/lib/locales'
import { PlayerStats, Role } from '@/types'
import StatsBar from './StatsBar'
import { PLAYER_NICKNAMES } from '@/lib/constants'

interface PlayerTableProps {
  players: PlayerStats[]
  selectedMonth: string
  onMonthChange: (month: string) => void
}

type SortField = 'position' | 'summonerName' | 'winRate' | 'totalGames' | 'kda' | 'avgCS'
type SortOrder = 'asc' | 'desc'

const ROLE_ICONS: Record<Role, string> = {
  top: '/icon-top.png',
  jungle: '/icon-jungle.png',
  mid: '/icon-mid.png',
  bot: '/icon-bot.png',
  suporte: '/icon-suporte.png',
}

const ROLE_NAMES: Record<Role, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'ADC',
  suporte: 'Suporte',
}

export default function PlayerTable({ players, selectedMonth, onMonthChange }: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all')
  const [months, setMonths] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    // Generate list of available months from October 2024 onwards
    const monthList = []
    const now = new Date()
    const startDate = new Date(2024, 9, 1) // October 2024 (month is 0-indexed, so 9 = October)
    
    // Start from current month and go back to October 2024
    let currentDate = new Date(now.getFullYear(), now.getMonth(), 1)
    
    while (currentDate >= startDate) {
      const value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const label = format(currentDate, 'MMMM yyyy', { locale: ptBR })
      monthList.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
      
      // Go to previous month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    }
    
    setMonths(monthList)
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const nickname = PLAYER_NICKNAMES[player.riotId] || ''
      const matchesSearch = player.summonerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.riotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nickname.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = selectedRole === 'all' || player.role === selectedRole
      return matchesSearch && matchesRole
    })

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'summonerName') {
        aValue = a.summonerName.toLowerCase()
        bValue = b.summonerName.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [players, sortField, sortOrder, searchTerm, selectedRole])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-neutral-dark">⇅</span>
    }
    return <span className="text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-400'
    if (winRate >= 50) return 'text-secondary'  // Usa amarelo da paleta
    return 'text-red-400'
  }

  const getKDAColor = (kda: number) => {
    if (kda >= 4) return 'text-primary-light'    // Usa azul claro da paleta
    if (kda >= 3) return 'text-primary'          // Usa azul primário
    if (kda >= 2) return 'text-green-400'
    return 'text-neutral-dark'                   // Usa bege escurecido
  }

  const getRankImage = (tier?: string) => {
    if (!tier) return null
    switch (tier.toUpperCase()) {
      case 'IRON': return '/silver.webp' // Fallback to silver (iron não existe)
      case 'BRONZE': return '/bronze.webp'
      case 'SILVER': return '/silver.webp'
      case 'GOLD': return '/gold.webp'
      case 'PLATINUM': return '/platinum.webp'
      case 'EMERALD': return '/emerald.webp'
      case 'DIAMOND': return '/diamond.webp'
      case 'MASTER': return '/master.webp'
      case 'GRANDMASTER': return '/master.webp' // Fallback to master
      case 'CHALLENGER': return '/challenger.webp'
      default: return null
    }
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl text-gray-400 mb-2">Nenhum dado disponível</h3>
        <p className="text-gray-500">
          Não foram encontrados dados para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters - Minimal Clean Design */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row items-stretch gap-4"
      >
        {/* Search - Narrower Input */}
        <div className="w-full lg:w-80 relative">
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-light text-neutral px-7 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:glass hover:shadow-soft-lg transition-all placeholder-neutral/40 font-semibold text-base shadow-soft backdrop-blur-sm"
          />
        </div>

        {/* Period and Results - Aligned, No Overlap */}
        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
          {/* Period Selector - Narrower */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <label htmlFor="month-select-table" className="text-neutral/50 text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
              Período
            </label>
            <select
              id="month-select-table"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-48 glass-light text-neutral px-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 hover:glass hover:shadow-soft-lg transition-all cursor-pointer font-semibold text-base shadow-soft backdrop-blur-sm"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value} className="bg-dark-card text-neutral">
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count - No Overlap */}
          <div className="flex items-center justify-center lg:justify-start px-7 py-4 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-2xl shadow-soft backdrop-blur-sm flex-shrink-0">
            <span className="text-neutral/50 text-sm font-semibold mr-2">Exibindo</span>
            <span className="text-secondary font-black text-xl">{filteredAndSortedPlayers.length}</span>
            <span className="text-neutral/30 mx-2 font-bold">/</span>
            <span className="text-neutral/60 font-bold text-lg">{players.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Role Filter - More Visible (Below Search) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex justify-center items-center gap-3 flex-wrap"
      >
        {/* All Roles Button - More Visible */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedRole('all')}
          className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wide transition-all duration-300 shadow-soft ${
            selectedRole === 'all'
              ? 'bg-gradient-to-r from-primary to-primary-light text-neutral border-2 border-primary/50 shadow-lg shadow-primary/30'
              : 'bg-dark-bg/70 text-neutral/80 hover:text-neutral hover:bg-dark-bg/80 border-2 border-neutral/30 hover:border-primary/50'
          }`}
        >
          Todos
        </motion.button>
        
        {/* Role Icons - More Visible */}
        {(Object.keys(ROLE_ICONS) as Role[]).map((role) => (
          <motion.button
            key={role}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedRole(role)}
            className={`relative p-3 rounded-xl transition-all duration-300 group shadow-soft ${
              selectedRole === role
                ? 'bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-primary/70 shadow-lg shadow-primary/30'
                : 'bg-dark-bg/60 border-2 border-neutral/40 hover:bg-dark-bg/70 hover:border-primary/50 hover:shadow-md'
            }`}
            title={ROLE_NAMES[role]}
          >
            <Image
              src={ROLE_ICONS[role]}
              alt={ROLE_NAMES[role]}
              width={28}
              height={28}
              className={`transition-all duration-300 ${selectedRole === role ? 'opacity-100 drop-shadow-lg' : 'opacity-80 group-hover:opacity-100'}`}
            />
            {/* Selected indicator - more visible */}
            {selectedRole === role && (
              <motion.div 
                layoutId="roleIndicator"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50"
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Player Cards - Modern Minimalist Design */}
      <div className="space-y-4">
        {filteredAndSortedPlayers.map((player, idx) => {
          const nickname = PLAYER_NICKNAMES[player.riotId] || player.summonerName
          const rankImg = getRankImage(player.currentRank?.tier)
          
          return (
            <motion.div
              key={player.puuid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.4 }}
              className="group relative glass-light rounded-2xl py-2 px-3 hover:glass transition-all duration-300 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer"
            >
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col lg:flex-row items-center gap-2">
                
                {/* Position + Player Info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Position Badge - Much Smaller */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    player.position === 1 ? 'bg-gradient-to-br from-secondary/40 to-secondary/10 text-secondary shadow-md shadow-secondary/30' :
                    player.position === 2 ? 'bg-gradient-to-br from-neutral/25 to-neutral/10 text-neutral shadow-md shadow-neutral/20' :
                    player.position === 3 ? 'bg-gradient-to-br from-primary/40 to-primary/10 text-primary shadow-md shadow-primary/30' :
                    'bg-dark-bg/40 text-neutral/60 shadow-inner'
                  }`}>
                    {player.position}
                  </div>

                  {/* Player Name + LP Change - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral truncate group-hover:text-gradient-primary transition-colors">
                        {nickname}
                      </h3>
                      {player.lpChange !== 0 && (
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          player.lpChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {player.lpChange > 0 ? '↑' : '↓'} {Math.abs(player.lpChange)}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral/50 font-medium truncate">{player.riotId}</p>
                  </div>

                  {/* Rank Badge - Much Smaller */}
                  {player.currentRank && rankImg && (
                    <div className="hidden md:flex items-center gap-1.5 px-2">
                      <div className="relative w-10 h-10 scale-hover">
                        <Image
                          src={rankImg}
                          alt="Rank"
                          width={40}
                          height={40}
                          className="object-contain opacity-90 group-hover:opacity-100 drop-shadow-md"
                        />
                      </div>
                      <span className="text-[10px] text-neutral/70 font-semibold px-1.5 py-0.5 bg-dark-bg/40 rounded-full">
                        {player.currentRank.lp}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Grid - Ultra Compact Horizontal */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 lg:gap-4 w-full lg:w-auto">
                  
                  {/* Role - Same size as other columns */}
                  <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    <div className="flex items-center justify-center">
                      <Image
                        src={ROLE_ICONS[player.role]}
                        alt={ROLE_NAMES[player.role]}
                        width={36}
                        height={36}
                        className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                        title={ROLE_NAMES[player.role]}
                      />
                    </div>
                    <span className="text-[9px] text-neutral/40 font-medium">{ROLE_NAMES[player.role]}</span>
                  </div>

                  {/* Win Rate - Compact */}
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className={`text-lg font-black ${getWinRateColor(player.winRate)}`}>
                      {player.winRate.toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-neutral/50 font-medium">{player.wins}V-{player.losses}D</span>
                  </div>

                  {/* KDA - Compact */}
                  <div className="flex flex-col items-center min-w-[55px]">
                    <span className={`text-lg font-black ${getKDAColor(player.kda)}`}>
                      {player.kda.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">KDA</span>
                  </div>

                  {/* CS - Compact */}
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className="text-lg font-black text-neutral">
                      {player.avgCS.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">CS</span>
                  </div>

                  {/* Vision Score - Compact */}
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className="text-lg font-black text-primary-light">
                      {player.avgVisionScore.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">Visão</span>
                  </div>

                  {/* Total Games - Compact */}
                  <div className="flex flex-col items-center min-w-[45px]">
                    <span className="text-lg font-black text-neutral">
                      {player.totalGames}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">Jogos</span>
          </div>

                  {/* Champions - Much Smaller */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-neutral/10">
                    {player.topChampions.slice(0, 3).map((champ, i) => (
                      <div key={i} className="relative group/champ scale-hover">
                        <Image
                          src={champ.icon}
                          alt={champ.name}
                          width={28}
                          height={28}
                          className="rounded-lg shadow-soft group-hover/champ:shadow-soft-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-accent to-accent-dark text-neutral text-[8px] font-bold px-1 py-0.5 rounded shadow-md">
                          {champ.games}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-card/90 text-neutral text-[10px] font-semibold px-2 py-1 rounded opacity-0 group-hover/champ:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {champ.name}
                        </div>
                      </div>
                    ))}
                  </div>
          </div>
        </div>
            </motion.div>
          )
        })}
      </div>

      {/* Stats Summary - Modern Minimalist Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
      >
        {/* Total Games Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">Partidas</div>
          <div className="text-5xl font-black text-neutral mb-2 drop-shadow-lg">
            {players.reduce((sum, p) => sum + p.totalGames, 0)}
          </div>
          <div className="text-neutral/50 text-sm font-semibold">
            {players.length} jogadores
          </div>
        </motion.div>
        
        {/* Win Rate Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">Win Rate</div>
          <div className="text-5xl font-black text-green-400 mb-4 drop-shadow-lg">
            {(players.reduce((sum, p) => sum + p.winRate, 0) / players.length).toFixed(0)}%
          </div>
          <div className="h-2.5 bg-dark-bg/40 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${players.reduce((sum, p) => sum + p.winRate, 0) / players.length}%` }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
            />
          </div>
        </motion.div>
        
        {/* KDA Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">KDA Médio</div>
          <div className="text-5xl font-black text-primary mb-4 drop-shadow-lg">
            {(players.reduce((sum, p) => sum + p.kda, 0) / players.length).toFixed(2)}
          </div>
          <div className="h-2.5 bg-dark-bg/40 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (players.reduce((sum, p) => sum + p.kda, 0) / players.length) * 20)}%` }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
            />
          </div>
        </motion.div>
        
        {/* CS Average Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">CS Médio</div>
          <div className="text-5xl font-black text-secondary mb-4 drop-shadow-lg">
            {(players.reduce((sum, p) => sum + p.avgCS, 0) / players.length).toFixed(0)}
          </div>
          <div className="h-2.5 bg-dark-bg/40 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (players.reduce((sum, p) => sum + p.avgCS, 0) / players.length) / 2.5)}%` }}
              transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-secondary to-secondary-light rounded-full"
          />
        </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

