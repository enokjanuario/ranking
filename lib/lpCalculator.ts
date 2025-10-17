// Sistema de cálculo de LP considerando mudanças de tier/division

export interface RankInfo {
  tier: string // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
  rank: string // IV, III, II, I (não usado em Master+)
  lp: number
}

// Mapa de tiers para valor base
const TIER_VALUES: { [key: string]: number } = {
  'IRON': 0,
  'BRONZE': 400,
  'SILVER': 800,
  'GOLD': 1200,
  'PLATINUM': 1600,
  'EMERALD': 2000,
  'DIAMOND': 2400,
  'MASTER': 2800,
  'GRANDMASTER': 3200,
  'CHALLENGER': 3600,
}

// Mapa de divisions para offset (dentro do tier)
const DIVISION_VALUES: { [key: string]: number } = {
  'IV': 0,
  'III': 100,
  'II': 200,
  'I': 300,
}

/**
 * Converte rank + LP para LP absoluto (comparável entre tiers)
 * 
 * Exemplo:
 * - Iron IV 50 LP = 50
 * - Iron III 0 LP = 100
 * - Bronze IV 0 LP = 400
 * - Silver II 75 LP = 1000 + 75 = 1075
 */
export function rankToAbsoluteLP(rank: RankInfo | undefined): number {
  if (!rank) {
    // Se não tem rank, considerar Unranked = 0
    return 0
  }

  const tierValue = TIER_VALUES[rank.tier.toUpperCase()] || 0
  
  // Master, Grandmaster e Challenger não têm divisions
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier.toUpperCase())) {
    return tierValue + rank.lp
  }

  const divisionValue = DIVISION_VALUES[rank.rank.toUpperCase()] || 0
  
  return tierValue + divisionValue + rank.lp
}

/**
 * Calcula a diferença de LP entre dois ranks
 * 
 * @param currentRank Rank atual do jogador
 * @param previousRank Rank anterior (início do período)
 * @returns Diferença de LP (pode ser negativa)
 */
export function calculateLPChange(
  currentRank: RankInfo | undefined,
  previousRank: RankInfo | undefined
): number {
  const currentLP = rankToAbsoluteLP(currentRank)
  const previousLP = rankToAbsoluteLP(previousRank)
  
  return currentLP - previousLP
}

/**
 * Formata a mudança de LP para exibição
 * 
 * @param lpChange Diferença de LP
 * @returns String formatada (ex: "+150 LP", "-50 LP")
 */
export function formatLPChange(lpChange: number): string {
  if (lpChange > 0) {
    return `+${lpChange}`
  } else if (lpChange < 0) {
    return `${lpChange}`
  }
  return '0'
}

/**
 * Converte LP absoluto de volta para descrição de rank
 * Útil para debug
 */
export function absoluteLPToRankDescription(absoluteLP: number): string {
  if (absoluteLP >= 3600) return `Challenger ${absoluteLP - 3600} LP`
  if (absoluteLP >= 3200) return `Grandmaster ${absoluteLP - 3200} LP`
  if (absoluteLP >= 2800) return `Master ${absoluteLP - 2800} LP`
  if (absoluteLP >= 2400) {
    const inTier = absoluteLP - 2400
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Diamond ${divName} ${lp} LP`
  }
  if (absoluteLP >= 2000) {
    const inTier = absoluteLP - 2000
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Emerald ${divName} ${lp} LP`
  }
  if (absoluteLP >= 1600) {
    const inTier = absoluteLP - 1600
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Platinum ${divName} ${lp} LP`
  }
  if (absoluteLP >= 1200) {
    const inTier = absoluteLP - 1200
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Gold ${divName} ${lp} LP`
  }
  if (absoluteLP >= 800) {
    const inTier = absoluteLP - 800
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Silver ${divName} ${lp} LP`
  }
  if (absoluteLP >= 400) {
    const inTier = absoluteLP - 400
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Bronze ${divName} ${lp} LP`
  }
  if (absoluteLP >= 0) {
    const inTier = absoluteLP
    const division = Math.floor(inTier / 100)
    const lp = inTier % 100
    const divName = ['IV', 'III', 'II', 'I'][division]
    return `Iron ${divName} ${lp} LP`
  }
  
  return 'Unranked'
}

