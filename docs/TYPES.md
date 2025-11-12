# 📦 TypeScript Types Reference

Documentação completa de todas as interfaces e tipos utilizados no projeto.

## 📋 Índice

- [Core Types](#core-types)
- [Riot API Types](#riot-api-types)
- [Cache Types](#cache-types)
- [Component Types](#component-types)
- [Utility Types](#utility-types)

---

## Core Types

### PlayerStats

Interface principal que representa um jogador no ranking.

```typescript
export interface PlayerStats {
  // Identificação
  position: number               // Posição no ranking (1, 2, 3...)
  summonerName: string          // Nome do invocador
  puuid: string                 // ID único da Riot
  riotId: string                // GameName#TagLine
  
  // Estatísticas de Jogo
  winRate: number               // Taxa de vitória (0-100)
  totalGames: number            // Total de partidas
  wins: number                  // Vitórias
  losses: number                // Derrotas
  kda: number                   // (Kills + Assists) / Deaths
  avgCS: number                 // CS médio por jogo
  avgGameDuration: number       // Duração média em minutos
  lpChange: number              // LP ganho/perdido no período
  
  // Rank Atual
  currentRank?: {
    tier: string                // IRON, BRONZE, SILVER, GOLD, etc.
    rank: string                // IV, III, II, I
    lp: number                  // League Points
  }
  
  // Campeões
  mostPlayedChampion: {
    name: string
    icon: string                // URL do ícone
    games: number               // Quantidade de jogos
  }
  
  topChampions: Array<{
    name: string
    icon: string
    games: number
  }>
  
  // Posição Anterior (para delta)
  previousPosition?: number
}
```

**Exemplo**:

```json
{
  "position": 1,
  "summonerName": "Dorrows",
  "puuid": "abc123-def456-ghi789",
  "riotId": "Dorrows#0488",
  "winRate": 62.5,
  "totalGames": 40,
  "wins": 25,
  "losses": 15,
  "kda": 3.45,
  "avgCS": 178.5,
  "avgGameDuration": 28.3,
  "lpChange": 225,
  "currentRank": {
    "tier": "GOLD",
    "rank": "I",
    "lp": 85
  },
  "mostPlayedChampion": {
    "name": "Yasuo",
    "icon": "https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png",
    "games": 15
  },
  "topChampions": [
    { "name": "Yasuo", "icon": "...", "games": 15 },
    { "name": "Zed", "icon": "...", "games": 12 },
    { "name": "Akali", "icon": "...", "games": 8 }
  ]
}
```

---

### RankInfo

Representa informações de rank de um jogador.

```typescript
export interface RankInfo {
  tier: string   // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, 
                 // DIAMOND, MASTER, GRANDMASTER, CHALLENGER
  rank: string   // IV, III, II, I (não usado em Master+)
  lp: number     // League Points (0-100 para divisões, ilimitado para Master+)
}
```

**Tiers Disponíveis**:

```typescript
type Tier = 
  | 'IRON' 
  | 'BRONZE' 
  | 'SILVER' 
  | 'GOLD' 
  | 'PLATINUM' 
  | 'EMERALD' 
  | 'DIAMOND' 
  | 'MASTER' 
  | 'GRANDMASTER' 
  | 'CHALLENGER'

type Division = 'IV' | 'III' | 'II' | 'I'
```

**Exemplo**:

```json
{
  "tier": "GOLD",
  "rank": "II",
  "lp": 45
}
```

---

### ChampionStats

Rastreia estatísticas de campeões jogados.

```typescript
export interface ChampionStats {
  [championName: string]: {
    games: number
    wins: number
  }
}
```

**Exemplo**:

```json
{
  "Yasuo": {
    "games": 15,
    "wins": 9
  },
  "Zed": {
    "games": 12,
    "wins": 8
  },
  "Akali": {
    "games": 8,
    "wins": 4
  }
}
```

---

## Riot API Types

### RiotMatchDetails

Estrutura completa de detalhes de uma partida da Riot API.

```typescript
export interface RiotMatchDetails {
  metadata: {
    matchId: string             // ID da partida (ex: "BR1_2847563210")
    participants: string[]      // Array de PUUIDs dos jogadores
  }
  info: {
    queueId?: number            // ID da fila (420=Solo, 440=Flex)
    gameDuration: number        // Duração em segundos
    gameCreation: number        // Timestamp de criação (ms)
    participants: RiotParticipant[]
  }
}
```

**Queue IDs Comuns**:

```typescript
const QUEUE_IDS = {
  400: 'Normal Draft',
  420: 'Ranked Solo/Duo',
  430: 'Normal Blind',
  440: 'Ranked Flex',
  450: 'ARAM',
  700: 'Clash',
  1700: 'Arena',
} as const
```

---

### RiotParticipant

Dados de um participante em uma partida.

```typescript
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
```

**Exemplo**:

```json
{
  "puuid": "abc123-def456-ghi789",
  "summonerName": "Dorrows",
  "championName": "Yasuo",
  "championId": 157,
  "kills": 12,
  "deaths": 5,
  "assists": 8,
  "win": true,
  "gameDuration": 1845,
  "totalMinionsKilled": 165,
  "neutralMinionsKilled": 15
}
```

---

### RiotAccount

Dados de conta da Riot.

```typescript
export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}
```

**Exemplo**:

```json
{
  "puuid": "abc123-def456-ghi789",
  "gameName": "Dorrows",
  "tagLine": "0488"
}
```

---

### RiotLeagueEntry

Dados de entrada na league (rank).

```typescript
export interface RiotLeagueEntry {
  queueType: string        // RANKED_SOLO_5x5, RANKED_FLEX_SR
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}
```

**Exemplo**:

```json
{
  "queueType": "RANKED_SOLO_5x5",
  "tier": "GOLD",
  "rank": "II",
  "leaguePoints": 45,
  "wins": 120,
  "losses": 98
}
```

---

## Cache Types

### CacheData

Estrutura de dados armazenada no Redis.

```typescript
interface CacheData {
  players: PlayerStats[]
  period: {
    start: string       // ISO 8601 (ex: "2025-10-01T00:00:00.000Z")
    end: string         // ISO 8601 (ex: "2025-10-31T23:59:59.999Z")
  }
  timestamp: number     // Unix timestamp em ms
  month: string         // Formato: YYYY-MM
}
```

**Exemplo**:

```json
{
  "players": [
    { "position": 1, "summonerName": "Dorrows", ... },
    { "position": 2, "summonerName": "Bronziocre", ... }
  ],
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-31T23:59:59.999Z"
  },
  "timestamp": 1729015200000,
  "month": "2025-10"
}
```

---

### RankSnapshot

Snapshot de rank inicial do mês para cálculo de LP change.

```typescript
interface RankSnapshot {
  puuid: string
  month: string      // Formato: YYYY-MM
  rank: RankInfo
  timestamp: number  // Quando foi criado
}
```

**Exemplo**:

```json
{
  "puuid": "abc123-def456-ghi789",
  "month": "2025-10",
  "rank": {
    "tier": "GOLD",
    "rank": "III",
    "lp": 60
  },
  "timestamp": 1727827200000
}
```

---

## Component Types

### HeaderProps

Props do componente Header.

```typescript
interface HeaderProps {
  selectedMonth: string         // Formato: YYYY-MM
  onMonthChange: (month: string) => void
  lastUpdate: Date             // Quando dados foram visualizados
  isCached?: boolean           // Se dados vieram do cache
  dataTimestamp?: Date | null  // Quando dados foram criados/atualizados
  nextUpdateIn?: number        // Segundos até próxima atualização
}
```

---

### PlayerTableProps

Props do componente PlayerTable.

```typescript
interface PlayerTableProps {
  players: PlayerStats[]
}
```

---

### StatsBarProps

Props do componente StatsBar.

```typescript
interface StatsBarProps {
  value: number
  max: number
  color?: string      // Classe Tailwind (default: 'bg-neon-blue')
  showValue?: boolean // Exibir valor numérico (default: false)
}
```

**Exemplo de Uso**:

```typescript
<StatsBar 
  value={player.winRate} 
  max={100} 
  color="bg-green-400" 
  showValue={false}
/>
```

---

### LoadingSpinnerProps

Props do componente LoadingSpinner.

```typescript
interface LoadingSpinnerProps {
  message?: string  // Mensagem customizada (default: "Carregando...")
}
```

---

## Utility Types

### SortField

Campos disponíveis para ordenação na tabela.

```typescript
type SortField = 
  | 'position' 
  | 'summonerName' 
  | 'winRate' 
  | 'totalGames' 
  | 'wins'
  | 'kda' 
  | 'avgCS' 
  | 'avgGameDuration'
  | 'lpChange'
```

---

### SortOrder

Direção da ordenação.

```typescript
type SortOrder = 'asc' | 'desc'
```

---

### ApiResponse

Formato de resposta padrão da API.

```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  cachedAt?: string
  updatedAt?: string
}
```

**Exemplo de Sucesso**:

```json
{
  "success": true,
  "data": { ... },
  "cached": true,
  "cachedAt": "2025-10-15T14:30:00.000Z"
}
```

**Exemplo de Erro**:

```json
{
  "success": false,
  "error": "Month parameter is required"
}
```

---

### RankingApiResponse

Resposta específica do endpoint /api/ranking.

```typescript
interface RankingApiResponse {
  success: boolean
  players?: PlayerStats[]
  period?: {
    start: string
    end: string
  }
  cached?: boolean
  cachedAt?: string
  updatedAt?: string
  error?: string
}
```

---

### CacheStatusResponse

Resposta do endpoint /api/cache-status.

```typescript
interface CacheStatusResponse {
  success: boolean
  cacheEntries: Array<{
    month: string
    age: number              // Idade em ms
    ageMinutes: number       // Idade em minutos
    remainingMinutes: number // Minutos até expirar
    isExpired: boolean
    playerCount: number
  }>
  cacheInfo: {
    cacheDurationMinutes: number
    description: string
  }
}
```

---

## Constants Types

### TrackedPlayers

Tipo para lista de jogadores rastreados.

```typescript
type TrackedPlayers = readonly string[]  // Array de "GameName#TagLine"
```

---

### PlayerNicknames

Tipo para mapeamento de apelidos.

```typescript
type PlayerNicknames = Record<string, string>  // RiotId → Apelido
```

**Exemplo**:

```typescript
const PLAYER_NICKNAMES: PlayerNicknames = {
  'Atziluth#537': 'Bronziocre',
  'Gordaker#prata': 'JB Sniper',
}
```

---

### RiotApiConfig

Configuração da Riot API.

```typescript
interface RiotApiConfig {
  key: string      // API key
  region: string   // br1, na1, euw1, etc.
  routing: string  // americas, europe, asia, sea
}
```

---

## Type Guards

Funções utilitárias para verificação de tipos em runtime.

### isValidRankInfo

```typescript
function isValidRankInfo(rank: any): rank is RankInfo {
  return (
    typeof rank === 'object' &&
    typeof rank.tier === 'string' &&
    typeof rank.rank === 'string' &&
    typeof rank.lp === 'number'
  )
}
```

### isValidPlayerStats

```typescript
function isValidPlayerStats(player: any): player is PlayerStats {
  return (
    typeof player === 'object' &&
    typeof player.position === 'number' &&
    typeof player.summonerName === 'string' &&
    typeof player.puuid === 'string' &&
    typeof player.riotId === 'string'
  )
}
```

---

## Enums

### Tier Enum

```typescript
enum Tier {
  IRON = 'IRON',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  EMERALD = 'EMERALD',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER',
  CHALLENGER = 'CHALLENGER',
}
```

### Division Enum

```typescript
enum Division {
  IV = 'IV',
  III = 'III',
  II = 'II',
  I = 'I',
}
```

---

## Type Assertions

### Exemplo de Uso

```typescript
// Asserção de tipo
const player = data as PlayerStats

// Type guard
if (isValidPlayerStats(data)) {
  // TypeScript sabe que data é PlayerStats aqui
  console.log(data.summonerName)
}

// Optional chaining
const lp = player.currentRank?.lp ?? 0

// Non-null assertion (use com cuidado!)
const name = player.currentRank!.tier
```

---

## Partial Types

Tipos parciais úteis para updates:

```typescript
// Player sem posição (antes de rankear)
type UnrankedPlayer = Omit<PlayerStats, 'position' | 'previousPosition'>

// Player update (campos opcionais)
type PlayerUpdate = Partial<PlayerStats> & { puuid: string }

// Required rank
type RankedPlayer = PlayerStats & { currentRank: RankInfo }
```

---

## Generic Types

### Exemplos de uso de genéricos:

```typescript
// Função genérica de retry
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  // Implementation
}

// Uso
const account = await withRetry<RiotAccount>(
  () => getAccountByRiotId(riotId),
  3
)
```

---

## Type Definitions Location

Todos os tipos principais estão definidos em:

```
types/index.ts
```

Para importar:

```typescript
import { PlayerStats, RankInfo, ChampionStats } from '@/types'
```

---

**Próximo**: [Formulas Reference](./FORMULAS.md) | [Voltar ao Índice](./README.md)

