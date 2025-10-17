// Sistema de cache em memória com persistência
import { PlayerStats } from '@/types'
import { promises as fs } from 'fs'
import path from 'path'

interface CacheData {
  players: PlayerStats[]
  period: {
    start: string
    end: string
  }
  timestamp: number
  month: string
}

interface CacheStore {
  [key: string]: CacheData
}

// Cache em memória
let cache: CacheStore = {}

// Duração do cache em milissegundos (15 minutos)
const CACHE_DURATION = 15 * 60 * 1000

// Mutex para controlar atualizações concorrentes
let updateInProgress: string | null = null
const updateQueue: Map<string, Promise<any>> = new Map()

// Caminho para o arquivo de cache (opcional, para persistência entre restarts)
const CACHE_FILE_PATH = path.join(process.cwd(), '.cache', 'ranking-cache.json')

// Inicializar cache do arquivo (se existir)
export async function initCache() {
  // Skip file loading in serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('📦 Cache em memoria inicializado (ambiente serverless)')
    return
  }
  
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8')
    cache = JSON.parse(data)
    console.log('✅ Cache carregado do arquivo')
  } catch (error) {
    console.log('📦 Iniciando com cache vazio')
  }
}

// Salvar cache em arquivo (para persistência)
// Desabilitado em ambiente serverless (Vercel)
async function saveCache() {
  // Skip file saving in serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('⏭️  Cache em arquivo desabilitado em ambiente serverless')
    return
  }
  
  try {
    await fs.mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true })
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2))
    console.log('💾 Cache salvo em arquivo')
  } catch (error) {
    console.error('❌ Erro ao salvar cache:', error)
  }
}

// Obter dados do cache
export function getCache(month: string): CacheData | null {
  const cached = cache[month]
  
  if (!cached) {
    console.log(`⚠️  Cache não encontrado para ${month}`)
    return null
  }
  
  const now = Date.now()
  const age = now - cached.timestamp
  
  if (age > CACHE_DURATION) {
    console.log(`⏰ Cache expirado para ${month} (idade: ${Math.round(age / 1000 / 60)}min)`)
    return null
  }
  
  const remainingMinutes = Math.round((CACHE_DURATION - age) / 1000 / 60)
  console.log(`✅ Cache válido para ${month} (expira em ${remainingMinutes}min)`)
  return cached
}

// Definir dados no cache
export async function setCache(
  month: string,
  players: PlayerStats[],
  period: { start: string; end: string }
): Promise<void> {
  cache[month] = {
    players,
    period,
    timestamp: Date.now(),
    month,
  }
  
  console.log(`💾 Cache atualizado para ${month} com ${players.length} jogadores`)
  
  // Salvar em arquivo para persistência
  await saveCache()
}

// Limpar cache expirado (útil para manutenção)
export function clearExpiredCache(): void {
  const now = Date.now()
  let cleared = 0
  
  Object.keys(cache).forEach((key) => {
    if (now - cache[key].timestamp > CACHE_DURATION) {
      delete cache[key]
      cleared++
    }
  })
  
  if (cleared > 0) {
    console.log(`🧹 Limpou ${cleared} entradas de cache expiradas`)
    saveCache()
  }
}

// Verificar status do cache (útil para debug)
export function getCacheStatus(): {
  month: string
  age: number
  ageMinutes: number
  remainingMinutes: number
  isExpired: boolean
  playerCount: number
}[] {
  const now = Date.now()
  
  return Object.entries(cache).map(([month, data]) => {
    const age = now - data.timestamp
    const isExpired = age > CACHE_DURATION
    
    return {
      month,
      age,
      ageMinutes: Math.round(age / 1000 / 60),
      remainingMinutes: Math.round((CACHE_DURATION - age) / 1000 / 60),
      isExpired,
      playerCount: data.players.length,
    }
  })
}

// Forçar limpeza de todo o cache (útil para forçar atualização)
export async function clearAllCache(): Promise<void> {
  cache = {}
  await saveCache()
  console.log('🗑️  Todo o cache foi limpo')
}

// Verificar se uma atualização está em progresso
export function isUpdateInProgress(month: string): boolean {
  return updateInProgress === month || updateQueue.has(month)
}

// Adquirir lock para atualização (retorna false se já houver update em progresso)
export function acquireUpdateLock(month: string): boolean {
  if (updateInProgress === month || updateQueue.has(month)) {
    console.log(`⏸️  Atualização para ${month} já em progresso, aguardando...`)
    return false
  }
  
  updateInProgress = month
  console.log(`🔒 Lock adquirido para ${month}`)
  return true
}

// Liberar lock de atualização
export function releaseUpdateLock(month: string): void {
  if (updateInProgress === month) {
    updateInProgress = null
    updateQueue.delete(month)
    console.log(`🔓 Lock liberado para ${month}`)
  }
}

// Aguardar se houver atualização em progresso
export async function waitForUpdate(month: string): Promise<void> {
  if (updateQueue.has(month)) {
    console.log(`⏳ Aguardando atualização em progresso para ${month}...`)
    await updateQueue.get(month)
  }
}

