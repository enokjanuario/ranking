import axios from 'axios'
import { Redis } from '@upstash/redis'
import { RIOT_API_CONFIG, RIOT_API_ENDPOINTS, DDRAGON_VERSION, PLAYER_ROLES } from './constants'
import { RiotMatchDetails, PlayerStats, ChampionStats } from '@/types'
import { calculateLPChange, rankToAbsoluteLP } from './lpCalculator'
import { saveRankSnapshot, getRankSnapshot } from './rankSnapshot'
import { scrapeAllPlayerStats, ScrapedPlayerStats } from './scrapers'
import { trackRequest, getTracker, log } from './requestTracker'
import { 
  getMonthlyStats, 
  saveMonthlyStats 
} from './supabase-stats'
import { 
  getProcessedMatches, 
  saveProcessedMatch,
  isMatchProcessed 
} from './supabase-matches'
import { 
  getMatchHistoryCache, 
  saveMatchHistoryCache 
} from './supabase-cache'
import { isSupabaseConfigured } from './supabase'

const api = axios.create({
  headers: {
    'X-Riot-Token': RIOT_API_CONFIG.key,
  },
})

// Add delay between requests to respect rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry logic with exponential backoff for rate limits
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000,
  requestType: string = 'API'
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn()
      trackRequest(requestType, false, i > 0)
      return result
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) 
          : baseDelay * Math.pow(2, i)
        
        log(`Rate limited (429), aguardando ${retryAfter}s antes de retry ${i + 1}/${retries}`, '⏳')
        trackRequest(requestType, false, true)
        await delay(retryAfter * 1000)
      } else if (i === retries - 1) {
        trackRequest(requestType, false, true)
        throw error
      } else {
        trackRequest(requestType, false, true)
        await delay(baseDelay * Math.pow(2, i))
      }
    }
  }
  throw new Error('Max retries exceeded')
}

// Batch processing with rate limiting and retry logic
async function processBatch<T>(
  items: string[],
  batchSize: number,
  processor: (item: string) => Promise<T>,
  delayMs: number = 200
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchPromises = batch.map(item => 
      fetchWithRetry(() => processor(item))
    )
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    if (i + batchSize < items.length) {
      await delay(delayMs)
    }
  }
  
  return results
}

// Cache híbrido de match details: L1 (memória) + L2 (Redis)
// L1: Cache rápido durante a mesma invocação
// L2: Cache persistente compartilhado entre invocações
const matchDetailsRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Cache L1 (memória) - apenas para a invocação atual
const matchDetailsCacheL1 = new Map<string, { data: RiotMatchDetails | null; timestamp: number; accessCount: number }>()
const MATCH_CACHE_TTL = 60 * 60 * 1000 // 1 hora (aumentado de 15 min - matches antigos não mudam)
const MATCH_CACHE_TTL_SECONDS = 60 * 60 // 1 hora em segundos
const MATCH_CACHE_KEY_PREFIX = 'ranking:match:'
const MAX_L1_CACHE_SIZE = 500 // Limite do cache L1 (memória)

// Limpar cache L1 baseado em LRU (Least Recently Used)
function cleanupL1Cache() {
  if (matchDetailsCacheL1.size <= MAX_L1_CACHE_SIZE) {
    return
  }
  
  const now = Date.now()
  const entries = Array.from(matchDetailsCacheL1.entries())
  
  // Remover itens expirados primeiro
  for (const [key, value] of entries) {
    if (now - value.timestamp > MATCH_CACHE_TTL) {
      matchDetailsCacheL1.delete(key)
    }
  }
  
  // Se ainda estiver acima do limite, remover os menos acessados (LRU)
  if (matchDetailsCacheL1.size > MAX_L1_CACHE_SIZE) {
    const sorted = Array.from(matchDetailsCacheL1.entries())
      .sort(([, a], [, b]) => a.accessCount - b.accessCount) // Menor accessCount primeiro
      .slice(0, matchDetailsCacheL1.size - MAX_L1_CACHE_SIZE) // Remover os menos usados
    
    for (const [key] of sorted) {
      matchDetailsCacheL1.delete(key)
    }
    
    console.log(`🧹 Limpeza L1 cache: removidos ${sorted.length} itens menos usados`)
  }
}

async function getCachedMatchDetails(matchId: string): Promise<RiotMatchDetails | null> {
  const now = Date.now()
  
  // 1. Verificar cache L1 (memória) primeiro
  const l1Cached = matchDetailsCacheL1.get(matchId)
  if (l1Cached && now - l1Cached.timestamp < MATCH_CACHE_TTL) {
    l1Cached.accessCount++ // Incrementar contador de acesso
    trackRequest('Match Details', true, false)
    return l1Cached.data
  }
  
  // 2. Verificar cache L2 (Redis)
  try {
    const redisKey = `${MATCH_CACHE_KEY_PREFIX}${matchId}`
    const l2Cached = await matchDetailsRedis.get<RiotMatchDetails | null>(redisKey)
    
    if (l2Cached !== null) {
      // Atualizar cache L1 com dados do Redis
      matchDetailsCacheL1.set(matchId, {
        data: l2Cached,
        timestamp: now,
        accessCount: 1,
      })
      cleanupL1Cache()
      trackRequest('Match Details', true, false)
      return l2Cached
    }
  } catch (error) {
    // Continuar para buscar da API se Redis falhar
  }
  
  // 3. Buscar da API (trackRequest já é chamado dentro de getMatchDetails)
  const details = await getMatchDetails(matchId)
  
  // 4. Salvar em ambos os caches
  matchDetailsCacheL1.set(matchId, {
    data: details,
    timestamp: now,
    accessCount: 1,
  })
  cleanupL1Cache()
  
  // Salvar no Redis (L2) com TTL
  try {
    const redisKey = `${MATCH_CACHE_KEY_PREFIX}${matchId}`
    await matchDetailsRedis.set(redisKey, details, { ex: MATCH_CACHE_TTL_SECONDS })
  } catch (error) {
    // Não falhar se Redis estiver indisponível
  }
  
  return details
}

export async function getAccountByRiotId(riotId: string) {
  try {
    const [gameName, tagLine] = riotId.split('#')
    const url = RIOT_API_ENDPOINTS.accountByRiotId(gameName, tagLine, RIOT_API_CONFIG.routing)

    // Delay otimizado para evitar rate limits (75ms = ~13 req/s com margem de segurança)
    await delay(75)
    const response = await fetchWithRetry(() => api.get(url), 3, 1000, 'Account Lookup')
    return response.data
  } catch (error: any) {
    const tracker = getTracker()
    if (tracker) {
      log(`Erro ao buscar account para ${riotId}: ${error.response?.data?.message || error.message}`, '❌')
    }
    return null
  }
}

export async function getCurrentRankByPuuid(puuid: string) {
  try {
    // Use the correct endpoint: GET /lol/league/v4/entries/by-puuid/{encryptedPUUID}
    const leagueUrl = RIOT_API_ENDPOINTS.leagueEntriesByPuuid(puuid, RIOT_API_CONFIG.region)

    // Delay otimizado para evitar rate limits
    await delay(75)
    const leagueResponse = await fetchWithRetry(() => api.get(leagueUrl), 3, 1000, 'Rank Lookup')
    
    // Find ranked solo/duo queue
    const rankedData = leagueResponse.data.find((queue: any) => queue.queueType === 'RANKED_SOLO_5x5')
    
    if (rankedData) {
      return {
        tier: rankedData.tier,
        rank: rankedData.rank,
        lp: rankedData.leaguePoints,
      }
    }
    
    return undefined
  } catch (error: any) {
    const tracker = getTracker()
    if (tracker) {
      log(`Erro ao buscar rank: ${error.response?.data?.message || error.message}`, '❌')
    }
    return undefined
  }
}

export async function getMatchHistory(puuid: string, startTime?: number, endTime?: number) {
  try {
    let start = 0
    let allMatches: string[] = []
    const batchSize = 100
    let requestCount = 0

    // Fetch matches in batches
    while (true) {
      let url = RIOT_API_ENDPOINTS.matchListByPuuid(puuid, RIOT_API_CONFIG.routing, start, batchSize)
      
      if (startTime) {
        url += `&startTime=${Math.floor(startTime / 1000)}`
      }
      if (endTime) {
        url += `&endTime=${Math.floor(endTime / 1000)}`
      }

      // Delay otimizado para evitar rate limits
      await delay(75)
      const response = await fetchWithRetry(() => api.get(url), 3, 1000, 'Match History')
      const matches = response.data
      requestCount++

      if (matches.length === 0) break
      
      allMatches = [...allMatches, ...matches]
      
      if (matches.length < batchSize) break
      
      start += batchSize
    }

    const tracker = getTracker()
    if (tracker && requestCount > 0) {
      log(`Match history: ${allMatches.length} matches encontrados em ${requestCount} requisições`, '📋')
    }

    return allMatches
  } catch (error: any) {
    const tracker = getTracker()
    if (tracker) {
      log(`Erro ao buscar match history: ${error.response?.data?.message || error.message}`, '❌')
    }
    return []
  }
}

export async function getMatchDetails(matchId: string): Promise<RiotMatchDetails | null> {
  try {
    const url = RIOT_API_ENDPOINTS.matchById(matchId, RIOT_API_CONFIG.routing)

    // Delay otimizado para evitar rate limits
    await delay(75)
    const response = await fetchWithRetry(() => api.get(url), 3, 1000, 'Match Details')
    return response.data
  } catch (error: any) {
    // Erro já é tratado no fetchWithRetry e trackRequest
    return null
  }
}

export async function calculatePlayerStats(
  riotId: string,
  puuid: string,
  startTime: number,
  endTime: number,
  useScraping: boolean = true // Flag para habilitar/desabilitar scraping
): Promise<Omit<PlayerStats, 'position' | 'previousPosition'> | null> {
  const tracker = getTracker()
  try {
    log(`Iniciando busca de stats para ${riotId}`, '👤')
    
    // OTIMIZAÇÃO 1: Verificar se já temos stats pré-calculadas no Supabase
    if (isSupabaseConfigured()) {
      const monthStr = `${new Date(startTime).getFullYear()}-${String(new Date(startTime).getMonth() + 1).padStart(2, '0')}`
      log(`Verificando stats pré-calculadas no Supabase para ${monthStr}...`, '🗄️')
      
      const cachedStats = await getMonthlyStats(puuid, monthStr)
      if (cachedStats) {
        // VALIDAÇÃO: Só usar cache se os dados parecerem válidos
        // Se totalGames for 0 ou muito baixo, pode ser dados inválidos
        const totalGames = cachedStats.total_games || 0
        const wins = cachedStats.wins || 0
        const losses = cachedStats.losses || 0
        
        // Se não tem games válidos, não usar cache (recalcular)
        if (totalGames === 0 || (wins === 0 && losses === 0)) {
          log(`Stats no Supabase parecem inválidas (${totalGames} games), recalculando...`, '⚠️')
          // Continuar para calcular normalmente
        } else {
          log(`Stats encontradas no Supabase! Usando dados cacheados (${totalGames} games).`, '✅')
          
          // Converter de MonthlyStats para PlayerStats
          // Garantir que todos os valores numéricos sejam números válidos
          const safeNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined) return defaultValue
            const num = typeof value === 'string' ? parseFloat(value) : Number(value)
            return isNaN(num) ? defaultValue : num
          }
          
          return {
            summonerName: cachedStats.summoner_name || riotId.split('#')[0],
            puuid,
            riotId: cachedStats.riot_id || riotId,
            role: PLAYER_ROLES[riotId] || 'mid',
            winRate: safeNumber(cachedStats.win_rate, 0),
            totalGames: safeNumber(cachedStats.total_games, 0),
            wins: safeNumber(cachedStats.wins, 0),
            losses: safeNumber(cachedStats.losses, 0),
            lpChange: safeNumber(cachedStats.lp_change, 0),
            currentRank: cachedStats.current_rank as any,
            kda: safeNumber(cachedStats.kda, 0),
            avgCS: safeNumber(cachedStats.avg_cs, 0),
            avgVisionScore: safeNumber(cachedStats.avg_vision_score, 0),
            avgGameDuration: safeNumber(cachedStats.avg_game_duration, 0),
            mostPlayedChampion: cachedStats.top_champions?.[0] ? {
              name: cachedStats.top_champions[0].name || 'Unknown',
              icon: cachedStats.top_champions[0].icon || '',
              games: safeNumber(cachedStats.top_champions[0].games, 0),
            } : {
              name: 'Unknown',
              icon: '',
              games: 0,
            },
            topChampions: (cachedStats.top_champions || []).map((champ: any) => ({
              name: champ.name || 'Unknown',
              icon: champ.icon || '',
              games: safeNumber(champ.games, 0),
            })),
          }
        }
      }
    }
    
    // OTIMIZAÇÃO 2: Tentar scraping primeiro (mais rápido, menos requisições)
    if (useScraping) {
      try {
        log(`Tentando scraping para ${riotId}...`, '🔍')
        const scrapedStats = await scrapeAllPlayerStats(riotId)
        
        // Log detalhado do que foi retornado
        if (scrapedStats) {
          log(`Scraping retornou: totalGames=${scrapedStats.totalGames}, wins=${scrapedStats.wins}, losses=${scrapedStats.losses}, winRate=${scrapedStats.winRate}`, '🔍')
        } else {
          log(`Scraping retornou null/undefined`, '⚠️')
        }
        
        // Validação melhor: aceitar APENAS se tiver totalGames > 0 OU (wins + losses) > 0
        const hasValidData = scrapedStats && (
          (scrapedStats.totalGames && scrapedStats.totalGames > 0) ||
          (scrapedStats.wins !== undefined && scrapedStats.losses !== undefined && (scrapedStats.wins + scrapedStats.losses) > 0)
        )
        
        if (!hasValidData) {
          log(`Scraping retornou dados inválidos (totalGames=${scrapedStats?.totalGames}, wins=${scrapedStats?.wins}, losses=${scrapedStats?.losses}), usando Riot API...`, '⚠️')
          throw new Error('Scraping retornou dados inválidos')
        }
        
        // Se chegou aqui, tem dados válidos
        {
          // Garantir que totalGames está calculado
          if (!scrapedStats.totalGames && scrapedStats.wins !== undefined && scrapedStats.losses !== undefined) {
            scrapedStats.totalGames = scrapedStats.wins + scrapedStats.losses
          }
          
          // Validar novamente após calcular totalGames
          if (!scrapedStats.totalGames || scrapedStats.totalGames === 0) {
            log(`Scraping retornou 0 games, usando Riot API...`, '⚠️')
            throw new Error('Scraping retornou 0 games')
          }
          
          log(`Scraping bem-sucedido: ${scrapedStats.totalGames} games encontrados`, '✅')
          
          // Buscar rank atual da API (necessário para LP change)
          log(`Buscando rank atual para ${riotId}...`, '📊')
          const currentRank = await getCurrentRankByPuuid(puuid)
          
          // Calcular LP change usando snapshots
          const monthStr = `${new Date(startTime).getFullYear()}-${String(new Date(startTime).getMonth() + 1).padStart(2, '0')}`
          let previousRank = await getRankSnapshot(puuid, monthStr)
          
          if (!previousRank && currentRank) {
            await saveRankSnapshot(puuid, monthStr, currentRank)
            previousRank = currentRank
          }
          
          const lpChange = calculateLPChange(currentRank, previousRank)
          
          log(`Stats calculados: ${scrapedStats.totalGames} games, ${scrapedStats.winRate.toFixed(1)}% WR, ${lpChange > 0 ? '+' : ''}${lpChange} LP`, '✅')
          
          // Converter scraped stats para formato PlayerStats
          return {
            summonerName: scrapedStats.summonerName,
            puuid,
            riotId,
            role: PLAYER_ROLES[riotId] || 'mid',
            winRate: scrapedStats.winRate,
            totalGames: scrapedStats.totalGames,
            wins: scrapedStats.wins,
            losses: scrapedStats.losses,
            lpChange,
            currentRank: scrapedStats.currentRank || currentRank || undefined,
            kda: scrapedStats.kda,
            avgCS: scrapedStats.avgCS,
            avgVisionScore: scrapedStats.avgVisionScore,
            avgGameDuration: 0, // Scraping geralmente não tem isso
            mostPlayedChampion: scrapedStats.topChampions[0] ? {
              name: scrapedStats.topChampions[0].name,
              icon: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${scrapedStats.topChampions[0].name}.png`,
              games: scrapedStats.topChampions[0].games,
            } : {
              name: 'Unknown',
              icon: '',
              games: 0,
            },
            topChampions: scrapedStats.topChampions.slice(0, 3).map(champ => ({
              name: champ.name,
              icon: `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.name}.png`,
              games: champ.games,
            })),
          }
        }
      } catch (scrapingError: any) {
        log(`Scraping falhou para ${riotId}, usando Riot API: ${scrapingError.message}`, '⚠️')
        // Continuar para Riot API
      }
    }
    
    // FALLBACK: Usar Riot API (método original)
    log(`Usando Riot API para ${riotId} (scraping desabilitado ou falhou)`, '🔄')
    
    // Get current rank using the correct endpoint
    log(`Buscando rank atual para ${riotId}...`, '📊')
    const currentRank = await getCurrentRankByPuuid(puuid)
    
    // Get match history for the period
    // OTIMIZAÇÃO: Verificar cache do Supabase primeiro
    let matchIds: string[] = []
    
    if (isSupabaseConfigured()) {
      log(`Verificando cache de match history no Supabase...`, '🗄️')
      const cachedMatchIds = await getMatchHistoryCache(puuid, startTime, endTime)
      
      if (cachedMatchIds && cachedMatchIds.length > 0) {
        log(`${cachedMatchIds.length} match IDs encontrados no cache`, '✅')
        matchIds = cachedMatchIds
      } else {
        log(`Cache não encontrado, buscando da API...`, '🔄')
        matchIds = await getMatchHistory(puuid, startTime, endTime)
        
        // Salvar no cache para próxima vez
        if (matchIds.length > 0) {
          await saveMatchHistoryCache(puuid, startTime, endTime, matchIds)
          log(`Match history salvo no cache`, '💾')
        }
      }
    } else {
      matchIds = await getMatchHistory(puuid, startTime, endTime)
    }
    
    log(`${matchIds.length} matches encontrados para ${riotId}`, '📋')
    
    if (matchIds.length === 0) {
      log(`Nenhum match encontrado para ${riotId} no período`, '⚠️')
      return {
        summonerName: riotId.split('#')[0],
        puuid,
        riotId,
        role: PLAYER_ROLES[riotId] || 'mid',
        winRate: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        lpChange: 0,
        currentRank: currentRank || undefined,
        kda: 0,
        avgCS: 0,
        avgVisionScore: 0,
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
    let totalGames = 0  // Count only processed matches
    let totalKills = 0
    let totalDeaths = 0
    let totalAssists = 0
    let totalCS = 0
    let totalVisionScore = 0
    let totalDuration = 0
    const championStats: ChampionStats = {}
    let skippedMatches = 0

    // OTIMIZAÇÃO: Buscar matches do Supabase primeiro
    let processedMatchesFromDB: any[] = []
    let matchIdsToFetch: string[] = []
    
    if (isSupabaseConfigured() && matchIds.length > 0) {
      log(`Buscando matches processados do Supabase...`, '🗄️')
      processedMatchesFromDB = await getProcessedMatches(puuid, startTime, endTime)
      
      // Criar set de match IDs já processados
      const processedMatchIds = new Set(processedMatchesFromDB.map(m => m.match_id))
      
      // Filtrar apenas matches que ainda não foram processados
      matchIdsToFetch = matchIds.filter(id => !processedMatchIds.has(id))
      
      log(`${processedMatchesFromDB.length} matches do banco, ${matchIdsToFetch.length} precisam ser buscados da API`, '📊')
    } else {
      matchIdsToFetch = matchIds
    }
    
    // Buscar apenas matches que não estão no banco
    let matchDetailsBatch: (RiotMatchDetails | null)[] = []
    
    if (matchIdsToFetch.length > 0) {
      log(`Buscando ${matchIdsToFetch.length} matches da API em batches de 6...`, '⚙️')
      matchDetailsBatch = await processBatch(
        matchIdsToFetch,
        6, // Reduzido de 8 para 6 para evitar rate limits
        async (matchId) => {
          const details = await getCachedMatchDetails(matchId)

          // Salvar no Supabase após buscar
          if (details && isSupabaseConfigured()) {
            await saveProcessedMatch(matchId, puuid, details)
          }

          return details
        },
        250 // Aumentado de 150ms para 250ms para mais margem de segurança
      )
      
      log(`${matchDetailsBatch.length} match details processados da API`, '✅')
    }
    
    // Combinar matches do banco com matches da API
    const allMatchDetails: (RiotMatchDetails | null)[] = []
    
    // Adicionar matches do banco (convertidos para formato RiotMatchDetails)
    for (const dbMatch of processedMatchesFromDB) {
      // Converter formato do banco para RiotMatchDetails
      const participant = dbMatch.participant_data
      allMatchDetails.push({
        metadata: {
          matchId: dbMatch.match_id,
          participants: [puuid], // Simplificado
        },
        info: {
          queueId: dbMatch.queue_id,
          gameDuration: dbMatch.game_duration || 0,
          gameCreation: dbMatch.game_creation || 0,
          participants: [{
            puuid,
            summonerName: riotId.split('#')[0],
            championName: participant.champion_name,
            championId: 0, // Não armazenamos
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            win: participant.win,
            gameDuration: dbMatch.game_duration || 0,
            totalMinionsKilled: participant.total_minions_killed,
            neutralMinionsKilled: participant.neutral_minions_killed,
            visionScore: participant.vision_score,
          }],
        },
      } as RiotMatchDetails)
    }
    
    // Adicionar matches da API
    allMatchDetails.push(...matchDetailsBatch)
    
    log(`Total de ${allMatchDetails.length} matches para processar`, '📊')
    
    for (const matchDetails of allMatchDetails) {
      if (!matchDetails) {
        skippedMatches++
        continue
      }

      // Filter: Only count Ranked games
      // Queue IDs: 420 (Ranked Solo/Duo), 440 (Ranked Flex)
      const queueId = matchDetails.info.queueId
      const validQueues = [420, 440] // Ranked Solo and Ranked Flex
      
      // Skip if queueId is missing or not in valid queues
      if (!queueId || !validQueues.includes(queueId)) {
        skippedMatches++
        continue
      }

      const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
      
      if (!participant) {
        skippedMatches++
        continue
      }

      // Count only successfully processed matches
      totalGames++
      
      if (participant.win) wins++
      
      totalKills += participant.kills
      totalDeaths += participant.deaths
      totalAssists += participant.assists
      totalCS += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)
      totalVisionScore += participant.visionScore || 0
      totalDuration += matchDetails.info.gameDuration

      // Track champion stats
      const champName = participant.championName
      if (!championStats[champName]) {
        championStats[champName] = { games: 0, wins: 0 }
      }
      championStats[champName].games++
      if (participant.win) championStats[champName].wins++
    }

    log(`Matches após filtro: ${totalGames} válidos, ${skippedMatches} ignorados`, '📊')

    // totalGames is now counted correctly above
    const losses = totalGames - wins
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0
    const kda = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists
    const avgCS = totalGames > 0 ? totalCS / totalGames : 0
    const avgVisionScore = totalGames > 0 ? totalVisionScore / totalGames : 0
    const avgGameDuration = totalGames > 0 ? totalDuration / totalGames / 60 : 0
    
    // Validações de consistência
    if (totalGames !== wins + losses) {
      log(`INCONSISTÊNCIA: totalGames (${totalGames}) !== wins (${wins}) + losses (${losses})`, '⚠️')
    }
    if (winRate > 100 || winRate < 0) {
      log(`WinRate INVÁLIDO: ${winRate}%`, '⚠️')
    }
    
    // Calculate REAL LP change using rank snapshots
    log(`Calculando mudança de LP usando snapshots...`, '📊')
    const monthStr = `${new Date(startTime).getFullYear()}-${String(new Date(startTime).getMonth() + 1).padStart(2, '0')}`
    
    // Buscar snapshot do início do período (agora async)
    let previousRank = await getRankSnapshot(puuid, monthStr)
    
    // Se não houver snapshot E houver rank atual, precisamos buscar o rank do início do período
    // Por enquanto, se não houver snapshot, não assumimos o rank atual como baseline
    // (isso seria incorreto - o snapshot deve ser criado no primeiro dia do mês)
    if (!previousRank && currentRank) {
      log(`Nenhum snapshot encontrado para ${monthStr}, criando com rank atual (pode ser impreciso)`, '⚠️')
      await saveRankSnapshot(puuid, monthStr, currentRank)
      previousRank = currentRank
    }
    
    // Calcular mudança real de LP
    const lpChange = calculateLPChange(currentRank, previousRank)
    
    // Log detalhado para debug
    log(`Stats finais: ${totalGames} games, ${wins}W/${losses}L, ${winRate.toFixed(1)}% WR`, '📊')
    log(`KDA: ${kda.toFixed(2)} (${totalKills}K/${totalDeaths}D/${totalAssists}A)`, '📊')
    log(`CS: ${avgCS.toFixed(1)}, Vision: ${avgVisionScore.toFixed(1)}, Duração: ${avgGameDuration.toFixed(2)}min`, '📊')
    if (previousRank && currentRank) {
      log(`LP Change: ${previousRank.tier} ${previousRank.rank} ${previousRank.lp}LP → ${currentRank.tier} ${currentRank.rank} ${currentRank.lp}LP = ${lpChange > 0 ? '+' : ''}${lpChange} LP`, '📊')
    } else {
      log(`LP Change: Não foi possível calcular (previous: ${previousRank ? 'encontrado' : 'ausente'}, current: ${currentRank ? 'encontrado' : 'ausente'})`, '⚠️')
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
    
    // Salvar stats no Supabase para próxima vez
    // monthStr já foi definido acima, reutilizando
    
    if (isSupabaseConfigured()) {
      if (totalGames > 0) {
        log(`Salvando stats no Supabase para ${monthStr}...`, '💾')
        log(`   Dados: ${totalGames} games, ${wins}W/${losses}L, ${winRate.toFixed(1)}% WR, KDA ${kda.toFixed(2)}`, '💾')
        
        const statsToSave: Omit<PlayerStats, 'position' | 'previousPosition'> = {
          summonerName: riotId.split('#')[0],
          puuid,
          riotId,
          role: PLAYER_ROLES[riotId] || 'mid',
          winRate: parseFloat(winRate.toFixed(2)),
          totalGames,
          wins,
          losses,
          lpChange,
          currentRank: currentRank || undefined,
          kda: parseFloat(kda.toFixed(2)),
          avgCS: parseFloat(avgCS.toFixed(1)),
          avgVisionScore: parseFloat(avgVisionScore.toFixed(1)),
          avgGameDuration: parseFloat(avgGameDuration.toFixed(2)),
          mostPlayedChampion,
          topChampions: sortedChampions,
        }
        
        const saved = await saveMonthlyStats(puuid, monthStr, statsToSave)
        if (saved) {
          log(`Stats salvas no Supabase com sucesso`, '✅')
        } else {
          log(`Falha ao salvar stats no Supabase`, '❌')
        }
      } else {
        log(`Não salvando stats no Supabase: totalGames = ${totalGames} (inválido)`, '⚠️')
      }
    } else {
      log(`Supabase não configurado, não salvando stats`, '⚠️')
    }

    return {
      summonerName: riotId.split('#')[0],
      puuid,
      riotId,
      role: PLAYER_ROLES[riotId] || 'mid',
      winRate: parseFloat(winRate.toFixed(2)),
      totalGames,
      wins,
      losses,
      lpChange,
      currentRank: currentRank || undefined,
      kda: parseFloat(kda.toFixed(2)),
      avgCS: parseFloat(avgCS.toFixed(1)),
      avgVisionScore: parseFloat(avgVisionScore.toFixed(1)),
      avgGameDuration: parseFloat(avgGameDuration.toFixed(2)),
      mostPlayedChampion,
      topChampions: sortedChampions,
    }
  } catch (error: any) {
    const tracker = getTracker()
    if (tracker) {
      log(`Erro ao calcular stats para ${riotId}: ${error.message}`, '❌')
    }

    // FALLBACK FINAL: Tentar buscar dados do Supabase mesmo que sejam antigos
    // Isso é melhor do que não mostrar nada
    if (isSupabaseConfigured()) {
      try {
        const monthStr = `${new Date(startTime).getFullYear()}-${String(new Date(startTime).getMonth() + 1).padStart(2, '0')}`
        log(`Tentando fallback final: buscar stats antigos do Supabase para ${monthStr}...`, '🔄')

        const cachedStats = await getMonthlyStats(puuid, monthStr)
        if (cachedStats && cachedStats.total_games > 0) {
          log(`✅ Fallback bem-sucedido! Usando dados do Supabase (${cachedStats.total_games} games)`, '✅')

          const safeNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined) return defaultValue
            const num = typeof value === 'string' ? parseFloat(value) : Number(value)
            return isNaN(num) ? defaultValue : num
          }

          return {
            summonerName: cachedStats.summoner_name || riotId.split('#')[0],
            puuid,
            riotId: cachedStats.riot_id || riotId,
            role: PLAYER_ROLES[riotId] || 'mid',
            winRate: safeNumber(cachedStats.win_rate, 0),
            totalGames: safeNumber(cachedStats.total_games, 0),
            wins: safeNumber(cachedStats.wins, 0),
            losses: safeNumber(cachedStats.losses, 0),
            lpChange: safeNumber(cachedStats.lp_change, 0),
            currentRank: cachedStats.current_rank as any,
            kda: safeNumber(cachedStats.kda, 0),
            avgCS: safeNumber(cachedStats.avg_cs, 0),
            avgVisionScore: safeNumber(cachedStats.avg_vision_score, 0),
            avgGameDuration: safeNumber(cachedStats.avg_game_duration, 0),
            mostPlayedChampion: cachedStats.top_champions?.[0] ? {
              name: cachedStats.top_champions[0].name || 'Unknown',
              icon: cachedStats.top_champions[0].icon || '',
              games: safeNumber(cachedStats.top_champions[0].games, 0),
            } : {
              name: 'Unknown',
              icon: '',
              games: 0,
            },
            topChampions: (cachedStats.top_champions || []).map((champ: any) => ({
              name: champ.name || 'Unknown',
              icon: champ.icon || '',
              games: safeNumber(champ.games, 0),
            })),
          }
        }
      } catch (fallbackError: any) {
        log(`Fallback final falhou: ${fallbackError.message}`, '❌')
      }
    }

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

