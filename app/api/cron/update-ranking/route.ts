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
async function fetchFreshData(monthParam: string, startTime: number, endTime: number) {
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
  log(`Processando ${playerData.length} jogadores em batches de 4...`, '🔄')
  
  const playerResults: Array<any> = []
  const batchSize = 4
  
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
    
    if (i + batchSize < playerData.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  const validPlayers = playerResults.filter(p => p !== null)
  log(`${validPlayers.length}/${playerData.length} jogadores processados com sucesso`, '✅')
  
  startStep('Rankear jogadores')
  const rankedPlayers = rankPlayers(validPlayers as any)
  log(`${rankedPlayers.length} jogadores rankeados`, '✅')
  
  return rankedPlayers
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
    // Obter mês atual ou mês especificado
    const monthParam = request.nextUrl.searchParams.get('month') || 
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    
    log(`Iniciando atualização automática para ${monthParam}`, '🤖')
    
    // Parse month parameter
    const [year, month] = monthParam.split('-').map(Number)
    const startTime = new Date(year, month - 1, 1).getTime()
    const endTime = new Date(year, month, 0, 23, 59, 59, 999).getTime()
    
    const period = {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
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
    
    // Adquirir lock
    startStep('Adquirir lock')
    const lockAcquired = await acquireUpdateLock(monthParam)
    
    if (!lockAcquired) {
      log(`Não foi possível adquirir lock para ${monthParam}`, '⚠️')
      endProcess()
      return NextResponse.json({
        success: false,
        error: 'Could not acquire lock',
        month: monthParam,
      })
    }
    
    try {
      // Buscar dados frescos
      startStep('Buscar dados frescos')
      const rankedPlayers = await fetchFreshData(monthParam, startTime, endTime)
      
      // Salvar em staging primeiro
      startStep('Salvar staging cache')
      await setStagingCache(monthParam, rankedPlayers, period)
      
      // Promover staging para principal
      startStep('Promover staging para principal')
      await promoteStagingToMain(monthParam)
      
      log(`Atualização automática concluída para ${monthParam}`, '✅')
      
      endProcess()
      return NextResponse.json({
        success: true,
        message: 'Ranking updated successfully',
        month: monthParam,
        playersCount: rankedPlayers.length,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      // Sempre liberar lock
      await releaseUpdateLock(monthParam)
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

