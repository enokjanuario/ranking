// Lista dos jogadores a serem trackados
// Format: "GameName#TagLine"
export const TRACKED_PLAYERS = [
  // JG (3 Alunos)
  'Renecrodil0#br1',
  'mago do éter#BR01',
  'Biscoitao#kick',
  // ADC (3 Alunos)
  'DoraVentureira#ta on',
  'AvrilLavigne#bapho',
  'Vilão#0805',
  // TOP (3 Alunos)
  'shenzin#brabo',
  'Jubileuevez#BR1',
  'IROGAMES#br1',
  // SUP (4 Alunos)
  'SetFireToTheRain#drunk',
  'Sythshas#br1',
  'Audebaram#br1',
  'CLTThresh#CLT',
]

// Mapeamento de RiotIDs para apelidos conhecidos
export const PLAYER_NICKNAMES: Record<string, string> = {
  // Adicione apelidos aqui conforme necessário
  // 'RiotID#TAG': 'Apelido',
}

// Mapeamento de RiotIDs para roles (lanes)
export const PLAYER_ROLES: Record<string, 'top' | 'jungle' | 'mid' | 'bot' | 'suporte'> = {
  // JG
  'Renecrodil0#br1': 'jungle',
  'mago do éter#BR01': 'jungle',
  'Biscoitao#kick': 'jungle',
  // ADC
  'DoraVentureira#ta on': 'bot',
  'AvrilLavigne#bapho': 'bot',
  'Vilão#0805': 'bot',
  // TOP
  'shenzin#brabo': 'top',
  'Jubileuevez#BR1': 'top',
  'IROGAMES#br1': 'top',
  // SUP
  'SetFireToTheRain#drunk': 'suporte',
  'Sythshas#br1': 'suporte',
  'Audebaram#br1': 'suporte',
  'CLTThresh#CLT': 'suporte',
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
  // Get league entries directly by PUUID (correct endpoint!)
  leagueEntriesByPuuid: (puuid: string, region: string) =>
    `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
  matchListByPuuid: (puuid: string, routing: string, start: number, count: number) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
  matchById: (matchId: string, routing: string) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
}

