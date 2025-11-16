// API Route para atualização automática via cron job
// Protegida por secret token para evitar chamadas não autorizadas

import { NextRequest, NextResponse } from 'next/server'
import { TRACKED_PLAYERS } from '@/lib/constants'
import { getAccountByRiotId, calculatePlayerStats, rankPlayers } from '@/lib/riotApi'
import { 
  setCache,
  setStagingCache,
  promoteStagingToMain,
  acquireUpdateLock, 
  releaseUpdateLock,
  isUpdateInProgress
} from '@/lib/cache-redis'
import { startProcess, endProcess, startStep, trackError, log } from '@/lib/requestTracker'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Secret token para proteger esta rota (definir em variáveis de ambiente)
const CRON_SECRET = process.env.CRON_SECRET || 'change-me-in-production'

// Função para buscar dados frescos
async function fetchFreshData(monthParam: string, startTime?: number, endTime?: number) {
  startStep('Buscar accounts')
  log(`Buscando accounts para ${TRACKED_PLAYERS.length} jogadores...`, '📥')
  
  const accountPromises = TRACKED_PLAYERS.map(riotId => getAccountByRiotId(riotId))
  const accounts = await Promise.all(accountPromises)
  
  const playerData = TRACKED_PLAYERS.map((riotId, index) => ({
    riotId,
    account: accounts[index],
  })).filter(p => p.account !== null)
  
  log(`${playerData.length}/${TRACKED_PLAYERS.length} accounts encontrados`, '✅')
  
  if (playerData.length === 0) {
    log('Nenhum account encontrado, abortando', '⚠️')
    return []
  }
  
  startStep('Processar estatísticas dos jogadores')
  log(`Processando ${playerData.length} jogadores em batches de 3...`, '🔄')

  const playerResults: Array<any> = []
  const batchSize = 3 // Reduzido de 4 para 3 para evitar rate limits
  
  for (let i = 0; i < playerData.length; i += batchSize) {
    const batch = playerData.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(playerData.length / batchSize)
    
    log(`Processando batch ${batchNum}/${totalBatches}`, '📦')
    
    const batchPromises = batch.map(async ({ riotId, account }) => {
      try {
        if (!account) return null
        const stats = await calculatePlayerStats(riotId, account.puuid, startTime, endTime)
        return stats
      } catch (error: any) {
        trackError(`Processar ${riotId}`, error)
        return null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    playerResults.push(...batchResults)

    // Delay entre batches para respeitar rate limits
    if (i + batchSize < playerData.length) {
      await new Promise(resolve => setTimeout(resolve, 200)) // Aumentado de 100ms para 200ms
    }
  }
  
  const validPlayers = playerResults.filter(p => p !== null)
  log(`${validPlayers.length}/${playerData.length} jogadores processados com sucesso`, '✅')
  
  startStep('Rankear jogadores')
  const rankedPlayers = rankPlayers(validPlayers as any)
  log(`${rankedPlayers.length} jogadores rankeados`, '✅')
  
  return rankedPlayers
}

// Retry logic para atualização
async function updateRankingWithRetry(monthParam: string, startTime: number | undefined, endTime: number | undefined, period: any, maxRetries: number = 2): Promise<{success: boolean, data?: any[], error?: string}> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`Tentativa ${attempt}/${maxRetries} de atualizar ranking para ${monthParam}`, '🔄')

      // Adquirir lock
      startStep('Adquirir lock')
      const lockAcquired = await acquireUpdateLock(monthParam)

      if (!lockAcquired) {
        log(`Não foi possível adquirir lock (tentativa ${attempt}/${maxRetries})`, '⏸️')
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Aguardar 5s antes de retry
          continue
        }
        return { success: false, error: 'Could not acquire lock after retries' }
      }

      try {
        // Buscar dados frescos
        startStep('Buscar dados frescos')
        const rankedPlayers = await fetchFreshData(monthParam, startTime, endTime)

        if (!rankedPlayers || rankedPlayers.length === 0) {
          log(`Nenhum jogador retornado (tentativa ${attempt}/${maxRetries})`, '⚠️')
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000))
            continue
          }
          return { success: false, error: 'No players returned after retries' }
        }

        // Salvar em staging primeiro
        startStep('Salvar staging cache')
        await setStagingCache(monthParam, rankedPlayers, period)

        // Promover staging para principal
        startStep('Promover staging para principal')
        await promoteStagingToMain(monthParam)

        log(`✅ Atualização bem-sucedida na tentativa ${attempt}/${maxRetries}`, '✅')
        return { success: true, data: rankedPlayers }
      } finally {
        await releaseUpdateLock(monthParam)
      }
    } catch (error: any) {
      log(`Erro na tentativa ${attempt}/${maxRetries}: ${error.message}`, '❌')
      if (attempt < maxRetries) {
        const delayMs = 3000 * attempt // Backoff exponencial: 3s, 6s
        log(`Aguardando ${delayMs/1000}s antes da próxima tentativa...`, '⏳')
        await new Promise(resolve => setTimeout(resolve, delayMs))
      } else {
        return { success: false, error: error.message }
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}

export async function GET(request: NextRequest) {
  // Verificar secret token
  const authHeader = request.headers.get('authorization')
  const secret = request.nextUrl.searchParams.get('secret')

  if (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const tracker = startProcess('Cron Job - Update Ranking')

  try {
    // Por padrão, atualizar ranking geral (sem filtro de mês)
    // Se quiser ranking mensal, passar ?month=YYYY-MM
    const monthParam = request.nextUrl.searchParams.get('month') || 'current'

    log(`Iniciando atualização automática para ${monthParam}`, '🤖')

    // Parse month parameter ou usar undefined para ranking geral
    let startTime: number | undefined
    let endTime: number | undefined
    let period: { start: string; end: string }

    if (monthParam !== 'current') {
      const [year, month] = monthParam.split('-').map(Number)
      startTime = new Date(year, month - 1, 1).getTime()
      endTime = new Date(year, month, 0, 23, 59, 59, 999).getTime()
      period = {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
      }
    } else {
      period = {
        start: 'all-time',
        end: 'current',
      }
    }
    
    // Verificar se já está em atualização
    if (await isUpdateInProgress(monthParam)) {
      log(`Atualização já em progresso para ${monthParam}`, '⏸️')
      endProcess()
      return NextResponse.json({
        success: true,
        message: 'Update already in progress',
        month: monthParam,
      })
    }

    // Usar função com retry
    const result = await updateRankingWithRetry(monthParam, startTime, endTime, period, 2)

    if (result.success) {
      log(`Atualização automática concluída para ${monthParam}`, '✅')
      endProcess()
      return NextResponse.json({
        success: true,
        message: 'Ranking updated successfully',
        month: monthParam,
        playersCount: result.data?.length || 0,
        updatedAt: new Date().toISOString(),
      })
    } else {
      log(`Atualização falhou após múltiplas tentativas: ${result.error}`, '❌')
      endProcess()
      return NextResponse.json({
        success: false,
        error: result.error || 'Update failed after retries',
        month: monthParam,
      }, { status: 500 })
    }
  } catch (error: any) {
    trackError('Cron Job', error)
    endProcess()
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

