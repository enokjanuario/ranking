// Health check endpoint para monitorar status do sistema
import { NextRequest, NextResponse } from 'next/server'
import { getCache, getStagingCache, isUpdateInProgress } from '@/lib/cache-redis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const monthParam = request.nextUrl.searchParams.get('month') ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    // Verificar cache principal
    const mainCache = await getCache(monthParam)
    const stagingCache = await getStagingCache(monthParam)
    const updateInProgress = await isUpdateInProgress(monthParam)

    const now = Date.now()
    const CACHE_DURATION_MS = 15 * 60 * 1000 // 15 minutos

    let mainCacheStatus = null
    if (mainCache) {
      const age = now - mainCache.timestamp
      const ageMinutes = Math.round(age / 1000 / 60)
      const remainingMinutes = Math.round((CACHE_DURATION_MS - age) / 1000 / 60)

      mainCacheStatus = {
        exists: true,
        age: ageMinutes,
        remaining: remainingMinutes,
        isExpired: age > CACHE_DURATION_MS,
        playerCount: mainCache.players.length,
        timestamp: new Date(mainCache.timestamp).toISOString(),
      }
    }

    let stagingCacheStatus = null
    if (stagingCache) {
      const age = now - stagingCache.timestamp
      const ageMinutes = Math.round(age / 1000 / 60)

      stagingCacheStatus = {
        exists: true,
        age: ageMinutes,
        playerCount: stagingCache.players.length,
        timestamp: new Date(stagingCache.timestamp).toISOString(),
      }
    }

    // Determinar status geral do sistema
    let systemStatus = 'healthy'
    let message = 'Sistema operando normalmente'

    if (!mainCache && !stagingCache) {
      systemStatus = 'critical'
      message = 'Nenhum cache disponível! Sistema pode estar falhando.'
    } else if (mainCache && mainCacheStatus && mainCacheStatus.isExpired && !updateInProgress) {
      systemStatus = 'warning'
      message = 'Cache expirado e nenhuma atualização em progresso. Cron pode estar falhando.'
    } else if (updateInProgress) {
      systemStatus = 'updating'
      message = 'Atualização em progresso'
    } else if (mainCacheStatus && mainCacheStatus.remaining < 3) {
      systemStatus = 'warning'
      message = 'Cache próximo de expirar (< 3 minutos). Pre-warming deveria estar ativo.'
    }

    return NextResponse.json({
      success: true,
      status: systemStatus,
      message,
      month: monthParam,
      timestamp: new Date().toISOString(),
      cache: {
        main: mainCacheStatus || { exists: false },
        staging: stagingCacheStatus || { exists: false },
      },
      updateInProgress,
      recommendations: getRecommendations(mainCacheStatus, stagingCacheStatus, updateInProgress),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

function getRecommendations(
  mainCache: any,
  stagingCache: any,
  updateInProgress: boolean
): string[] {
  const recommendations: string[] = []

  if (!mainCache?.exists && !stagingCache?.exists) {
    recommendations.push('⚠️ CRÍTICO: Nenhum cache disponível. Verifique os logs do cron job.')
    recommendations.push('💡 Execute manualmente: GET /api/cron/update-ranking?secret=YOUR_SECRET')
  }

  if (mainCache?.exists && mainCache.isExpired && !updateInProgress) {
    recommendations.push('⚠️ Cache expirado sem atualização em progresso. Cron pode estar falhando.')
    recommendations.push('💡 Verifique se o cron está configurado corretamente no Vercel.')
    recommendations.push('💡 Verifique os logs do cron job para erros de rate limit.')
  }

  if (mainCache?.exists && mainCache.remaining < 3 && !stagingCache?.exists && !updateInProgress) {
    recommendations.push('⚠️ Cache próximo de expirar e nenhum staging preparado.')
    recommendations.push('💡 Pre-warming pode não estar funcionando. Verifique PRE_WARM_THRESHOLD.')
  }

  if (updateInProgress && mainCache?.isExpired) {
    recommendations.push('ℹ️ Atualização em progresso. Cache expirado sendo servido (stale-while-revalidate).')
  }

  if (!mainCache?.exists && stagingCache?.exists) {
    recommendations.push('ℹ️ Apenas staging disponível. Sistema vai promover automaticamente.')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema operando normalmente!')
  }

  return recommendations
}
