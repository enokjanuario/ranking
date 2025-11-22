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

type SortField = 'position' | 'summonerName' | 'winRate' | 'totalGames' | 'kda' | 'avgCS' | 'currentRank' | 'lpChange'
type SortOrder = 'asc' | 'desc'

// Tier hierarchy for ranking
const TIER_HIERARCHY: Record<string, number> = {
  'IRON': 1,
  'BRONZE': 2,
  'SILVER': 3,
  'GOLD': 4,
  'PLATINUM': 5,
  'EMERALD': 6,
  'DIAMOND': 7,
  'MASTER': 8,
  'GRANDMASTER': 9,
  'CHALLENGER': 10,
}

// Rank division hierarchy
const RANK_DIVISION: Record<string, number> = {
  'IV': 1,
  'III': 2,
  'II': 3,
  'I': 4,
}

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

const COACH_IMAGES: Record<Role, string> = {
  top: '/assets/nicklinkPerfil.png',
  jungle: '/assets/revoltaPerfil.png',
  mid: '/assets/yodaPerfil.png',
  bot: '/assets/micaoPerfil.png',
  suporte: '/assets/dioudPerfil.png',
}

// Helper function para garantir valores numéricos seguros
const safeNumber = (value: number | undefined | null, defaultValue: number = 0): number => {
  if (value === null || value === undefined || isNaN(value)) return defaultValue
  return Number(value)
}

export default function PlayerTable({ players, selectedMonth, onMonthChange }: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all')
  const [months, setMonths] = useState<{ value: string; label: string }[]>([])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedRole('all')
    setSortField('position')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchTerm !== '' || selectedRole !== 'all' || sortField !== 'position' || sortOrder !== 'asc'

  useEffect(() => {
    // Gerar meses disponíveis dinamicamente
    // Começa em novembro 2025 (início do campeonato) até o mês atual
    const availableMonths: { value: string; label: string }[] = []
    const now = new Date()

    // Começar do mês de início do campeonato (Novembro 2025)
    let current = new Date(2025, 10, 1) // November 2025

    while (current <= now) {
      const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      const label = format(current, 'MMMM yyyy', { locale: ptBR })
      availableMonths.push({
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1)
      })
      current.setMonth(current.getMonth() + 1)
    }

    // Garantir que pelo menos novembro 2025 esteja disponível
    if (availableMonths.length === 0) {
      const novemberDate = new Date(2025, 10, 1)
      const value = '2025-11'
      const label = format(novemberDate, 'MMMM yyyy', { locale: ptBR })
      availableMonths.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }

    setMonths(availableMonths)
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
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'summonerName') {
        aValue = a.summonerName.toLowerCase()
        bValue = b.summonerName.toLowerCase()
      } else if (sortField === 'currentRank') {
        // Sort by rank: tier first, then division, then LP
        const aTier = a.currentRank?.tier ? TIER_HIERARCHY[a.currentRank.tier.toUpperCase()] || 0 : 0
        const bTier = b.currentRank?.tier ? TIER_HIERARCHY[b.currentRank.tier.toUpperCase()] || 0 : 0
        
        if (aTier !== bTier) {
          return sortOrder === 'asc' ? aTier - bTier : bTier - aTier
        }
        
        // Same tier, sort by division
        const aDiv = a.currentRank?.rank ? RANK_DIVISION[a.currentRank.rank.toUpperCase()] || 0 : 0
        const bDiv = b.currentRank?.rank ? RANK_DIVISION[b.currentRank.rank.toUpperCase()] || 0 : 0
        
        if (aDiv !== bDiv) {
          return sortOrder === 'asc' ? aDiv - bDiv : bDiv - aDiv
        }
        
        // Same division, sort by LP
        aValue = a.currentRank?.lp || 0
        bValue = b.currentRank?.lp || 0
      }

      // Handle null/undefined values
      if (aValue == null) aValue = sortOrder === 'asc' ? Infinity : -Infinity
      if (bValue == null) bValue = sortOrder === 'asc' ? Infinity : -Infinity

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

        {/* Period Selector */}
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
      </motion.div>

      {/* Filters and Sort - Combined Horizontal */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap justify-between items-center gap-4"
      >
        {/* Left Side - Role Filter and Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Role Filter */}
          <div className="flex items-center gap-3 flex-wrap">
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
                className={`relative w-12 h-12 rounded-xl transition-all duration-300 group shadow-soft flex items-center justify-center ${
                  selectedRole === role
                    ? 'bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-primary/70 shadow-lg shadow-primary/30'
                    : 'bg-dark-bg/60 border-2 border-neutral/40 hover:bg-dark-bg/70 hover:border-primary/50 hover:shadow-md'
                }`}
                title={ROLE_NAMES[role]}
              >
                <Image
                  src={ROLE_ICONS[role]}
                  alt={ROLE_NAMES[role]}
                  width={32}
                  height={32}
                  className={`object-contain transition-all duration-300 ${selectedRole === role ? 'opacity-100 drop-shadow-lg' : 'opacity-80 group-hover:opacity-100'} ${role === 'suporte' ? 'object-[center_center] scale-110' : ''}`}
                  style={{ width: '75%', height: '75%', objectFit: 'contain' }}
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
          </div>

          {/* Sort Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral/60 text-sm font-medium">Ordenar por:</span>
            {[
              { field: 'currentRank' as SortField, label: 'Elo' },
              { field: 'winRate' as SortField, label: 'Win Rate' },
              { field: 'kda' as SortField, label: 'KDA' },
              { field: 'totalGames' as SortField, label: 'Jogos' },
              { field: 'lpChange' as SortField, label: 'PDLs ganhos' },
            ].map(({ field, label }) => (
              <motion.button
                key={field}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSort(field)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  sortField === field
                    ? 'bg-gradient-to-r from-primary to-primary-light text-neutral shadow-lg shadow-primary/30'
                    : 'bg-dark-bg/60 text-neutral/70 hover:bg-dark-bg/70 hover:text-neutral border border-neutral/30'
                }`}
              >
                {label}
                <SortIcon field={field} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right Side - Results Count and Clear Filters */}
        <div className="flex items-center gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: hasActiveFilters ? 1 : 0.5, scale: 1 }}
            whileHover={hasActiveFilters ? { scale: 1.05 } : {}}
            whileTap={hasActiveFilters ? { scale: 0.95 } : {}}
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              hasActiveFilters
                ? 'text-neutral/70 hover:text-neutral bg-dark-bg/60 hover:bg-dark-bg/70 border border-neutral/30 hover:border-neutral/40 cursor-pointer'
                : 'text-neutral/40 bg-dark-bg/40 border border-neutral/20 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar Filtros
          </motion.button>
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-xl shadow-soft backdrop-blur-sm flex-shrink-0">
            <span className="text-neutral/50 text-xs font-semibold mr-1.5">Exibindo</span>
            <span className="text-secondary font-black text-sm">{filteredAndSortedPlayers.length}</span>
            <span className="text-neutral/30 mx-1 font-bold text-xs">/</span>
            <span className="text-neutral/60 font-bold text-sm">{players.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Player Cards - Modern Minimalist Design */}
      <div className="space-y-4">
        {filteredAndSortedPlayers.map((player, idx) => {
          const nickname = PLAYER_NICKNAMES[player.riotId] || player.summonerName
          const rankImg = getRankImage(player.currentRank?.tier)
          const filteredPosition = idx + 1 // Posição na lista filtrada e ordenada
          
          const opggUrl = `https://www.op.gg/summoners/br/${player.riotId.replace('#', '-')}`

          return (
            <motion.div
              key={player.puuid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.4 }}
              className="group relative glass-light rounded-2xl py-2 px-3 hover:glass transition-all duration-300 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer"
              onClick={() => window.open(opggUrl, '_blank')}
            >
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                
                {/* Position + Player Info - Fixed Width */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ width: '220px' }}>
                  {/* Position Badge - Much Smaller */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    filteredPosition === 1 ? 'bg-gradient-to-br from-secondary/40 to-secondary/10 text-secondary shadow-md shadow-secondary/30' :
                    filteredPosition === 2 ? 'bg-gradient-to-br from-neutral/25 to-neutral/10 text-neutral shadow-md shadow-neutral/20' :
                    filteredPosition === 3 ? 'bg-gradient-to-br from-primary/40 to-primary/10 text-primary shadow-md shadow-primary/30' :
                    'bg-dark-bg/40 text-neutral/60 shadow-inner'
                  }`}>
                    {filteredPosition}
                  </div>

                  {/* Player Name + Position Change - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral truncate group-hover:text-gradient-primary transition-colors">
                        {nickname}
                      </h3>
                      {player.previousPosition && player.previousPosition !== player.position && (
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                          player.previousPosition > player.position ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {player.previousPosition > player.position ? '↑' : '↓'} {Math.abs(player.previousPosition - player.position)}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral/50 font-medium truncate">{player.riotId}</p>
                  </div>
                </div>

                {/* Rank Badge - Fixed Width */}
                <div className="flex-shrink-0 hidden md:flex items-center justify-center" style={{ width: '80px' }}>
                  {player.currentRank && rankImg ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative w-10 h-10 scale-hover">
                        <Image
                          src={rankImg}
                          alt="Rank"
                          width={40}
                          height={40}
                          className="object-contain opacity-90 group-hover:opacity-100 drop-shadow-md"
                        />
                      </div>
                      {/* Division (I, II, III, IV) */}
                      {player.currentRank.rank && (
                        <span className="text-[10px] text-neutral/80 font-bold">
                          {player.currentRank.rank}
                        </span>
                      )}
                      {/* LP */}
                      <span className="text-[9px] text-neutral/60 font-semibold px-1.5 py-0.5 bg-dark-bg/40 rounded-full">
                        {player.currentRank.lp} LP
                      </span>
                    </div>
                  ) : (
                    <div className="w-10 h-10"></div>
                  )}
                </div>

                {/* Stats Grid - Ultra Compact Horizontal - Fixed Width Columns */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 lg:gap-2 flex-1 justify-center lg:justify-start">
                  
                  {/* Role - Fixed Width */}
                  <div className="flex flex-col items-center gap-1" style={{ width: '70px' }}>
                    <div className="flex items-center justify-center w-9 h-9">
                      <Image
                        src={ROLE_ICONS[player.role]}
                        alt={ROLE_NAMES[player.role]}
                        width={36}
                        height={36}
                        className={`opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg object-contain ${player.role === 'suporte' ? 'object-[center_center] scale-110' : ''}`}
                        title={ROLE_NAMES[player.role]}
                      />
                    </div>
                    <span className="text-[9px] text-neutral/40 font-medium">{ROLE_NAMES[player.role]}</span>
                  </div>

                  {/* Win Rate - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '70px' }}>
                    <span className={`text-lg font-black ${getWinRateColor(player.winRate)}`}>
                      {safeNumber(player.winRate, 0).toFixed(0)}%
                    </span>
                    <span className="text-[9px] text-neutral/50 font-medium">{player.wins}V-{player.losses}D</span>
                  </div>

                  {/* KDA - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '70px' }}>
                    <span className={`text-lg font-black ${getKDAColor(player.kda)}`}>
                      {safeNumber(player.kda, 0).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">KDA</span>
                  </div>

                  {/* CS - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '60px' }}>
                    <span className="text-lg font-black text-neutral">
                      {safeNumber(player.avgCS, 0).toFixed(0)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">CS</span>
                  </div>

                  {/* Vision Score - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '60px' }}>
                    <span className="text-lg font-black text-primary-light">
                      {safeNumber(player.avgVisionScore, 0).toFixed(0)}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">Visão</span>
                  </div>

                  {/* Total Games - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '60px' }}>
                    <span className="text-lg font-black text-neutral">
                      {player.totalGames}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">Jogos</span>
                  </div>

                  {/* LP Change - Fixed Width */}
                  <div className="flex flex-col items-center" style={{ width: '70px' }}>
                    <span className={`text-lg font-black ${
                      player.lpChange > 0 ? 'text-green-400' : 
                      player.lpChange < 0 ? 'text-red-400' : 
                      'text-neutral/50'
                    }`}>
                      {player.lpChange > 0 ? '+' : ''}{player.lpChange}
                    </span>
                    <span className="text-[9px] text-neutral/40 font-medium">LP</span>
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
                          unoptimized
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
                
                {/* Coach Image - Right Side Decoration */}
                <div className="flex-shrink-0 hidden lg:flex items-stretch ml-4 self-stretch">
                  <div className="relative w-20 h-full">
                    <Image
                      src={COACH_IMAGES[player.role]}
                      alt={`Coach ${player.role}`}
                      width={80}
                      height={80}
                      className="object-cover rounded-full w-full h-full"
                      onError={(e) => {
                        // Hide image if it doesn't exist
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Stats Summary - Modern Minimalist Design */}
      <div className="mt-16">
        {/* Título contextual */}
        <div className="text-center mb-6">
          <span className="text-neutral/40 text-sm font-medium uppercase tracking-wider">
            Medias {selectedRole === 'all' ? 'gerais' : `de ${ROLE_NAMES[selectedRole as Role]}`} ({filteredAndSortedPlayers.length} {filteredAndSortedPlayers.length === 1 ? 'jogador' : 'jogadores'})
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-6"
        >
          {/* Total Games Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">Total de Partidas</div>
            <div className="text-5xl font-black text-neutral drop-shadow-lg">
              {filteredAndSortedPlayers.reduce((sum, p) => sum + p.totalGames, 0)}
            </div>
          </motion.div>

          {/* Win Rate Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">Win Rate Medio</div>
            <div className="text-5xl font-black text-green-400 drop-shadow-lg">
              {(filteredAndSortedPlayers.reduce((sum, p) => sum + safeNumber(p.winRate, 0), 0) / filteredAndSortedPlayers.length).toFixed(0)}%
            </div>
          </motion.div>

          {/* KDA Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">KDA Medio</div>
            <div className="text-5xl font-black text-primary drop-shadow-lg">
              {(filteredAndSortedPlayers.reduce((sum, p) => sum + safeNumber(p.kda, 0), 0) / filteredAndSortedPlayers.length).toFixed(2)}
            </div>
          </motion.div>

          {/* CS Average Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">CS Medio</div>
            <div className="text-5xl font-black text-secondary drop-shadow-lg">
              {(filteredAndSortedPlayers.reduce((sum, p) => sum + safeNumber(p.avgCS, 0), 0) / filteredAndSortedPlayers.length).toFixed(0)}
            </div>
          </motion.div>

          {/* Vision Score Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="relative glass-light rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-soft-lg group cursor-default text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="text-neutral/40 text-xs uppercase tracking-widest mb-5 font-bold">Visao Media</div>
            <div className="text-5xl font-black text-purple-400 drop-shadow-lg">
              {(filteredAndSortedPlayers.reduce((sum, p) => sum + safeNumber(p.avgVisionScore, 0), 0) / filteredAndSortedPlayers.length).toFixed(0)}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

