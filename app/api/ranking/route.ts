import { NextRequest, NextResponse } from 'next/server'
import { TRACKED_PLAYERS } from '@/lib/constants'
import { getAccountByRiotId, calculatePlayerStats, rankPlayers } from '@/lib/riotApi'
import { getCache, setCache, initCache, acquireUpdateLock, releaseUpdateLock, isUpdateInProgress, waitForUpdate } from '@/lib/cache-redis'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Inicializar cache ao carregar o módulo
initCache()

// Função para buscar dados frescos da API
async function fetchFreshData(monthParam: string, startTime: number, endTime: number) {
  console.log(`🔄 Buscando dados frescos para ${monthParam}...`)
  
  // Fetch data for all tracked players
  const playerPromises = TRACKED_PLAYERS.map(async (riotId) => {
    try {
      // Get account info
      const account = await getAccountByRiotId(riotId)
      
      if (!account) {
        console.log(`Account not found for ${riotId}`)
        return null
      }

      // Calculate stats
      const stats = await calculatePlayerStats(riotId, account.puuid, startTime, endTime)
      
      return stats
    } catch (error) {
      console.error(`Error processing player ${riotId}:`, error)
      return null
    }
  })

  const playerResults = await Promise.all(playerPromises)
  const validPlayers = playerResults.filter(p => p !== null)

  // Rank players
  const rankedPlayers = rankPlayers(validPlayers as any)
  
  return rankedPlayers
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')
    const forceRefresh = searchParams.get('force') === 'true' // Parâmetro para forçar atualização

    if (!monthParam) {
      return NextResponse.json({ success: false, error: 'Month parameter is required' }, { status: 400 })
    }

    // Parse month parameter (format: YYYY-MM)
    const [year, month] = monthParam.split('-').map(Number)
    
    // Calculate start and end timestamps for the month
    const startTime = new Date(year, month - 1, 1).getTime()
    const endTime = new Date(year, month, 0, 23, 59, 59, 999).getTime()

    const period = {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
    }

    // Verificar cache primeiro (a menos que forceRefresh seja true)
    if (!forceRefresh) {
      const cachedData = await getCache(monthParam)
      
      if (cachedData) {
        console.log(`✅ Retornando dados do cache para ${monthParam}`)
        return NextResponse.json({
          success: true,
          players: cachedData.players,
          period: cachedData.period,
          cached: true,
          cachedAt: new Date(cachedData.timestamp).toISOString(),
        })
      }
    } else {
      console.log(`🔄 Forçando atualização para ${monthParam}`)
    }

    // Verificar se já há uma atualização em progresso
    if (await isUpdateInProgress(monthParam)) {
      console.log(`⏸️  Atualização já em progresso para ${monthParam}, aguardando...`)
      
      // Aguardar a atualização em progresso terminar
      await waitForUpdate(monthParam)
      
      // Tentar pegar do cache novamente
      const cachedData = await getCache(monthParam)
      if (cachedData) {
        return NextResponse.json({
          success: true,
          players: cachedData.players,
          period: cachedData.period,
          cached: true,
          cachedAt: new Date(cachedData.timestamp).toISOString(),
          waitedForUpdate: true,
        })
      }
    }

    // Tentar adquirir lock para atualização
    if (!(await acquireUpdateLock(monthParam))) {
      // Se não conseguir lock, retornar cache (mesmo expirado) ou erro
      const cachedData = await getCache(monthParam)
      if (cachedData) {
        return NextResponse.json({
          success: true,
          players: cachedData.players,
          period: cachedData.period,
          cached: true,
          stale: true,
          cachedAt: new Date(cachedData.timestamp).toISOString(),
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Update in progress, please try again' },
        { status: 503 }
      )
    }

    try {
      // Se não houver cache válido, buscar dados frescos
      console.log(`🚀 Iniciando busca de dados para ${monthParam}`)
      const rankedPlayers = await fetchFreshData(monthParam, startTime, endTime)

      // Salvar no cache
      await setCache(monthParam, rankedPlayers, period)

      return NextResponse.json({
        success: true,
        players: rankedPlayers,
        period,
        cached: false,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      // Sempre liberar o lock, mesmo se houver erro
      await releaseUpdateLock(monthParam)
    }
  } catch (error: any) {
    console.error('Error in ranking API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

