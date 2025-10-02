'use client'

import { motion, AnimatePresence } from 'framer-motion'
import PlayerCard from './PlayerCard'
import { PlayerStats } from '@/types'

interface RankingListProps {
  players: PlayerStats[]
}

export default function RankingList({ players }: RankingListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-2xl text-gray-400 mb-2">Nenhum dado disponível</h3>
        <p className="text-gray-500">
          Não foram encontrados dados para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top 3 Highlight */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 via-neon-purple to-neon-blue bg-clip-text text-transparent">
          🏆 Top 3 do Mês 🏆
        </h2>
      </div>

      <AnimatePresence mode="popLayout">
        {players.map((player, index) => (
          <motion.div
            key={player.puuid}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {index === 3 && (
              <div className="my-8 border-t border-gray-700 pt-8">
                <h3 className="text-xl font-semibold text-gray-400 text-center mb-6">
                  Demais Jogadores
                </h3>
              </div>
            )}
            <PlayerCard player={player} index={index} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="mt-12 bg-dark-card border border-neon-purple/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-center mb-4 text-gray-300">
          📊 Estatísticas Gerais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-neon-purple">
              {players.reduce((sum, p) => sum + p.totalGames, 0)}
            </div>
            <div className="text-gray-400 text-sm mt-1">Total de Partidas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon-blue">
              {(players.reduce((sum, p) => sum + p.winRate, 0) / players.length).toFixed(1)}%
            </div>
            <div className="text-gray-400 text-sm mt-1">Win Rate Médio</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon-pink">
              {(players.reduce((sum, p) => sum + p.kda, 0) / players.length).toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm mt-1">KDA Médio</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">
              {(players.reduce((sum, p) => sum + p.avgCS, 0) / players.length).toFixed(0)}
            </div>
            <div className="text-gray-400 text-sm mt-1">CS Médio</div>
          </div>
        </div>
      </div>
    </div>
  )
}

