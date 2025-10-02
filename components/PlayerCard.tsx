'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { PlayerStats } from '@/types'

interface PlayerCardProps {
  player: PlayerStats
  index: number
}

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const getRankColor = (position: number) => {
    if (position === 1) return 'from-yellow-400 to-yellow-600'
    if (position === 2) return 'from-gray-300 to-gray-500'
    if (position === 3) return 'from-orange-400 to-orange-600'
    return 'from-neon-purple to-neon-blue'
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return '👑'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return ''
  }

  const getPositionChange = () => {
    if (!player.previousPosition) return null
    const change = player.previousPosition - player.position
    if (change > 0) return { direction: 'up', value: change }
    if (change < 0) return { direction: 'down', value: Math.abs(change) }
    return null
  }

  const positionChange = getPositionChange()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      <div className={`bg-dark-card border border-neon-purple/20 rounded-xl p-6 hover:border-neon-blue/50 transition-all duration-300 hover:shadow-xl hover:shadow-neon-purple/20 ${
        player.position <= 3 ? 'hover:scale-[1.02]' : ''
      }`}>
        {/* Position Badge */}
        <div className="absolute -top-3 -left-3 z-10">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getRankColor(player.position)} flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-xl">
              {getRankIcon(player.position)}
              {player.position <= 3 ? '' : `#${player.position}`}
            </span>
          </div>
        </div>

        {/* Position Change Indicator */}
        {positionChange && (
          <div className={`absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center ${
            positionChange.direction === 'up' ? 'bg-green-500' : 'bg-red-500'
          } shadow-lg`}>
            <span className="text-white text-xs font-bold">
              {positionChange.direction === 'up' ? '↑' : '↓'}{positionChange.value}
            </span>
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Champion Icon */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-neon-blue/30 shadow-lg flex-shrink-0">
            {player.mostPlayedChampion.icon ? (
              <Image
                src={player.mostPlayedChampion.icon}
                alt={player.mostPlayedChampion.name}
                width={80}
                height={80}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-3xl">🎮</span>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-2xl font-bold text-white truncate">
                {player.summonerName}
              </h3>
              <span className="text-gray-400 text-sm">
                {player.riotId}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <span>Mais jogado:</span>
              <span className="text-neon-blue font-semibold">
                {player.mostPlayedChampion.name}
              </span>
              <span className="text-gray-500">
                ({player.mostPlayedChampion.games} jogos)
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Win Rate */}
              <div className="bg-dark-hover rounded-lg p-3 border border-neon-purple/10">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className={`text-xl font-bold ${
                  player.winRate >= 60 ? 'text-green-400' : 
                  player.winRate >= 50 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {player.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {player.wins}V - {player.losses}D
                </div>
              </div>

              {/* Games */}
              <div className="bg-dark-hover rounded-lg p-3 border border-neon-blue/10">
                <div className="text-xs text-gray-400 mb-1">Partidas</div>
                <div className="text-xl font-bold text-neon-blue">
                  {player.totalGames}
                </div>
              </div>

              {/* KDA */}
              <div className="bg-dark-hover rounded-lg p-3 border border-neon-pink/10">
                <div className="text-xs text-gray-400 mb-1">KDA</div>
                <div className={`text-xl font-bold ${
                  player.kda >= 4 ? 'text-neon-cyan' : 
                  player.kda >= 2 ? 'text-neon-blue' : 
                  'text-gray-300'
                }`}>
                  {player.kda.toFixed(2)}
                </div>
              </div>

              {/* CS Average */}
              <div className="bg-dark-hover rounded-lg p-3 border border-green-700/20">
                <div className="text-xs text-gray-400 mb-1">CS Médio</div>
                <div className={`text-xl font-bold ${
                  player.avgCS >= 200 ? 'text-green-400' : 
                  player.avgCS >= 150 ? 'text-yellow-400' : 
                  'text-gray-300'
                }`}>
                  {player.avgCS.toFixed(0)}
                </div>
              </div>

              {/* Avg Game Time */}
              <div className="bg-dark-hover rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Tempo Médio</div>
                <div className="text-xl font-bold text-gray-300">
                  {Math.floor(player.avgGameDuration)}min
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

