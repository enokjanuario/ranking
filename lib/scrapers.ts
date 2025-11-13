// Sistema de scraping híbrido para dados de op.gg, u.gg e League of Graphs
// Usado como otimização/fallback para reduzir chamadas à Riot API

import axios from 'axios'
import { Redis } from '@upstash/redis'

// Delay entre requisições de scraping (respeitar rate limits dos sites)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Cache Redis para resultados de scraping
const scraperRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

const SCRAPER_CACHE_TTL = 60 * 60 // 1 hora (aumentado - dados de scraping mudam pouco)
const SCRAPER_CACHE_PREFIX = 'scraper:'

// User-Agent para evitar bloqueios
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const scraperClient = axios.create({
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  },
  timeout: 10000, // 10 segundos
})

// ========================================
// INTERFACES
// ========================================

export interface ScrapedPlayerStats {
  riotId: string
  summonerName: string
  currentRank?: {
    tier: string
    rank: string
    lp: number
  }
  winRate: number
  totalGames: number
  wins: number
  losses: number
  kda: number
  avgCS: number
  avgVisionScore: number
  topChampions: Array<{
    name: string
    games: number
    winRate: number
  }>
  // Stats avançadas
  avgDPM?: number // Damage per minute
  avgGPM?: number // Gold per minute
  avgGoldShare?: number
  avgDamageShare?: number
}

export interface ScrapedRankHistory {
  riotId: string
  month: string // YYYY-MM
  startRank?: {
    tier: string
    rank: string
    lp: number
  }
  endRank?: {
    tier: string
    rank: string
    lp: number
  }
  lpChange: number
}

export interface ScrapedMatchups {
  riotId: string
  champion: string
  matchups: Array<{
    vsChampion: string
    games: number
    winRate: number
  }>
}

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Normaliza RiotID para formato usado nos sites
 */
function normalizeRiotId(riotId: string): { gameName: string; tagLine: string } {
  const [gameName, tagLine] = riotId.split('#')
  return {
    gameName: gameName.trim(),
    tagLine: tagLine?.trim() || '',
  }
}

/**
 * Extrai número de string (ex: "1,234" -> 1234)
 */
function extractNumber(text: string): number {
  const cleaned = text.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Extrai porcentagem de string (ex: "65.5%" -> 65.5)
 */
function extractPercentage(text: string): number {
  const match = text.match(/(\d+\.?\d*)%?/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Converte tier/rank string para objeto
 */
function parseRank(rankText: string): { tier: string; rank: string; lp: number } | undefined {
  // Exemplos: "Gold I 75 LP", "Diamond III 0 LP", "Master 234 LP"
  const match = rankText.match(/(\w+)\s*(I{1,4}|IV|III|II|I)?\s*(\d+)?\s*LP/i)
  if (!match) return undefined

  const tier = match[1].toUpperCase()
  const rank = match[2] || ''
  const lp = match[3] ? parseInt(match[3]) : 0

  return { tier, rank, lp }
}

// ========================================
// OP.GG SCRAPER
// ========================================

/**
 * Busca estatísticas do jogador no op.gg
 * URL: https://www.op.gg/summoners/br/{gameName}-{tagLine}
 * 
 * Estratégias de parsing:
 * 1. Tentar extrair dados de JSON embutido (mais confiável)
 * 2. Fallback para regex/HTML parsing
 */
export async function scrapeOpGG(riotId: string): Promise<ScrapedPlayerStats | null> {
  try {
    const { gameName, tagLine } = normalizeRiotId(riotId)
    
    // op.gg usa formato: gameName-tagLine (sem #)
    const url = `https://www.op.gg/summoners/br/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`
    
    await delay(500) // Respeitar rate limit
    const response = await scraperClient.get(url)
    const html = response.data

    const stats: Partial<ScrapedPlayerStats> = {
      riotId,
      summonerName: gameName,
      topChampions: [],
    }

    // ESTRATÉGIA 1: Tentar extrair de JSON embutido (mais confiável)
    try {
      // op.gg geralmente tem dados em window.__OP_GG__ ou similar
      const jsonMatches = [
        html.match(/window\.__OP_GG__\s*=\s*({[\s\S]*?});/),
        html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/),
        html.match(/"summoner":\s*({[\s\S]*?})/),
      ]

      for (const match of jsonMatches) {
        if (!match) continue
        
        try {
          const data = JSON.parse(match[1])
          // Navegar pela estrutura (pode variar)
          if (data.summoner || data.summonerInfo) {
            const summoner = data.summoner || data.summonerInfo
            if (summoner.tier) {
              stats.currentRank = {
                tier: summoner.tier,
                rank: summoner.rank || '',
                lp: summoner.leaguePoints || 0,
              }
            }
            if (summoner.winRate !== undefined) stats.winRate = summoner.winRate
            if (summoner.wins !== undefined) stats.wins = summoner.wins
            if (summoner.losses !== undefined) stats.losses = summoner.losses
            if (summoner.totalGames !== undefined) stats.totalGames = summoner.totalGames
            if (summoner.kda !== undefined) stats.kda = summoner.kda
            if (summoner.avgCS !== undefined) stats.avgCS = summoner.avgCS
            if (summoner.avgVisionScore !== undefined) stats.avgVisionScore = summoner.avgVisionScore
            if (summoner.champions) {
              stats.topChampions = summoner.champions.slice(0, 3).map((champ: any) => ({
                name: champ.name || champ.championName,
                games: champ.games || champ.gameCount || 0,
                winRate: champ.winRate || 0,
              }))
            }
            break // Se encontrou dados, usar
          }
        } catch (e) {
          // Continuar para próxima estratégia
        }
      }
    } catch (e) {
      // Fallback para regex
    }

    // ESTRATÉGIA 2: Regex/HTML parsing (fallback)
    if (!stats.totalGames) {
      // Rank atual - múltiplos padrões
      const rankPatterns = [
        /<div[^>]*class="[^"]*tier[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<span[^>]*class="[^"]*tier[^"]*"[^>]*>([^<]+)<\/span>/i,
        /(Gold|Silver|Bronze|Platinum|Diamond|Master|Grandmaster|Challenger|Iron|Emerald)\s*(I{1,4}|IV|III|II|I)?\s*(\d+)?\s*LP/i,
      ]

      for (const pattern of rankPatterns) {
        const match = html.match(pattern)
        if (match) {
          const rankText = match[1] || match[0]
          const parsed = parseRank(rankText)
          if (parsed) {
            stats.currentRank = parsed
            break
          }
        }
      }

      // Win Rate e Games - múltiplos padrões
      const winRatePatterns = [
        /(\d+\.?\d*)%?\s*Win\s*Rate/i,
        /Win\s*Rate[^:]*:?\s*(\d+\.?\d*)%?/i,
        /"winRate":\s*(\d+\.?\d*)/i,
      ]

      for (const pattern of winRatePatterns) {
        const match = html.match(pattern)
        if (match) {
          stats.winRate = extractPercentage(match[1] || match[0])
          break
        }
      }

      // Wins/Losses
      const winsMatch = html.match(/(\d+)\s*Wins?/i) || html.match(/"wins":\s*(\d+)/i)
      const lossesMatch = html.match(/(\d+)\s*Losses?/i) || html.match(/"losses":\s*(\d+)/i)
      
      if (winsMatch) stats.wins = extractNumber(winsMatch[1])
      if (lossesMatch) stats.losses = extractNumber(lossesMatch[1])
      if (stats.wins && stats.losses) {
        stats.totalGames = stats.wins + stats.losses
      }

      // KDA - múltiplos padrões
      const kdaPatterns = [
        /KDA[^:]*:?\s*(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/i,
        /(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)\s*KDA/i,
        /"kda":\s*(\d+\.?\d*)/i,
      ]

      for (const pattern of kdaPatterns) {
        const match = html.match(pattern)
        if (match) {
          if (match[1] && match[2] && match[3]) {
            const kills = parseFloat(match[1])
            const deaths = parseFloat(match[2])
            const assists = parseFloat(match[3])
            stats.kda = deaths > 0 ? (kills + assists) / deaths : kills + assists
          } else if (match[1]) {
            stats.kda = parseFloat(match[1])
          }
          break
        }
      }

      // CS médio
      const csPatterns = [
        /CS[^:]*:?\s*(\d+\.?\d*)/i,
        /"avgCS":\s*(\d+\.?\d*)/i,
        /Creep\s*Score[^:]*:?\s*(\d+\.?\d*)/i,
      ]

      for (const pattern of csPatterns) {
        const match = html.match(pattern)
        if (match) {
          stats.avgCS = extractNumber(match[1])
          break
        }
      }

      // Vision Score
      const visionPatterns = [
        /Vision[^:]*:?\s*(\d+\.?\d*)/i,
        /"avgVisionScore":\s*(\d+\.?\d*)/i,
        /Vision\s*Score[^:]*:?\s*(\d+\.?\d*)/i,
      ]

      for (const pattern of visionPatterns) {
        const match = html.match(pattern)
        if (match) {
          stats.avgVisionScore = extractNumber(match[1])
          break
        }
      }
    }

    // Validar se conseguiu dados suficientes (mais flexível)
    // Aceitar se tiver wins/losses OU winRate OU totalGames
    const hasValidData = (stats.totalGames && stats.totalGames > 0) ||
                         (stats.wins !== undefined && stats.losses !== undefined) ||
                         (stats.winRate !== undefined && stats.winRate > 0)
    
    if (!hasValidData) {
      console.log(`⚠️ [op.gg] Dados insuficientes para ${riotId}`)
      return null
    }

    // Garantir que totalGames está calculado
    if (!stats.totalGames && stats.wins !== undefined && stats.losses !== undefined) {
      stats.totalGames = stats.wins + stats.losses
    }
    
    // Garantir que winRate está calculado se não estiver
    if (!stats.winRate && stats.wins !== undefined && stats.losses !== undefined && stats.totalGames) {
      stats.winRate = (stats.wins / stats.totalGames) * 100
    }

    console.log(`✅ [op.gg] Stats encontrados para ${riotId}: ${stats.totalGames || 0} games, ${stats.winRate || 0}% WR`)
    return stats as ScrapedPlayerStats
  } catch (error: any) {
    console.error(`❌ [op.gg] Erro ao buscar ${riotId}:`, error.message)
    return null
  }
}

/**
 * Busca histórico de rank no op.gg (gráfico de LP)
 */
export async function scrapeOpGGRankHistory(
  riotId: string,
  month: string
): Promise<ScrapedRankHistory | null> {
  try {
    const { gameName, tagLine } = normalizeRiotId(riotId)
    const url = `https://www.op.gg/summoners/br/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`
    
    await delay(500)
    const response = await scraperClient.get(url)
    const html = response.data

    // Buscar dados do gráfico de LP (geralmente em JSON dentro do HTML)
    const graphDataMatch = html.match(/window\.__OP_GG__\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/)
    if (graphDataMatch) {
      try {
        const data = JSON.parse(graphDataMatch[1])
        // Navegar pela estrutura de dados do op.gg para encontrar histórico
        // (estrutura pode variar, precisa ser ajustada)
        console.log(`✅ [op.gg] Dados do gráfico encontrados para ${riotId}`)
      } catch (e) {
        console.log(`⚠️ [op.gg] Erro ao parsear dados do gráfico para ${riotId}`)
      }
    }

    // Fallback: tentar extrair rank do início do mês do HTML
    // (implementação simplificada - pode precisar de ajustes)
    
    return null // Por enquanto retorna null, precisa de mais pesquisa na estrutura
  } catch (error: any) {
    console.error(`❌ [op.gg] Erro ao buscar histórico para ${riotId}:`, error.message)
    return null
  }
}

// ========================================
// LEAGUE OF GRAPHS SCRAPER
// ========================================

/**
 * Busca estatísticas avançadas no League of Graphs
 * URL: https://www.leagueofgraphs.com/summoner/br/{gameName}-{tagLine}
 */
export async function scrapeLeagueOfGraphs(riotId: string): Promise<Partial<ScrapedPlayerStats> | null> {
  try {
    const { gameName, tagLine } = normalizeRiotId(riotId)
    const url = `https://www.leagueofgraphs.com/summoner/br/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`
    
    await delay(500)
    const response = await scraperClient.get(url)
    const html = response.data

    const advancedStats: Partial<ScrapedPlayerStats> = {}

    // Damage per minute
    const dpmMatch = html.match(/Damage[^:]*per[^:]*minute[^:]*:?\s*(\d+\.?\d*)/i)
    if (dpmMatch) advancedStats.avgDPM = extractNumber(dpmMatch[1])

    // Gold per minute
    const gpmMatch = html.match(/Gold[^:]*per[^:]*minute[^:]*:?\s*(\d+\.?\d*)/i)
    if (gpmMatch) advancedStats.avgGPM = extractNumber(gpmMatch[1])

    // Gold share
    const goldShareMatch = html.match(/Gold[^:]*share[^:]*:?\s*(\d+\.?\d*)%?/i)
    if (goldShareMatch) advancedStats.avgGoldShare = extractPercentage(goldShareMatch[1])

    // Damage share
    const damageShareMatch = html.match(/Damage[^:]*share[^:]*:?\s*(\d+\.?\d*)%?/i)
    if (damageShareMatch) advancedStats.avgDamageShare = extractPercentage(damageShareMatch[1])

    if (Object.keys(advancedStats).length === 0) {
      console.log(`⚠️ [LoG] Nenhuma stat avançada encontrada para ${riotId}`)
      return null
    }

    console.log(`✅ [LoG] Stats avançadas encontradas para ${riotId}`)
    return advancedStats
  } catch (error: any) {
    console.error(`❌ [LoG] Erro ao buscar ${riotId}:`, error.message)
    return null
  }
}

// ========================================
// U.GG SCRAPER
// ========================================

/**
 * Busca matchups no u.gg
 * URL: https://u.gg/lol/profile/br1/{gameName}/{tagLine}
 */
export async function scrapeUGG(riotId: string): Promise<ScrapedMatchups[] | null> {
  try {
    const { gameName, tagLine } = normalizeRiotId(riotId)
    const url = `https://u.gg/lol/profile/br1/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    
    await delay(500)
    const response = await scraperClient.get(url)
    const html = response.data

    const matchups: ScrapedMatchups[] = []

    // u.gg geralmente tem dados em JSON embutido
    const jsonDataMatch = html.match(/window\.__UGG__\s*=\s*({[\s\S]*?});/)
    if (jsonDataMatch) {
      try {
        const data = JSON.parse(jsonDataMatch[1])
        // Navegar pela estrutura para encontrar matchups
        // (precisa ser ajustado conforme estrutura real)
        console.log(`✅ [u.gg] Dados encontrados para ${riotId}`)
      } catch (e) {
        console.log(`⚠️ [u.gg] Erro ao parsear dados para ${riotId}`)
      }
    }

    return matchups.length > 0 ? matchups : null
  } catch (error: any) {
    console.error(`❌ [u.gg] Erro ao buscar ${riotId}:`, error.message)
    return null
  }
}

// ========================================
// FUNÇÃO PRINCIPAL: SCRAPING HÍBRIDO
// ========================================

/**
 * Busca todas as estatísticas disponíveis via scraping
 * Tenta múltiplas fontes e combina resultados
 * Usa cache Redis para evitar requisições repetidas
 */
export async function scrapeAllPlayerStats(riotId: string): Promise<ScrapedPlayerStats | null> {
  try {
    // Verificar cache primeiro
    const cacheKey = `${SCRAPER_CACHE_PREFIX}${riotId}`
    const cached = await scraperRedis.get<ScrapedPlayerStats>(cacheKey)
    if (cached) {
      console.log(`✅ [Scraping] Cache hit para ${riotId}`)
      return cached
    }

    console.log(`🔍 Iniciando scraping para ${riotId}...`)

    // 1. Buscar stats básicas do op.gg (mais confiável)
    const opggStats = await scrapeOpGG(riotId)
    
    // 2. Buscar stats avançadas do League of Graphs
    const logStats = await scrapeLeagueOfGraphs(riotId)

    // 3. Combinar resultados
    if (!opggStats && !logStats) {
      console.log(`⚠️ Nenhum dado encontrado via scraping para ${riotId}`)
      return null
    }

    const combined: ScrapedPlayerStats = {
      ...opggStats,
      ...logStats,
      riotId,
      summonerName: opggStats?.summonerName || riotId.split('#')[0],
      topChampions: opggStats?.topChampions || [],
    } as ScrapedPlayerStats

    // Salvar no cache
    await scraperRedis.set(cacheKey, combined, { ex: SCRAPER_CACHE_TTL })

    console.log(`✅ Scraping concluído para ${riotId}`)
    return combined
  } catch (error: any) {
    console.error(`❌ Erro no scraping para ${riotId}:`, error.message)
    return null
  }
}

/**
 * Limpa cache de scraping (útil para forçar atualização)
 */
export async function clearScraperCache(riotId?: string): Promise<void> {
  try {
    if (riotId) {
      const cacheKey = `${SCRAPER_CACHE_PREFIX}${riotId}`
      await scraperRedis.del(cacheKey)
      console.log(`🗑️ Cache de scraping limpo para ${riotId}`)
    } else {
      const keys = await scraperRedis.keys(`${SCRAPER_CACHE_PREFIX}*`)
      if (keys.length > 0) {
        await scraperRedis.del(...keys)
        console.log(`🗑️ ${keys.length} entradas de cache de scraping removidas`)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao limpar cache de scraping:', error)
  }
}

