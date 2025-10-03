export interface PlayerStats {
  position: number
  summonerName: string
  puuid: string
  riotId: string
  winRate: number
  totalGames: number
  wins: number
  losses: number
  kda: number
  avgCS: number // average creep score per game
  avgGameDuration: number // in minutes
  lpChange: number // LP gained/lost in the period (estimated)
  mostPlayedChampion: {
    name: string
    icon: string
    games: number
  }
  topChampions: Array<{
    name: string
    icon: string
    games: number
  }>
  previousPosition?: number
}

export interface RiotMatchDetails {
  metadata: {
    matchId: string
    participants: string[]
  }
  info: {
    queueId?: number
    gameDuration: number
    gameCreation: number
    participants: RiotParticipant[]
  }
}

export interface RiotParticipant {
  puuid: string
  summonerName: string
  championName: string
  championId: number
  kills: number
  deaths: number
  assists: number
  win: boolean
  gameDuration: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
}

export interface ChampionStats {
  [championName: string]: {
    games: number
    wins: number
  }
}

