// Lista dos jogadores a serem trackados
// Format: "GameName#TagLine"
export const TRACKED_PLAYERS = [
  // Suas contas principais
  'Dorrows#0488',
  'Atziluth#537',
  'Gordaker#prata',
  
  // Adicione mais 12 jogadores aqui quando quiser expandir
  // Por enquanto, você pode começar só com essas 3 contas acima
  // Exemplos:
  // 'OutroJogador#BR1',
  // 'MaisUm#BR1',
]

// Mapeamento de RiotIDs para apelidos conhecidos
export const PLAYER_NICKNAMES: Record<string, string> = {
  'Atziluth#537': 'Bronziocre',
  'Gordaker#prata': 'JB Sniper',
  // Adicione mais apelidos aqui conforme necessário
  // 'RiotID#TAG': 'Apelido',
}

// Riot API Configuration
export const RIOT_API_CONFIG = {
  key: process.env.RIOT_API_KEY || '',
  region: process.env.RIOT_REGION || 'br1',
  routing: process.env.RIOT_ROUTING || 'americas',
}

// Data Dragon version for champion images
export const DDRAGON_VERSION = '13.24.1'

// API endpoints
export const RIOT_API_ENDPOINTS = {
  accountByRiotId: (gameName: string, tagLine: string, routing: string) => 
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
  summonerByPuuid: (puuid: string, region: string) => 
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
  matchListByPuuid: (puuid: string, routing: string, start: number, count: number) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
  matchById: (matchId: string, routing: string) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
}

