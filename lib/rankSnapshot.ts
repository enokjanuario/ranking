// Sistema de snapshot de rank inicial do período para cálculo preciso de LP
import { RankInfo } from './lpCalculator'

interface RankSnapshot {
  puuid: string
  month: string // formato: YYYY-MM
  rank: RankInfo
  timestamp: number
}

// Cache em memória dos snapshots
let rankSnapshots: { [key: string]: RankSnapshot } = {}

/**
 * Gera chave única para snapshot
 */
function getSnapshotKey(puuid: string, month: string): string {
  return `${puuid}:${month}`
}

/**
 * Salva snapshot do rank inicial do jogador no período
 */
export function saveRankSnapshot(puuid: string, month: string, rank: RankInfo): void {
  const key = getSnapshotKey(puuid, month)
  
  // Apenas salva se ainda não existe snapshot para este mês
  if (!rankSnapshots[key]) {
    rankSnapshots[key] = {
      puuid,
      month,
      rank,
      timestamp: Date.now(),
    }
    console.log(`📸 Snapshot salvo: ${puuid} em ${month} - ${rank.tier} ${rank.rank} ${rank.lp} LP`)
  }
}

/**
 * Obtém o snapshot do rank inicial do jogador no período
 * Retorna undefined se não houver snapshot
 */
export function getRankSnapshot(puuid: string, month: string): RankInfo | undefined {
  const key = getSnapshotKey(puuid, month)
  return rankSnapshots[key]?.rank
}

/**
 * Remove snapshots antigos (meses anteriores ao especificado)
 */
export function cleanOldSnapshots(currentMonth: string): void {
  const [year, month] = currentMonth.split('-').map(Number)
  const currentDate = new Date(year, month - 1, 1).getTime()
  
  let removed = 0
  Object.keys(rankSnapshots).forEach(key => {
    const snapshot = rankSnapshots[key]
    const [snapYear, snapMonth] = snapshot.month.split('-').map(Number)
    const snapDate = new Date(snapYear, snapMonth - 1, 1).getTime()
    
    // Remove se for de mais de 2 meses atrás
    if (currentDate - snapDate > 60 * 24 * 60 * 60 * 1000) {
      delete rankSnapshots[key]
      removed++
    }
  })
  
  if (removed > 0) {
    console.log(`🧹 ${removed} snapshots antigos removidos`)
  }
}

/**
 * Obtém todos os snapshots (útil para debug)
 */
export function getAllSnapshots(): RankSnapshot[] {
  return Object.values(rankSnapshots)
}

/**
 * Limpa todos os snapshots
 */
export function clearAllSnapshots(): void {
  rankSnapshots = {}
  console.log('🗑️ Todos os snapshots foram limpos')
}

