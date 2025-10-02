import axios from 'axios'
import { RIOT_API_CONFIG, RIOT_API_ENDPOINTS, DDRAGON_VERSION } from './constants'
import { RiotMatchDetails, PlayerStats, ChampionStats } from '@/types'

const api = axios.create({
  headers: {
    'X-Riot-Token': RIOT_API_CONFIG.key,
  },
})

// Add delay between requests to respect rate limits
// Increased delay to avoid rate limiting with Development API Key
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getAccountByRiotId(riotId: string) {
  try {
    const [gameName, tagLine] = riotId.split('#')
    const url = RIOT_API_ENDPOINTS.accountByRiotId(gameName, tagLine, RIOT_API_CONFIG.routing)
    
    await delay(500) // Increased delay to avoid rate limiting
    const response = await api.get(url)
    return response.data
  } catch (error: any) {
    console.error(`Error fetching account for ${riotId}:`, error.response?.data || error.message)
    return null
  }
}

export async function getMatchHistory(puuid: string, startTime?: number, endTime?: number) {
  try {
    let start = 0
    let allMatches: string[] = []
    const batchSize = 100

    // Fetch matches in batches
    while (true) {
      let url = RIOT_API_ENDPOINTS.matchListByPuuid(puuid, RIOT_API_CONFIG.routing, start, batchSize)
      
      if (startTime) {
        url += `&startTime=${Math.floor(startTime / 1000)}`
      }
      if (endTime) {
        url += `&endTime=${Math.floor(endTime / 1000)}`
      }

      await delay(100)
      const response = await api.get(url)
      const matches = response.data

      if (matches.length === 0) break
      
      allMatches = [...allMatches, ...matches]
      
      if (matches.length < batchSize) break
      
      start += batchSize
    }

    return allMatches
  } catch (error: any) {
    console.error(`Error fetching match history:`, error.response?.data || error.message)
    return []
  }
}

export async function getMatchDetails(matchId: string): Promise<RiotMatchDetails | null> {
  try {
    const url = RIOT_API_ENDPOINTS.matchById(matchId, RIOT_API_CONFIG.routing)
    
    await delay(100)
    const response = await api.get(url)
    return response.data
  } catch (error: any) {
    console.error(`Error fetching match ${matchId}:`, error.response?.data || error.message)
    return null
  }
}

export async function calculatePlayerStats(
  riotId: string,
  puuid: string,
  startTime: number,
  endTime: number
): Promise<Omit<PlayerStats, 'position' | 'previousPosition'> | null> {
  try {
    // Get match history for the period
    const matchIds = await getMatchHistory(puuid, startTime, endTime)
    
    if (matchIds.length === 0) {
      return {
        summonerName: riotId.split('#')[0],
        puuid,
        riotId,
        winRate: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        kda: 0,
        avgCS: 0,
        avgGameDuration: 0,
        mostPlayedChampion: {
          name: 'Unknown',
          icon: '',
          games: 0,
        },
      }
    }

    let wins = 0
    let totalKills = 0
    let totalDeaths = 0
    let totalAssists = 0
    let totalCS = 0
    let totalDuration = 0
    const championStats: ChampionStats = {}

    // Process matches (limit to avoid too many API calls)
    // Reduced to 15 matches to respect rate limits with Development API Key
    const matchesToProcess = matchIds.slice(0, 15)
    
    for (const matchId of matchesToProcess) {
      const matchDetails = await getMatchDetails(matchId)
      
      if (!matchDetails) continue

      const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
      
      if (!participant) continue

      if (participant.win) wins++
      
      totalKills += participant.kills
      totalDeaths += participant.deaths
      totalAssists += participant.assists
      totalCS += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)
      totalDuration += matchDetails.info.gameDuration

      // Track champion stats
      const champName = participant.championName
      if (!championStats[champName]) {
        championStats[champName] = { games: 0, wins: 0 }
      }
      championStats[champName].games++
      if (participant.win) championStats[champName].wins++
    }

    const totalGames = matchesToProcess.length
    const losses = totalGames - wins
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists
    const avgCS = totalGames > 0 ? totalCS / totalGames : 0
    const avgGameDuration = totalGames > 0 ? totalDuration / totalGames / 60 : 0

    // Find most played champion
    let mostPlayedChampion = {
      name: 'Unknown',
      icon: '',
      games: 0,
    }

    for (const [champName, stats] of Object.entries(championStats)) {
      if (stats.games > mostPlayedChampion.games) {
        mostPlayedChampion = {
          name: champName,
          icon: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champName}.png`,
          games: stats.games,
        }
      }
    }

    return {
      summonerName: riotId.split('#')[0],
      puuid,
      riotId,
      winRate: parseFloat(winRate.toFixed(2)),
      totalGames,
      wins,
      losses,
      kda: parseFloat(kda.toFixed(2)),
      avgCS: parseFloat(avgCS.toFixed(1)),
      avgGameDuration: parseFloat(avgGameDuration.toFixed(2)),
      mostPlayedChampion,
    }
  } catch (error) {
    console.error(`Error calculating stats for ${riotId}:`, error)
    return null
  }
}

export function rankPlayers(players: Omit<PlayerStats, 'position' | 'previousPosition'>[]): PlayerStats[] {
  // Sort by: 1) Win rate, 2) Total wins, 3) KDA, 4) Lower avg game duration
  const sorted = [...players].sort((a, b) => {
    // 1. Win rate (descending)
    if (a.winRate !== b.winRate) {
      return b.winRate - a.winRate
    }
    
    // 2. Total wins (descending)
    if (a.wins !== b.wins) {
      return b.wins - a.wins
    }
    
    // 3. KDA (descending)
    if (a.kda !== b.kda) {
      return b.kda - a.kda
    }
    
    // 4. Average game duration (ascending - faster games win)
    return a.avgGameDuration - b.avgGameDuration
  })

  // Assign positions
  return sorted.map((player, index) => ({
    ...player,
    position: index + 1,
  }))
}

