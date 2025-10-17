import { NextResponse } from 'next/server'
import { clearAllCache } from '@/lib/cache'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Endpoint para limpar todo o cache (útil para forçar atualização completa)
export async function POST() {
  try {
    await clearAllCache()
    
    return NextResponse.json({
      success: true,
      message: 'Cache limpo com sucesso. Próximas requisições buscarão dados frescos.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

