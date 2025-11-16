import { NextRequest, NextResponse } from 'next/server'
import { TRACKED_PLAYERS } from '@/lib/constants'
import { getAccountByRiotId, calculatePlayerStats, rankPlayers } from '@/lib/riotApi'
import { PlayerStats } from '@/types'
import { 
  getCache, 
  setCache, 
  getStagingCache,
  setStagingCache,
  promoteStagingToMain,
  getCacheOrStaging,
  initCache, 
  acquireUpdateLock, 
  releaseUpdateLock, 
  isUpdateInProgress, 
  waitForUpdate 
} from '@/lib/cache-redis'
import { startProcess, endProcess, startStep, trackError, log, logProgress } from '@/lib/requestTracker'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Inicializar cache ao carregar o módulo
initCache()

// Função para atualizar staging em background (não bloqueia resposta)
async function updateStagingInBackground(
  monthParam: string,
  startTime?: number,
  endTime?: number,
  period?: { start: string; end: string }
): Promise<void> {
  const tracker = startProcess(`Background Update - ${monthParam}`)
  
  try {
    startStep('Adquirir lock')
    const lockAcquired = await acquireUpdateLock(monthParam)
    
    if (!lockAcquired) {
      log(`Não foi possível atualizar staging para ${monthParam} (lock em uso)`, '⏸️')
      return
    }
    
    startStep('Buscar dados frescos')
    const rankedPlayers = await fetchFreshData(monthParam, startTime, endTime)
    
    startStep('Salvar staging cache')
    await setStagingCache(monthParam, rankedPlayers, period || { start: 'all-time', end: 'current' })
    
    log(`Staging cache atualizado em background para ${monthParam}`, '✅')
  } catch (error: any) {
    trackError('Background Update', error)
  } finally {
    await releaseUpdateLock(monthParam)
    endProcess()
  }
}

// Função para buscar dados frescos da API
async function fetchFreshData(monthParam: string, startTime?: number, endTime?: number) {
  startStep('Buscar accounts')
  log(`Buscando accounts para ${TRACKED_PLAYERS.length} jogadores...`, '📥')
  
  const accountPromises = TRACKED_PLAYERS.map(riotId => getAccountByRiotId(riotId))
  const accounts = await Promise.all(accountPromises)
  
  // Mapear accounts para puuids e identificar quais não foram encontrados
  const playerData = TRACKED_PLAYERS.map((riotId, index) => ({
    riotId,
    account: accounts[index],
  }))
  
  const foundAccounts = playerData.filter(p => p.account !== null)
  const missingAccounts = playerData.filter(p => p.account === null)
  
  log(`${foundAccounts.length}/${TRACKED_PLAYERS.length} accounts encontrados`, '✅')
  
  if (missingAccounts.length > 0) {
    log(`⚠️ Accounts não encontrados: ${missingAccounts.map(p => p.riotId).join(', ')}`, '⚠️')
  }
  
  const filteredPlayerData = foundAccounts
  
  if (filteredPlayerData.length === 0) {
    log('Nenhum account encontrado, abortando', '⚠️')
    return []
  }
  
  // OTIMIZAÇÃO: Processar jogadores em paralelo (mas com controle de concorrência)
  // Processar em batches de 3 para respeitar rate limits da Riot API
  startStep('Processar estatísticas dos jogadores')
  log(`Processando ${filteredPlayerData.length} jogadores em batches de 3...`, '🔄')

  const playerResults: Array<Omit<PlayerStats, 'position' | 'previousPosition'> | null> = []
  const batchSize = 3 // Reduzido de 4 para 3 para evitar rate limits
  
  for (let i = 0; i < filteredPlayerData.length; i += batchSize) {
    const batch = filteredPlayerData.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(filteredPlayerData.length / batchSize)
    
    log(`Processando batch ${batchNum}/${totalBatches} (${batch.map(p => p.riotId).join(', ')})`, '📦')
    
    const batchPromises = batch.map(async ({ riotId, account }) => {
      try {
        if (!account) {
          log(`Account not found for ${riotId}`, '⚠️')
          return null
        }

        // Calculate stats
        const stats = await calculatePlayerStats(riotId, account.puuid, startTime, endTime)
        return stats
      } catch (error: any) {
        trackError(`Processar ${riotId}`, error)
        return null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    playerResults.push(...batchResults)
    
    logProgress(i + batchResults.length, filteredPlayerData.length, 'jogadores')

    // Delay entre batches para não sobrecarregar e respeitar rate limits
    if (i + batchSize < filteredPlayerData.length) {
      await new Promise(resolve => setTimeout(resolve, 200)) // Aumentado de 100ms para 200ms
    }
  }

  const validPlayers = playerResults.filter(p => p !== null)
  const failedPlayers = filteredPlayerData.filter((_, index) => playerResults[index] === null)
  
  log(`${validPlayers.length}/${filteredPlayerData.length} jogadores processados com sucesso`, '✅')
  
  if (failedPlayers.length > 0) {
    log(`⚠️ Jogadores que falharam no processamento: ${failedPlayers.map(p => p.riotId).join(', ')}`, '⚠️')
  }
  
  if (validPlayers.length < TRACKED_PLAYERS.length) {
    const totalMissing = TRACKED_PLAYERS.length - validPlayers.length
    log(`⚠️ ATENÇÃO: ${totalMissing} de ${TRACKED_PLAYERS.length} jogadores não aparecerão na lista`, '⚠️')
  }

  // Rank players
  startStep('Rankear jogadores')
  const rankedPlayers = rankPlayers(validPlayers as any)
  log(`${rankedPlayers.length} jogadores rankeados`, '✅')
  
  return rankedPlayers
}

export async function GET(request: NextRequest) {
  const tracker = startProcess('Ranking API Request')

  try {
    startStep('Validar parâmetros')
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')
    const forceRefresh = searchParams.get('force') === 'true' // Parâmetro para forçar atualização

    // Se não especificar mês, usar "current" (ranking geral das últimas 100 partidas)
    const cacheKey = monthParam || 'current'
    const isGeneralRanking = !monthParam

    log(`${isGeneralRanking ? 'Ranking geral' : `Mês solicitado: ${monthParam}`}${forceRefresh ? ' (forçar atualização)' : ''}`, '📅')

    // Parse month parameter (format: YYYY-MM) ou usar undefined para ranking geral
    let startTime: number | undefined
    let endTime: number | undefined
    let period: { start: string; end: string }

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      startTime = new Date(year, month - 1, 1).getTime()
      endTime = new Date(year, month, 0, 23, 59, 59, 999).getTime()
      period = {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
      }
    } else {
      // Ranking geral: sem filtro de período
      period = {
        start: 'all-time',
        end: 'current',
      }
    }

    // DOUBLE BUFFERING: Verificar cache principal ou staging
    if (!forceRefresh) {
      startStep('Verificar cache')
      const cacheResult = await getCacheOrStaging(cacheKey)
      
      if (cacheResult.data) {
        log(`Cache encontrado: ${cacheResult.source}${cacheResult.isExpired ? ' (expirado)' : ''}`, '✅')
        
        // Se veio do staging e principal expirou, promover staging para principal
        if (cacheResult.source === 'staging' && cacheResult.isExpired) {
          startStep('Promover staging para principal')
          // Promover em background (não bloquear resposta)
          promoteStagingToMain(monthParam).catch(err => 
            trackError('Promover staging', err)
          )
        }
        
        // PRE-WARMING: Se cache principal está próximo de expirar (menos de 7 minutos),
        // iniciar atualização do staging em background
        if (cacheResult.source === 'main' && !cacheResult.isExpired) {
          const cacheAge = Date.now() - cacheResult.data.timestamp
          const PRE_WARM_THRESHOLD = 8 * 60 * 1000 // 8 minutos (7 min antes de expirar)

          if (cacheAge > PRE_WARM_THRESHOLD) {
            startStep('Pre-warming staging cache')
            // Verificar se staging já existe e está atualizado
            const stagingCache = await getStagingCache(cacheKey)
            const stagingAge = stagingCache ? Date.now() - stagingCache.timestamp : Infinity

            // Se staging não existe ou está mais antigo que o principal, atualizar em background
            if (!stagingCache || stagingAge > cacheAge) {
              // Iniciar atualização em background (não bloquear resposta)
              if (!(await isUpdateInProgress(cacheKey))) {
                log(`Pre-warming staging cache (principal expira em breve)`, '🔥')
                updateStagingInBackground(cacheKey, startTime, endTime, period).catch(err =>
                  trackError('Pre-warming', err)
                )
              }
            }
          }
        }
        
        endProcess()
        return NextResponse.json({
          success: true,
          players: cacheResult.data.players,
          period: cacheResult.data.period,
          cached: true,
          cachedAt: new Date(cacheResult.data.timestamp).toISOString(),
          source: cacheResult.source,
          isStale: cacheResult.isExpired,
        })
      } else {
        log('Cache não encontrado, buscando dados frescos', '🔄')
      }
    } else {
      log(`Forçando atualização para ${monthParam}`, '🔄')
    }

    // Se chegou aqui, não há cache válido nem staging
    // Verificar se já há uma atualização em progresso
    startStep('Verificar atualização em progresso')
    const updateInProgress = await isUpdateInProgress(cacheKey)

    if (updateInProgress) {
      log(`Atualização já em progresso para ${cacheKey}`, '⏸️')

      // STALE-WHILE-REVALIDATE: Tentar retornar cache expirado imediatamente
      // ao invés de aguardar a atualização terminar
      const expiredCacheResult = await getCacheOrStaging(cacheKey, true)

      if (expiredCacheResult.data) {
        log(`Retornando cache expirado enquanto atualização está em progresso (stale-while-revalidate)`, '⚡')
        endProcess()
        return NextResponse.json({
          success: true,
          players: expiredCacheResult.data.players,
          period: expiredCacheResult.data.period,
          cached: true,
          stale: true,
          cachedAt: new Date(expiredCacheResult.data.timestamp).toISOString(),
          source: expiredCacheResult.source,
          updateInProgress: true,
        })
      }

      // Se não tiver cache expirado, aguardar a atualização terminar
      log(`Cache expirado não disponível, aguardando atualização terminar...`, '⏳')
      await waitForUpdate(cacheKey)

      startStep('Buscar cache após espera')
      // Tentar pegar do cache ou staging novamente
      const cacheResult = await getCacheOrStaging(cacheKey)
      if (cacheResult.data) {
        // Promover staging se necessário
        if (cacheResult.source === 'staging' && cacheResult.isExpired) {
          await promoteStagingToMain(cacheKey)
          // Tentar pegar do principal novamente
          const mainCache = await getCache(cacheKey)
          if (mainCache) {
            endProcess()
            return NextResponse.json({
              success: true,
              players: mainCache.players,
              period: mainCache.period,
              cached: true,
              cachedAt: new Date(mainCache.timestamp).toISOString(),
              source: 'main',
              waitedForUpdate: true,
            })
          }
        }
        
        endProcess()
        return NextResponse.json({
          success: true,
          players: cacheResult.data.players,
          period: cacheResult.data.period,
          cached: true,
          cachedAt: new Date(cacheResult.data.timestamp).toISOString(),
          source: cacheResult.source,
          waitedForUpdate: true,
        })
      }
    }

    // Tentar adquirir lock para atualização
    startStep('Adquirir lock de atualização')
    const lockAcquired = await acquireUpdateLock(cacheKey)

    if (!lockAcquired) {
      log('Não foi possível adquirir lock, tentando retornar cache expirado (stale-while-revalidate)', '⚠️')
      // Se não conseguir lock, tentar retornar staging ou cache expirado
      const cacheResult = await getCacheOrStaging(cacheKey, true) // allowExpired=true
      if (cacheResult.data) {
        endProcess()
        return NextResponse.json({
          success: true,
          players: cacheResult.data.players,
          period: cacheResult.data.period,
          cached: true,
          stale: true,
          cachedAt: new Date(cacheResult.data.timestamp).toISOString(),
          source: cacheResult.source,
          updateInProgress: true,
        })
      }

      trackError('Lock', 'Update in progress and no stale cache available')
      endProcess()
      return NextResponse.json(
        { success: false, error: 'Update in progress, please try again' },
        { status: 503 }
      )
    }

    try {
      // Buscar dados frescos e salvar em STAGING primeiro
      log(`Iniciando busca de dados para ${cacheKey} (salvando em staging)`, '🚀')
      const rankedPlayers = await fetchFreshData(cacheKey, startTime, endTime)

      // Salvar no staging cache primeiro
      startStep('Salvar staging cache')
      await setStagingCache(cacheKey, rankedPlayers, period)

      // Promover staging para principal imediatamente
      startStep('Promover staging para principal')
      await promoteStagingToMain(cacheKey)

      endProcess()
      return NextResponse.json({
        success: true,
        players: rankedPlayers,
        period,
        cached: false,
        updatedAt: new Date().toISOString(),
        source: 'main',
      })
    } finally {
      // Sempre liberar o lock, mesmo se houver erro
      startStep('Liberar lock')
      await releaseUpdateLock(cacheKey)
    }
  } catch (error: any) {
    trackError('Ranking API', error)
    endProcess()
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

