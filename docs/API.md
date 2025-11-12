# 🌐 API Reference

Documentação completa das rotas da API e integração com Riot Games API.

## 📋 Índice

- [API Routes](#api-routes)
  - [GET /api/ranking](#get-apiranking)
  - [GET /api/cache-status](#get-apicache-status)
  - [POST /api/clear-cache](#post-apiclear-cache)
- [Riot API Integration](#riot-api-integration)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)

---

## API Routes

### GET /api/ranking

Endpoint principal que retorna o ranking de jogadores para um mês específico.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `month` | string | ✅ Yes | Mês no formato YYYY-MM | `2025-10` |
| `force` | string | ❌ No | Force cache refresh (`"true"`) | `true` |

#### Request Example

```bash
# Buscar ranking de outubro/2025
GET /api/ranking?month=2025-10

# Forçar atualização
GET /api/ranking?month=2025-10&force=true
```

#### Response Success (200)

```json
{
  "success": true,
  "players": [
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
        {
          "name": "Yasuo",
          "icon": "https://...",
          "games": 15
        }
      ]
    }
  ],
  "period": {
    "start": "2025-10-01T00:00:00.000Z",
    "end": "2025-10-31T23:59:59.999Z"
  },
  "cached": true,
  "cachedAt": "2025-10-15T14:30:00.000Z",
  "updatedAt": "2025-10-15T14:30:00.000Z"
}
```

#### Response Error (400 - Bad Request)

```json
{
  "success": false,
  "error": "Month parameter is required"
}
```

```json
{
  "success": false,
  "error": "Invalid month format"
}
```

#### Response Error (503 - Service Unavailable)

```json
{
  "success": false,
  "error": "Update in progress, please try again"
}
```

#### Response Error (500 - Internal Server Error)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### Processing Logic

```
1. Validate month parameter (format: YYYY-MM)
2. Calculate period startTime and endTime
3. IF forceRefresh=true:
   └─ Skip cache check
   ELSE:
   └─ Check cache (getCache)
       ├─ Valid cache? → Return data
       └─ Invalid → Continue
4. Check if update in progress
   ├─ Yes → Wait (waitForUpdate) → Retry cache
   └─ No → Continue
5. Try to acquire lock
   ├─ Success:
   │   ├─ Fetch fresh data (fetchFreshData)
   │   ├─ Save to cache (setCache)
   │   ├─ Release lock (releaseUpdateLock)
   │   └─ Return data
   └─ Failure:
       ├─ Stale cache exists? → Return with "stale" flag
       └─ No cache → Return error 503
```

---

### GET /api/cache-status

Retorna o status de todas as entradas de cache ativas.

#### Request Example

```bash
GET /api/cache-status
```

#### Response (200)

```json
{
  "success": true,
  "cacheEntries": [
    {
      "month": "2025-10",
      "age": 450000,
      "ageMinutes": 7,
      "remainingMinutes": 8,
      "isExpired": false,
      "playerCount": 3
    },
    {
      "month": "2025-09",
      "age": 950000,
      "ageMinutes": 15,
      "remainingMinutes": 0,
      "isExpired": true,
      "playerCount": 3
    }
  ],
  "cacheInfo": {
    "cacheDurationMinutes": 15,
    "description": "Cache automaticamente atualizado a cada 15 minutos"
  }
}
```

#### Use Cases

- Monitorar saúde do cache
- Verificar quando próxima atualização ocorrerá
- Debug de problemas de cache
- Dashboard administrativo

---

### POST /api/clear-cache

Limpa completamente o cache Redis. **Endpoint administrativo.**

#### Request Example

```bash
POST /api/clear-cache
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Cache limpo com sucesso. Próximas requisições buscarão dados frescos."
}
```

#### Response Error (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

#### Use Cases

- Forçar atualização completa dos dados
- Resolver cache corrompido
- Reset após mudanças em TRACKED_PLAYERS
- Desenvolvimento e testes

---

## Riot API Integration

### Endpoints Configurados

```typescript
// lib/constants.ts
export const RIOT_API_ENDPOINTS = {
  // Buscar conta por Riot ID (GameName#TagLine)
  accountByRiotId: (gameName: string, tagLine: string, routing: string) => 
    `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
  
  // Buscar summoner por PUUID
  summonerByPuuid: (puuid: string, region: string) => 
    `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
  
  // Buscar league entries (rank info)
  leagueEntriesByPuuid: (puuid: string, region: string) =>
    `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
  
  // Buscar histórico de partidas
  matchListByPuuid: (puuid: string, routing: string, start: number, count: number) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
  
  // Buscar detalhes de uma partida
  matchById: (matchId: string, routing: string) => 
    `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
}
```

### Routing Values

**Platform Routing** (para contas e matches):
- `americas` - BR, NA, LAN, LAS
- `europe` - EUW, EUNE, TR, RU
- `asia` - KR, JP
- `sea` - OCE, PH, SG, TH, TW, VN

**Regional Routing** (para dados específicos):
- `br1` - Brasil
- `na1` - North America
- `euw1` - Europe West
- `kr` - Korea

### Main Functions (lib/riotApi.ts)

#### 1. getAccountByRiotId

```typescript
async function getAccountByRiotId(riotId: string): Promise<{
  puuid: string
  gameName: string
  tagLine: string
} | null>
```

**Uso**: Converte Riot ID (GameName#TagLine) em PUUID

**Exemplo**:
```typescript
const account = await getAccountByRiotId("Dorrows#0488")
// Returns: { puuid: "abc123...", gameName: "Dorrows", tagLine: "0488" }
```

#### 2. getCurrentRankByPuuid

```typescript
async function getCurrentRankByPuuid(puuid: string): Promise<{
  tier: string   // IRON, BRONZE, SILVER, GOLD, etc.
  rank: string   // IV, III, II, I
  lp: number     // League Points
} | undefined>
```

**Filtro**: Apenas RANKED_SOLO_5x5 (ranked solo/duo)

**Exemplo**:
```typescript
const rank = await getCurrentRankByPuuid(puuid)
// Returns: { tier: "GOLD", rank: "II", lp: 45 }
```

#### 3. getMatchHistory

```typescript
async function getMatchHistory(
  puuid: string,
  startTime?: number,  // Unix timestamp em ms
  endTime?: number     // Unix timestamp em ms
): Promise<string[]>   // Array de match IDs
```

**Paginação**: Busca em lotes de 100 até não haver mais partidas

**Exemplo**:
```typescript
const matchIds = await getMatchHistory(puuid, startTime, endTime)
// Returns: ["BR1_2847563210", "BR1_2847521450", ...]
```

#### 4. getMatchDetails

```typescript
async function getMatchDetails(matchId: string): Promise<RiotMatchDetails | null>
```

**Nota**: Filtro de queue (420, 440) é aplicado posteriormente

**Exemplo**:
```typescript
const match = await getMatchDetails("BR1_2847563210")
// Returns: Full match data with participants, stats, etc.
```

#### 5. calculatePlayerStats

```typescript
async function calculatePlayerStats(
  riotId: string,
  puuid: string,
  startTime: number,
  endTime: number
): Promise<Omit<PlayerStats, 'position' | 'previousPosition'> | null>
```

**Processo**:
1. Busca rank atual
2. Busca histórico de partidas no período
3. Para cada partida (apenas ranked 420/440):
   - Contabiliza wins/losses
   - Soma kills/deaths/assists
   - Soma CS (minions + jungle)
   - Rastreia campeões mais jogados
4. Calcula médias (win rate, KDA, CS, duração)
5. Calcula LP change usando snapshots

**Métricas Calculadas**:
```typescript
winRate = (wins / totalGames) × 100
kda = deaths > 0 ? (kills + assists) / deaths : (kills + assists)
avgCS = totalCS / totalGames
avgGameDuration = totalDuration / totalGames / 60  // minutos
```

#### 6. rankPlayers

```typescript
function rankPlayers(
  players: Omit<PlayerStats, 'position' | 'previousPosition'>[]
): PlayerStats[]
```

**Critérios de Ordenação** (em ordem de prioridade):
1. Win Rate (maior melhor)
2. Total de Vitórias (maior melhor)
3. KDA (maior melhor)
4. Duração Média (menor melhor - jogos mais rápidos)

---

## Rate Limiting

### Riot API Limits

**Limites Oficiais**:
- 20 requisições/segundo
- 100 requisições/2 minutos

### Nossa Implementação

```typescript
// Delay entre requisições: 100-200ms
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Processamento em lotes
async function processBatch<T>(
  items: string[],
  batchSize: number,      // Ex: 3
  processor: (item: string) => Promise<T>,
  delayMs: number = 500   // Delay entre lotes
): Promise<T[]>
```

**Taxa Real**:
- ~3-6 requisições/segundo
- Margem de segurança: 70-85%

### Best Practices

1. **Sempre use delays** entre requisições consecutivas
2. **Processe em batches** para melhor controle
3. **Implemente retry logic** com exponential backoff
4. **Cache agressivamente** para minimizar calls
5. **Monitor rate limit headers** (X-Rate-Limit-*)

### Exemplo de Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited - wait longer
        const retryAfter = error.response.headers['retry-after'] || (i + 1) * 2
        await delay(retryAfter * 1000)
      } else if (i === maxRetries - 1) {
        throw error
      } else {
        await delay(delayMs * (i + 1))  // Exponential backoff
      }
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

## Error Handling

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Verifique parâmetros |
| 401 | Unauthorized | API key inválida |
| 403 | Forbidden | API key expirada ou bloqueada |
| 404 | Not Found | Jogador/partida não existe |
| 429 | Rate Limit | Aguarde e tente novamente |
| 500 | Server Error | Erro no servidor da Riot |
| 503 | Unavailable | Serviço temporariamente indisponível |

### Error Response Format

```typescript
interface ApiError {
  success: false
  error: string
  details?: any  // Informações adicionais em dev
}
```

### Handling Strategies

**Rate Limit (429)**:
```typescript
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'] || 60
  await delay(retryAfter * 1000)
  return retry()
}
```

**Not Found (404)**:
```typescript
if (error.response?.status === 404) {
  console.warn(`Player ${riotId} not found, skipping...`)
  return null  // Continue processing other players
}
```

**Server Error (500/503)**:
```typescript
if (error.response?.status >= 500) {
  console.error('Riot API error:', error)
  throw new Error('External API temporarily unavailable')
}
```

---

## Queue IDs

IDs de fila reconhecidos pela API:

| ID | Queue Type | Tracked? |
|----|------------|----------|
| 400 | Normal Draft | ❌ No |
| 420 | Ranked Solo/Duo | ✅ Yes |
| 430 | Normal Blind | ❌ No |
| 440 | Ranked Flex | ✅ Yes |
| 450 | ARAM | ❌ No |
| 700 | Clash | ❌ No |
| 1700 | Arena | ❌ No |

**Nota**: Apenas partidas ranked (420, 440) são contabilizadas no sistema.

---

## Data Dragon (Champion Assets)

### Base URL

```
https://ddragon.leagueoflegends.com/cdn/{version}/
```

### Champion Icons

```
https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/{ChampionName}.png
```

**Exemplo**:
```
https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Yasuo.png
```

### Versão Atual

```typescript
// lib/constants.ts
export const DDRAGON_VERSION = '13.24.1'
```

**Nota**: Atualizar quando nova versão do LoL é lançada.

---

## Testing

### Manual Testing

```bash
# 1. Test ranking endpoint
curl "http://localhost:3000/api/ranking?month=2025-10"

# 2. Force refresh
curl "http://localhost:3000/api/ranking?month=2025-10&force=true"

# 3. Check cache status
curl "http://localhost:3000/api/cache-status"

# 4. Clear cache
curl -X POST "http://localhost:3000/api/clear-cache"
```

### Testing with Different Months

```bash
# Current month
curl "http://localhost:3000/api/ranking?month=$(date +%Y-%m)"

# Previous month
curl "http://localhost:3000/api/ranking?month=2025-09"
```

---

## References

- [Riot API Documentation](https://developer.riotgames.com/apis)
- [Rate Limiting Guide](https://developer.riotgames.com/docs/portal#web-apis_rate-limiting)
- [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon)
- [League of Legends API](https://developer.riotgames.com/apis#lol)

---

**Próximo**: [Setup Guide](./SETUP.md) | [Voltar ao Índice](./README.md)

