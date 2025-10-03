'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { PlayerStats } from '@/types'
import StatsBar from './StatsBar'
import { PLAYER_NICKNAMES } from '@/lib/constants'

interface PlayerTableProps {
  players: PlayerStats[]
}

type SortField = 'position' | 'summonerName' | 'winRate' | 'totalGames' | 'kda' | 'avgCS'
type SortOrder = 'asc' | 'desc'

export default function PlayerTable({ players }: PlayerTableProps) {
  const [sortField, setSortField] = useState<SortField>('position')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [minGames, setMinGames] = useState(0)

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
      const matchesGames = player.totalGames >= minGames
      return matchesSearch && matchesGames
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
  }, [players, sortField, sortOrder, searchTerm, minGames])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-600">⇅</span>
    }
    return <span className="text-neon-blue">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-green-400'
    if (winRate >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getKDAColor = (kda: number) => {
    if (kda >= 4) return 'text-cyan-400'
    if (kda >= 3) return 'text-blue-400'
    if (kda >= 2) return 'text-green-400'
    return 'text-gray-400'
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
      {/* Search and Filters */}
      <div className="bg-dark-card border border-gray-700/50 rounded-lg p-5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-hover text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all"
              />
            </div>
          </div>

          {/* Min Games Filter */}
          <div className="w-full md:w-48">
            <select
              value={minGames}
              onChange={(e) => setMinGames(Number(e.target.value))}
              className="w-full bg-dark-hover text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue/50 transition-all cursor-pointer"
            >
              <option value="0">Todas as partidas</option>
              <option value="5">Mín. 5 partidas</option>
              <option value="10">Mín. 10 partidas</option>
              <option value="20">Mín. 20 partidas</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="bg-dark-hover px-4 py-2.5 rounded-lg border border-gray-700">
            <span className="text-gray-400 text-sm">Mostrando: </span>
            <span className="text-white font-semibold">{filteredAndSortedPlayers.length}</span>
            <span className="text-gray-500 text-sm">/{players.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-card border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-dark-hover">
                <th className="px-4 py-4 text-left">
                  <button
                    onClick={() => handleSort('position')}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                  >
                    #
                    <SortIcon field="position" />
                  </button>
                </th>
                <th className="px-4 py-4 text-left">
                  <button
                    onClick={() => handleSort('summonerName')}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                  >
                    Jogador
                    <SortIcon field="summonerName" />
                  </button>
                </th>
                <th className="px-4 py-4 text-left">
                  <span className="text-gray-300 font-semibold">Campeões Mais Jogados</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleSort('totalGames')}
                    className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold w-full"
                  >
                    Partidas
                    <SortIcon field="totalGames" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="text-gray-300 font-semibold">LP Ganhos</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleSort('winRate')}
                    className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold w-full"
                  >
                    Win Rate
                    <SortIcon field="winRate" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleSort('kda')}
                    className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold w-full"
                  >
                    KDA
                    <SortIcon field="kda" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleSort('avgCS')}
                    className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold w-full"
                  >
                    CS/Jogo
                    <SortIcon field="avgCS" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="text-gray-300 font-semibold">Tempo Médio</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPlayers.map((player, idx) => (
                <motion.tr
                  key={player.puuid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-gray-800 hover:bg-dark-hover transition-all cursor-pointer group"
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {player.position <= 3 ? (
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          player.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          player.position === 2 ? 'bg-gray-500/20 text-gray-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          <span className="font-bold text-sm">{player.position}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 font-semibold text-sm w-8 text-center">
                          {player.position}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Player Name */}
                  <td className="px-4 py-3">
                    <div>
                      {PLAYER_NICKNAMES[player.riotId] ? (
                        <>
                          <div className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                            {PLAYER_NICKNAMES[player.riotId]}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {player.riotId}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                            {player.summonerName}
                          </div>
                          <div className="text-gray-500 text-xs">{player.riotId}</div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Top 3 Champions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {player.topChampions && player.topChampions.length > 0 ? (
                        player.topChampions.map((champ, champIdx) => (
                          <div 
                            key={champIdx}
                            className="relative group/champ"
                            title={`${champ.name} - ${champ.games} jogos`}
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-700 group-hover/champ:border-neon-blue transition-colors">
                              <Image
                                src={champ.icon}
                                alt={champ.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                              {/* Game count badge */}
                              <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] px-1 rounded-tl">
                                {champ.games}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">Sem dados</div>
                      )}
                    </div>
                  </td>

                  {/* Games */}
                  <td className="px-4 py-3 text-center">
                    <div className="font-semibold text-white text-sm">{player.totalGames}</div>
                    <div className="text-gray-500 text-xs">{player.wins}V / {player.losses}D</div>
                  </td>

                  {/* LP Change */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {player.lpChange > 0 ? (
                        <>
                          <span className="text-green-400 text-lg">↑</span>
                          <span className="font-bold text-green-400 text-base">
                            {player.lpChange} LP
                          </span>
                        </>
                      ) : player.lpChange < 0 ? (
                        <>
                          <span className="text-red-400 text-lg">↓</span>
                          <span className="font-bold text-red-400 text-base">
                            {Math.abs(player.lpChange)} LP
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-white text-lg">-</span>
                          <span className="font-semibold text-gray-400 text-base">
                            0 LP
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Win Rate */}
                  <td className="px-4 py-3 text-center">
                    <div className={`font-bold text-base ${getWinRateColor(player.winRate)}`}>
                      {player.winRate.toFixed(1)}%
                    </div>
                    <div className="mt-1">
                      <StatsBar 
                        value={player.winRate}
                        max={100}
                        color={player.winRate >= 60 ? 'bg-green-500' : player.winRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                      />
                    </div>
                  </td>

                  {/* KDA */}
                  <td className="px-4 py-3 text-center">
                    <div className={`font-bold text-base ${getKDAColor(player.kda)}`}>
                      {player.kda.toFixed(2)}
                    </div>
                    <div className="mt-1">
                      <StatsBar 
                        value={player.kda}
                        max={6}
                        color={player.kda >= 4 ? 'bg-cyan-500' : player.kda >= 3 ? 'bg-blue-500' : 'bg-gray-500'}
                      />
                    </div>
                  </td>

                  {/* CS */}
                  <td className="px-4 py-3 text-center">
                    <div className={`font-semibold text-sm ${
                      player.avgCS >= 200 ? 'text-green-400' :
                      player.avgCS >= 150 ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {player.avgCS.toFixed(0)}
                    </div>
                  </td>

                  {/* Avg Time */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-gray-400 text-sm">
                      {Math.floor(player.avgGameDuration)}min
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-colors">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total de Partidas</div>
          <div className="text-3xl font-bold text-white mb-1">
            {players.reduce((sum, p) => sum + p.totalGames, 0)}
          </div>
          <div className="text-gray-500 text-xs">
            {players.length} jogadores ativos
          </div>
        </div>
        <div className="bg-dark-card border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-colors">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Win Rate Médio</div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {(players.reduce((sum, p) => sum + p.winRate, 0) / players.length).toFixed(1)}%
          </div>
          <StatsBar 
            value={players.reduce((sum, p) => sum + p.winRate, 0) / players.length}
            max={100}
            color="bg-green-500"
          />
        </div>
        <div className="bg-dark-card border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-colors">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">KDA Médio</div>
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {(players.reduce((sum, p) => sum + p.kda, 0) / players.length).toFixed(2)}
          </div>
          <StatsBar 
            value={players.reduce((sum, p) => sum + p.kda, 0) / players.length}
            max={5}
            color="bg-cyan-500"
          />
        </div>
        <div className="bg-dark-card border border-gray-700/50 rounded-lg p-5 hover:border-gray-600/50 transition-colors">
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">CS Médio</div>
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            {(players.reduce((sum, p) => sum + p.avgCS, 0) / players.length).toFixed(0)}
          </div>
          <StatsBar 
            value={players.reduce((sum, p) => sum + p.avgCS, 0) / players.length}
            max={250}
            color="bg-yellow-500"
          />
        </div>
      </div>
    </div>
  )
}

