// Sistema de cache com Redis (Upstash)
import { Redis } from '@upstash/redis'
import { PlayerStats } from '@/types'

interface CacheData {
  players: PlayerStats[]
  period: {
    start: string
    end: string
  }
  timestamp: number
  month: string
}

// Inicializar Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Duracao do cache em segundos (15 minutos)
const CACHE_DURATION_SECONDS = 15 * 60

// Duracao do lock em segundos (5 minutos - tempo maximo de atualizacao)
const LOCK_DURATION_SECONDS = 5 * 60

// Prefixos para chaves Redis
const CACHE_KEY_PREFIX = 'ranking:cache:'
const STAGING_CACHE_KEY_PREFIX = 'ranking:cache:staging:'
const LOCK_KEY_PREFIX = 'ranking:lock:'

// Inicializar cache (nao necessario com Redis)
export async function initCache() {
  try {
    // Testar conexao com Redis
    await redis.ping()
    console.log('✅ Redis conectado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao conectar com Redis:', error)
    throw error
  }
}

// Validar dados do cache
function validateCacheData(data: CacheData | null): boolean {
  if (!data || !data.players || !Array.isArray(data.players)) {
    return false
  }
  
  // Validar se pelo menos um jogador tem dados válidos
  const hasValidPlayer = data.players.some(player => {
    return player.totalGames > 0 && (player.wins > 0 || player.losses > 0)
  })
  
  return hasValidPlayer
}

// Obter dados do cache principal
export async function getCache(month: string): Promise<CacheData | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${month}`
    const cached = await redis.get<CacheData>(key)
    
    if (!cached) {
      console.log(`⚠️  Cache nao encontrado para ${month}`)
      return null
    }
    
    // Validar dados antes de retornar
    if (!validateCacheData(cached)) {
      console.log(`⚠️  Cache inválido para ${month} (dados corrompidos ou vazios), ignorando`)
      return null
    }
    
    const now = Date.now()
    const age = now - cached.timestamp
    const ageMinutes = Math.round(age / 1000 / 60)
    
    if (age > CACHE_DURATION_SECONDS * 1000) {
      console.log(`⏰ Cache expirado para ${month} (idade: ${ageMinutes}min)`)
      return null
    }
    
    const remainingMinutes = Math.round((CACHE_DURATION_SECONDS * 1000 - age) / 1000 / 60)
    console.log(`✅ Cache valido para ${month} (expira em ${remainingMinutes}min, ${cached.players.length} jogadores)`)
    return cached
  } catch (error) {
    console.error(`❌ Erro ao ler cache para ${month}:`, error)
    return null
  }
}

// Obter dados do cache de staging
export async function getStagingCache(month: string): Promise<CacheData | null> {
  try {
    const key = `${STAGING_CACHE_KEY_PREFIX}${month}`
    const cached = await redis.get<CacheData>(key)
    
    if (!cached) {
      return null
    }
    
    // Validar dados antes de retornar
    if (!validateCacheData(cached)) {
      console.log(`⚠️  Staging cache inválido para ${month} (dados corrompidos ou vazios), ignorando`)
      return null
    }
    
    console.log(`📦 Cache de staging encontrado para ${month} com ${cached.players.length} jogadores`)
    return cached
  } catch (error) {
    console.error(`❌ Erro ao ler staging cache para ${month}:`, error)
    return null
  }
}

// Salvar dados no cache de staging
export async function setStagingCache(
  month: string,
  players: PlayerStats[],
  period: { start: string; end: string }
): Promise<void> {
  try {
    const key = `${STAGING_CACHE_KEY_PREFIX}${month}`
    const data: CacheData = {
      players,
      period,
      timestamp: Date.now(),
      month,
    }
    
    // Staging cache tem TTL maior (30 minutos) para dar tempo de ser promovido
    await redis.set(key, data, { ex: CACHE_DURATION_SECONDS * 2 })
    
    console.log(`📦 Cache de staging atualizado para ${month} com ${players.length} jogadores`)
  } catch (error) {
    console.error(`❌ Erro ao salvar staging cache para ${month}:`, error)
    throw error
  }
}

// Promover staging cache para cache principal
export async function promoteStagingToMain(month: string): Promise<boolean> {
  try {
    const stagingKey = `${STAGING_CACHE_KEY_PREFIX}${month}`
    const mainKey = `${CACHE_KEY_PREFIX}${month}`
    
    const stagingData = await redis.get<CacheData>(stagingKey)
    
    if (!stagingData) {
      console.log(`⚠️  Nenhum staging cache para promover para ${month}`)
      return false
    }
    
    // Salvar staging como principal
    await redis.set(mainKey, stagingData, { ex: CACHE_DURATION_SECONDS })
    
    // Remover staging (opcional - pode deixar para expirar naturalmente)
    await redis.del(stagingKey)
    
    console.log(`🔄 Staging cache promovido para principal para ${month}`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao promover staging cache para ${month}:`, error)
    return false
  }
}

// Obter cache principal ou staging se principal expirou
export async function getCacheOrStaging(month: string, allowExpired: boolean = false): Promise<{
  data: CacheData | null
  source: 'main' | 'staging' | null
  isExpired: boolean
}> {
  try {
    // 1. Tentar cache principal primeiro
    const mainCache = await getCache(month)
    if (mainCache) {
      return { data: mainCache, source: 'main', isExpired: false }
    }

    // 2. Se principal expirou mas allowExpired=true, retornar mesmo expirado (stale-while-revalidate)
    if (allowExpired) {
      const key = `${CACHE_KEY_PREFIX}${month}`
      const expiredCache = await redis.get<CacheData>(key)

      if (expiredCache && validateCacheData(expiredCache)) {
        const age = Date.now() - expiredCache.timestamp
        const ageMinutes = Math.round(age / 1000 / 60)
        console.log(`⚠️ Retornando cache expirado para ${month} (idade: ${ageMinutes}min, stale-while-revalidate)`)
        return { data: expiredCache, source: 'main', isExpired: true }
      }
    }

    // 3. Se principal expirou ou não existe, verificar staging
    const stagingCache = await getStagingCache(month)
    if (stagingCache) {
      // Verificar se staging está completo (tem todos os jogadores esperados)
      // Por enquanto, assumimos que staging está completo se tem pelo menos 1 jogador
      const isComplete = stagingCache.players.length > 0

      if (isComplete) {
        console.log(`📦 Usando staging cache para ${month} (principal expirado)`)
        return { data: stagingCache, source: 'staging', isExpired: true }
      }
    }

    return { data: null, source: null, isExpired: true }
  } catch (error) {
    console.error(`❌ Erro ao obter cache ou staging para ${month}:`, error)
    return { data: null, source: null, isExpired: true }
  }
}

// Definir dados no cache
export async function setCache(
  month: string,
  players: PlayerStats[],
  period: { start: string; end: string }
): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${month}`
    const data: CacheData = {
      players,
      period,
      timestamp: Date.now(),
      month,
    }
    
    // Salvar com TTL automatico
    await redis.set(key, data, { ex: CACHE_DURATION_SECONDS })
    
    console.log(`💾 Cache atualizado no Redis para ${month} com ${players.length} jogadores`)
  } catch (error) {
    console.error(`❌ Erro ao salvar cache para ${month}:`, error)
    throw error
  }
}

// Limpar cache expirado (Redis faz automaticamente com TTL)
export function clearExpiredCache(): void {
  console.log('ℹ️  Redis limpa cache expirado automaticamente (TTL)')
}

// Verificar status do cache
export async function getCacheStatus(): Promise<{
  month: string
  age: number
  ageMinutes: number
  remainingMinutes: number
  isExpired: boolean
  playerCount: number
}[]> {
  try {
    // Buscar todas as chaves de cache
    const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`)
    const now = Date.now()
    
    const statuses = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get<CacheData>(key)
        if (!data) return null
        
        const age = now - data.timestamp
        const isExpired = age > CACHE_DURATION_SECONDS * 1000
        
        return {
          month: data.month,
          age,
          ageMinutes: Math.round(age / 1000 / 60),
          remainingMinutes: Math.round((CACHE_DURATION_SECONDS * 1000 - age) / 1000 / 60),
          isExpired,
          playerCount: data.players.length,
        }
      })
    )
    
    return statuses.filter(s => s !== null) as any[]
  } catch (error) {
    console.error('❌ Erro ao verificar status do cache:', error)
    return []
  }
}

// Forcar limpeza de todo o cache (principal e staging)
export async function clearAllCache(): Promise<void> {
  try {
    const mainKeys = await redis.keys(`${CACHE_KEY_PREFIX}*`)
    const stagingKeys = await redis.keys(`${STAGING_CACHE_KEY_PREFIX}*`)
    const allKeys = [...mainKeys, ...stagingKeys]
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys)
      console.log(`🗑️  ${allKeys.length} entradas de cache removidas (${mainKeys.length} principal, ${stagingKeys.length} staging)`)
    } else {
      console.log('ℹ️  Cache ja estava vazio')
    }
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error)
    throw error
  }
}

// ========================================
// SISTEMA DE MUTEX COM REDIS
// ========================================

// Verificar se uma atualizacao esta em progresso
export async function isUpdateInProgress(month: string): Promise<boolean> {
  try {
    const lockKey = `${LOCK_KEY_PREFIX}${month}`
    const lock = await redis.get(lockKey)
    return lock !== null
  } catch (error) {
    console.error('❌ Erro ao verificar lock:', error)
    return false
  }
}

// Adquirir lock para atualizacao (retorna true se conseguiu)
export async function acquireUpdateLock(month: string): Promise<boolean> {
  try {
    const lockKey = `${LOCK_KEY_PREFIX}${month}`
    
    // SET NX = Set if Not eXists (atomico!)
    const result = await redis.set(lockKey, Date.now().toString(), {
      nx: true, // Apenas se nao existir
      ex: LOCK_DURATION_SECONDS, // TTL de 5 minutos
    })
    
    if (result === 'OK') {
      console.log(`🔒 Lock adquirido para ${month}`)
      return true
    }
    
    console.log(`⏸️  Lock ja existe para ${month}, aguardando...`)
    return false
  } catch (error) {
    console.error('❌ Erro ao adquirir lock:', error)
    return false
  }
}

// Liberar lock de atualizacao
export async function releaseUpdateLock(month: string): Promise<void> {
  try {
    const lockKey = `${LOCK_KEY_PREFIX}${month}`
    await redis.del(lockKey)
    console.log(`🔓 Lock liberado para ${month}`)
  } catch (error) {
    console.error('❌ Erro ao liberar lock:', error)
  }
}

// Aguardar se houver atualizacao em progresso
export async function waitForUpdate(month: string): Promise<void> {
  const maxWaitTime = 60 * 1000 // 60 segundos
  const checkInterval = 2000 // 2 segundos
  const startTime = Date.now()
  
  while (await isUpdateInProgress(month)) {
    if (Date.now() - startTime > maxWaitTime) {
      console.log(`⏱️  Timeout aguardando atualizacao para ${month}`)
      break
    }
    
    console.log(`⏳ Aguardando atualizacao em progresso para ${month}...`)
    await new Promise(resolve => setTimeout(resolve, checkInterval))
  }
}

