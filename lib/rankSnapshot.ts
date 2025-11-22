// Sistema de snapshot de rank inicial do período para cálculo preciso de LP
import { RankInfo } from './lpCalculator'
import { Redis } from '@upstash/redis'

interface RankSnapshot {
  puuid: string
  month: string // formato: YYYY-MM
  rank: RankInfo
  timestamp: number
}

// Inicializar Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Prefixo para chaves Redis
const SNAPSHOT_KEY_PREFIX = 'ranking:snapshot:'
// TTL de 365 dias (snapshots devem persistir durante todo o campeonato)
const SNAPSHOT_TTL_SECONDS = 365 * 24 * 60 * 60

// Constantes do campeonato
export const COMPETITION_START = new Date('2025-11-24T03:00:00.000Z') // 00:00 BRT
export const COMPETITION_START_MONTH = '2025-11'

/**
 * Retorna a chave de snapshot correta baseada no mês
 * - Para novembro 2025: usa "competition_start" (baseline é 24/11 14h)
 * - Para outros meses: usa o início do mês (YYYY-MM)
 */
export function getSnapshotKeyForMonth(month: string): string {
  if (month === COMPETITION_START_MONTH) {
    return 'competition_start'
  }
  return month
}

/**
 * Gera chave única para snapshot
 */
function getSnapshotKey(puuid: string, month: string): string {
  return `${SNAPSHOT_KEY_PREFIX}${puuid}:${month}`
}

/**
 * Salva snapshot do rank inicial do jogador no período
 * Agora usando Redis para persistência em serverless
 */
export async function saveRankSnapshot(puuid: string, month: string, rank: RankInfo): Promise<void> {
  try {
    const key = getSnapshotKey(puuid, month)
    
    // Verificar se já existe snapshot para este mês
    const existing = await redis.get<RankSnapshot>(key)
    
    // Apenas salva se ainda não existe snapshot para este mês
    if (!existing) {
      const snapshot: RankSnapshot = {
        puuid,
        month,
        rank,
        timestamp: Date.now(),
      }
      
      await redis.set(key, snapshot, { ex: SNAPSHOT_TTL_SECONDS })
      console.log(`📸 Snapshot salvo no Redis: ${puuid} em ${month} - ${rank.tier} ${rank.rank} ${rank.lp} LP`)
    } else {
      console.log(`ℹ️  Snapshot já existe para ${puuid} em ${month}, mantendo original`)
    }
  } catch (error) {
    console.error(`❌ Erro ao salvar snapshot para ${puuid} em ${month}:`, error)
    // Não lançar erro - snapshot é importante mas não crítico
  }
}

/**
 * Obtém o snapshot do rank inicial do jogador no período
 * Retorna undefined se não houver snapshot
 * Agora usando Redis para persistência em serverless
 */
export async function getRankSnapshot(puuid: string, month: string): Promise<RankInfo | undefined> {
  try {
    const key = getSnapshotKey(puuid, month)
    const snapshot = await redis.get<RankSnapshot>(key)
    
    if (snapshot) {
      console.log(`📸 Snapshot encontrado: ${puuid} em ${month} - ${snapshot.rank.tier} ${snapshot.rank.rank} ${snapshot.rank.lp} LP`)
      return snapshot.rank
    }
    
    return undefined
  } catch (error) {
    console.error(`❌ Erro ao buscar snapshot para ${puuid} em ${month}:`, error)
    return undefined
  }
}

/**
 * Remove snapshots antigos (meses anteriores ao especificado)
 * Redis faz isso automaticamente com TTL, mas podemos limpar manualmente
 */
export async function cleanOldSnapshots(currentMonth: string): Promise<void> {
  try {
    const [year, month] = currentMonth.split('-').map(Number)
    const currentDate = new Date(year, month - 1, 1).getTime()
    
    const keys = await redis.keys(`${SNAPSHOT_KEY_PREFIX}*`)
    let removed = 0
    
    for (const key of keys) {
      const snapshot = await redis.get<RankSnapshot>(key)
      if (!snapshot) continue
      
      const [snapYear, snapMonth] = snapshot.month.split('-').map(Number)
      const snapDate = new Date(snapYear, snapMonth - 1, 1).getTime()
      
      // Remove se for de mais de 2 meses atrás
      if (currentDate - snapDate > 60 * 24 * 60 * 60 * 1000) {
        await redis.del(key)
        removed++
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 ${removed} snapshots antigos removidos`)
    }
  } catch (error) {
    console.error('❌ Erro ao limpar snapshots antigos:', error)
  }
}

/**
 * Obtém todos os snapshots (útil para debug)
 */
export async function getAllSnapshots(): Promise<RankSnapshot[]> {
  try {
    const keys = await redis.keys(`${SNAPSHOT_KEY_PREFIX}*`)
    const snapshots = await Promise.all(
      keys.map(key => redis.get<RankSnapshot>(key))
    )
    return snapshots.filter(s => s !== null) as RankSnapshot[]
  } catch (error) {
    console.error('❌ Erro ao buscar todos os snapshots:', error)
    return []
  }
}

/**
 * Limpa todos os snapshots
 */
export async function clearAllSnapshots(): Promise<void> {
  try {
    const keys = await redis.keys(`${SNAPSHOT_KEY_PREFIX}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ ${keys.length} snapshots removidos`)
    } else {
      console.log('ℹ️  Nenhum snapshot encontrado')
    }
  } catch (error) {
    console.error('❌ Erro ao limpar snapshots:', error)
    throw error
  }
}

/**
 * Gera lista de meses disponíveis para o filtro
 * Começa em novembro 2025 e vai até o mês atual
 */
export function getAvailableMonths(): string[] {
  const months: string[] = []
  const now = new Date()

  // Começar do mês de início do campeonato
  let current = new Date(2025, 10, 1) // Novembro 2025

  while (current <= now) {
    const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    months.push(monthStr)
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

/**
 * Verifica se precisa criar snapshot para o início de um novo mês
 * Retorna true se estamos no primeiro dia do mês e não existe snapshot
 */
export async function shouldCreateMonthlySnapshot(puuid: string, month: string): Promise<boolean> {
  // Não criar para novembro (usa competition_start)
  if (month === COMPETITION_START_MONTH) {
    return false
  }

  const key = getSnapshotKey(puuid, month)
  const existing = await redis.get<RankSnapshot>(key)

  return !existing
}

