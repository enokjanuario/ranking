'use client'

import { motion } from 'framer-motion'
import { PlayerStats, Role } from '@/types'

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
    ? 'todos os jogadores'
    : ROLE_NAMES[selectedRole as Role] || selectedRole

  return (
    <div className="space-y-3 mb-6">
      {/* Título indicando o contexto */}
      <div className="text-center">
        <span className="text-neutral/40 text-xs font-medium uppercase tracking-wider">
          Medias {selectedRole === 'all' ? 'gerais' : `de ${roleLabel}`} ({players.length} {players.length === 1 ? 'jogador' : 'jogadores'})
        </span>
      </div>

      {/* Cards de estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {/* Card 1: PARTIDAS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-bg/30 rounded-lg p-4 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm text-center"
        >
          <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-2">
            Total de Partidas
          </div>
          <div className="text-2xl font-bold text-neutral/80">
            {totalGames}
          </div>
        </motion.div>

        {/* Card 2: WIN RATE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-dark-bg/30 rounded-lg p-4 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm text-center"
        >
          <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-2">
            Win Rate Medio
          </div>
          <div className={`text-2xl font-bold ${
            avgWinRate >= 60 ? 'text-green-400/80' :
            avgWinRate >= 50 ? 'text-yellow-400/80' :
            'text-red-400/80'
          }`}>
            {avgWinRate.toFixed(0)}%
          </div>
        </motion.div>

        {/* Card 3: KDA MÉDIO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-bg/30 rounded-lg p-4 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm text-center"
        >
          <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-2">
            KDA Medio
          </div>
          <div className={`text-2xl font-bold ${
            avgKDA >= 3 ? 'text-blue-400/80' :
            avgKDA >= 2 ? 'text-blue-300/80' :
            'text-neutral/60'
          }`}>
            {avgKDA.toFixed(2)}
          </div>
        </motion.div>

        {/* Card 4: CS MÉDIO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-dark-bg/30 rounded-lg p-4 border border-neutral/10 hover:border-neutral/20 transition-all duration-300 backdrop-blur-sm text-center"
        >
          <div className="text-neutral/50 text-[10px] font-medium uppercase tracking-wider mb-2">
            CS Medio
          </div>
          <div className="text-2xl font-bold text-yellow-400/80">
            {avgCS.toFixed(0)}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

