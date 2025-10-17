import axios from 'axios'
import { RIOT_API_CONFIG, RIOT_API_ENDPOINTS, DDRAGON_VERSION } from './constants'
import { RiotMatchDetails, PlayerStats, ChampionStats } from '@/types'
import { calculateLPChange, rankToAbsoluteLP } from './lpCalculator'
import { saveRankSnapshot, getRankSnapshot } from './rankSnapshot'

const api = axios.create({
  headers: {
    'X-Riot-Token': RIOT_API_CONFIG.key,
  },
})

// Add delay between requests to respect rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Batch processing with rate limiting
async function processBatch<T>(
  items: string[],
  batchSize: number,
  processor: (item: string) => Promise<T>,
  delayMs: number = 50
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises = batch.map(item => processor(item))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    if (i + batchSize < items.length) {
      await delay(delayMs)
    }
  }
  
  return results
}

export async function getAccountByRiotId(riotId: string) {
  try {
    const [gameName, tagLine] = riotId.split('#')
    const url = RIOT_API_ENDPOINTS.accountByRiotId(gameName, tagLine, RIOT_API_CONFIG.routing)
    
    await delay(200) // Rate limit: 20 req/s - increased for safety
    const response = await api.get(url)
    return response.data
  } catch (error: any) {
    console.error(`Error fetching account for ${riotId}:`, error.response?.data || error.message)
    return null
  }
}

export async function getCurrentRankByPuuid(puuid: string) {
  try {
    // Use the correct endpoint: GET /lol/league/v4/entries/by-puuid/{encryptedPUUID}
    const leagueUrl = RIOT_API_ENDPOINTS.leagueEntriesByPuuid(puuid, RIOT_API_CONFIG.region)
    
    await delay(100)
    const leagueResponse = await api.get(leagueUrl)
    
    // Find ranked solo/duo queue
    const rankedData = leagueResponse.data.find((queue: any) => queue.queueType === 'RANKED_SOLO_5x5')
    
    if (rankedData) {
      console.log('✅ Rank found:', rankedData.tier, rankedData.rank, rankedData.leaguePoints, 'LP')
      return {
        tier: rankedData.tier,
        rank: rankedData.rank,
        lp: rankedData.leaguePoints,
      }
    }
    
    console.log('⚠️ No ranked solo/duo data found for this player')
    return undefined
  } catch (error: any) {
    console.error(`❌ Error fetching rank:`, error.response?.data || error.message)
    return undefined
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
    // Get current rank using the correct endpoint
    console.log(`\n=== Fetching stats for ${riotId} ===`)
    const currentRank = await getCurrentRankByPuuid(puuid)
    
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
        lpChange: 0,
        currentRank: currentRank || undefined,
        kda: 0,
        avgCS: 0,
        avgGameDuration: 0,
        mostPlayedChampion: {
          name: 'Unknown',
          icon: '',
          games: 0,
        },
        topChampions: [],
      }
    }

    let wins = 0
    let totalGames = 0  // Moved here to count only processed matches
    let totalKills = 0
    let totalDeaths = 0
    let totalAssists = 0
    let totalCS = 0
    let totalDuration = 0
    const championStats: ChampionStats = {}

    // Process matches in parallel batches for better performance
    const matchesToProcess = matchIds
    
    // Process in batches of 3 for rate limiting (20 req/s limit)
    // 3 req / 500ms = 6 req/s (safe margin)
    const matchDetailsBatch = await processBatch(
      matchesToProcess,
      3,
      async (matchId) => getMatchDetails(matchId),
      500
    )
    
    for (const matchDetails of matchDetailsBatch) {
      if (!matchDetails) continue

      // Filter: Only count Ranked games
      // Queue IDs: 420 (Ranked Solo/Duo), 440 (Ranked Flex)
      const queueId = matchDetails.info.queueId
      const validQueues = [420, 440] // Ranked Solo and Ranked Flex
      
      // Skip if queueId is missing or not in valid queues
      if (!queueId || !validQueues.includes(queueId)) continue

      const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
      
      if (!participant) continue

      // Count only successfully processed matches
      totalGames++
      
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

    // totalGames is now counted correctly above
    const losses = totalGames - wins
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists
    const avgCS = totalGames > 0 ? totalCS / totalGames : 0
    const avgGameDuration = totalGames > 0 ? totalDuration / totalGames / 60 : 0
    
    // Calculate REAL LP change using rank snapshots
    const monthStr = `${new Date(startTime).getFullYear()}-${String(new Date(startTime).getMonth() + 1).padStart(2, '0')}`
    
    // Buscar snapshot do início do período
    let previousRank = getRankSnapshot(puuid, monthStr)
    
    // Se não houver snapshot, salvar o rank atual como baseline
    if (!previousRank && currentRank) {
      saveRankSnapshot(puuid, monthStr, currentRank)
      previousRank = currentRank
    }
    
    // Calcular mudança real de LP
    const lpChange = calculateLPChange(currentRank, previousRank)
    
    // Log para debug
    if (previousRank && currentRank) {
      console.log(`📊 LP Change para ${riotId}: ${previousRank.tier} ${previousRank.rank} ${previousRank.lp}LP → ${currentRank.tier} ${currentRank.rank} ${currentRank.lp}LP = ${lpChange > 0 ? '+' : ''}${lpChange} LP`)
    }

    // Find most played champion
    let mostPlayedChampion = {
      name: 'Unknown',
      icon: '',
      games: 0,
    }

    // Get top 3 most played champions
    const sortedChampions = Object.entries(championStats)
      .sort(([, a], [, b]) => b.games - a.games)
      .slice(0, 3)
      .map(([champName, stats]) => ({
        name: champName,
        icon: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champName}.png`,
        games: stats.games,
      }))

    // Keep mostPlayedChampion for backward compatibility
    if (sortedChampions.length > 0) {
      mostPlayedChampion = sortedChampions[0]
    }

    return {
      summonerName: riotId.split('#')[0],
      puuid,
      riotId,
      winRate: parseFloat(winRate.toFixed(2)),
      totalGames,
      wins,
      losses,
      lpChange,
      currentRank: currentRank || undefined,
      kda: parseFloat(kda.toFixed(2)),
      avgCS: parseFloat(avgCS.toFixed(1)),
      avgGameDuration: parseFloat(avgGameDuration.toFixed(2)),
      mostPlayedChampion,
      topChampions: sortedChampions,
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

