'use client'

import { motion } from 'framer-motion'
import { PlayerStats, Role } from '@/types'
import StatsBar from './StatsBar'

const ROLE_NAMES: Record<Role, string> = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'ADC',
  suporte: 'Suporte',
}

interface StatsCardsProps {
  players: PlayerStats[]
  selectedRole: string
}

export default function StatsCards({ players, selectedRole }: StatsCardsProps) {
  if (players.length === 0) return null

  // Calcular estatísticas agregadas
  const totalGames = players.reduce((sum, p) => sum + (p.totalGames || 0), 0)
  const totalWins = players.reduce((sum, p) => sum + (p.wins || 0), 0)
  const avgWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0
  
  const avgKDA = players.length > 0
    ? players.reduce((sum, p) => sum + (p.kda || 0), 0) / players.length
    : 0
  
  const avgCS = players.length > 0
    ? players.reduce((sum, p) => sum + (p.avgCS || 0), 0) / players.length
    : 0

  const roleLabel = selectedRole === 'all' 
    ? 'jogadores' 
    : `${players.length} ${ROLE_NAMES[selectedRole as Role] || selectedRole}${players.length > 1 ? 's' : ''}`

  return (
    <div className="space-y-3 mb-6">
      {/* Primeira linha - 4 cards principais */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      >
      {/* Card 1: PARTIDAS */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-bg/30 rounded-lg p-3 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-1">
          PARTIDAS
        </div>
        <div className="text-xl font-bold text-neutral/80 mb-0.5">
          {totalGames}
        </div>
        <div className="text-neutral/40 text-[9px] font-medium">
          {players.length} {roleLabel}
        </div>
      </motion.div>

      {/* Card 2: WIN RATE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-dark-bg/30 rounded-lg p-3 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-1">
          WIN RATE
        </div>
        <div className={`text-xl font-bold mb-1.5 ${
          avgWinRate >= 60 ? 'text-green-400/80' :
          avgWinRate >= 50 ? 'text-yellow-400/80' :
          'text-red-400/80'
        }`}>
          {avgWinRate.toFixed(0)}%
        </div>
        <StatsBar 
          value={avgWinRate} 
          max={100} 
          color={avgWinRate >= 60 ? 'bg-green-400/60' : avgWinRate >= 50 ? 'bg-yellow-400/60' : 'bg-red-400/60'} 
          animated={true}
        />
      </motion.div>

      {/* Card 3: KDA MÉDIO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-bg/30 rounded-lg p-3 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-1">
          KDA MÉDIO
        </div>
        <div className={`text-xl font-bold mb-1.5 ${
          avgKDA >= 3 ? 'text-blue-400/80' :
          avgKDA >= 2 ? 'text-blue-300/80' :
          'text-neutral/60'
        }`}>
          {avgKDA.toFixed(2)}
        </div>
        <StatsBar 
          value={avgKDA} 
          max={5} 
          color="bg-blue-400/60" 
          animated={true}
        />
      </motion.div>

      {/* Card 4: CS MÉDIO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-dark-bg/30 rounded-lg p-3 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm"
      >
        <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-1">
          CS MÉDIO
        </div>
        <div className="text-xl font-bold text-yellow-400/80 mb-1.5">
          {avgCS.toFixed(0)}
        </div>
        <StatsBar 
          value={avgCS} 
          max={200} 
          color="bg-yellow-400/60" 
          animated={true}
        />
      </motion.div>
      </motion.div>
    </div>
  )
}

