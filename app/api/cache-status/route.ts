import { NextResponse } from 'next/server'
import { getCacheStatus } from '@/lib/cache'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Endpoint para verificar status do cache
export async function GET() {
  try {
    const status = getCacheStatus()
    
    return NextResponse.json({
      success: true,
      cacheEntries: status,
      cacheInfo: {
        cacheDurationMinutes: 15,
        description: 'Cache automaticamente atualizado a cada 15 minutos',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

