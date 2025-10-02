import { NextRequest, NextResponse } from 'next/server'
import { TRACKED_PLAYERS } from '@/lib/constants'
import { getAccountByRiotId, calculatePlayerStats, rankPlayers } from '@/lib/riotApi'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const monthParam = searchParams.get('month')

    if (!monthParam) {
      return NextResponse.json({ success: false, error: 'Month parameter is required' }, { status: 400 })
    }

    // Parse month parameter (format: YYYY-MM)
    const [year, month] = monthParam.split('-').map(Number)
    
    // Calculate start and end timestamps for the month
    const startTime = new Date(year, month - 1, 1).getTime()
    const endTime = new Date(year, month, 0, 23, 59, 59, 999).getTime()

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

    return NextResponse.json({
      success: true,
      players: rankedPlayers,
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error in ranking API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

