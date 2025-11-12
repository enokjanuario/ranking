# 🔧 Troubleshooting

Soluções para problemas comuns e guia de debugging avançado.

## 📋 Índice

- [Problemas Comuns](#problemas-comuns)
- [Erros de API](#erros-de-api)
- [Problemas de Cache](#problemas-de-cache)
- [Problemas de Performance](#problemas-de-performance)
- [Debug Avançado](#debug-avançado)
- [Otimizações](#otimizações)

---

## Problemas Comuns

### 1. Rate Limit da Riot API (429)

**Sintoma**:
```
Error: Request failed with status code 429
Too Many Requests
```

**Causa**: Excesso de requisições à Riot API

**Solução**:

#### Opção 1: Aumentar Delays

**Arquivo**: `lib/riotApi.ts`

```typescript
// Aumentar delay entre requisições
await delay(200)  // De 100ms para 200ms

// Aumentar delay entre batches
const matchDetailsBatch = await processBatch(
  matchesToProcess,
  2,    // Reduzir de 3 para 2 por batch
  async (matchId) => getMatchDetails(matchId),
  1000  // Aumentar de 500ms para 1000ms
)
```

#### Opção 2: Implementar Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60')
        console.log(`⏳ Rate limited, waiting ${retryAfter}s...`)
        await delay(retryAfter * 1000)
      } else if (i === maxRetries - 1) {
        throw error
      } else {
        await delay(1000 * Math.pow(2, i))  // Exponential backoff
      }
    }
  }
  throw new Error('Max retries exceeded')
}

// Uso
const matchDetails = await withRetry(() => getMatchDetails(matchId))
```

#### Opção 3: Cache Mais Agressivo

**Arquivo**: `lib/cache-redis.ts`

```typescript
// Aumentar TTL de 15 para 30 minutos
const CACHE_DURATION_SECONDS = 30 * 60
```

---

### 2. Timeout do Redis

**Sintoma**:
```
Error: Redis connection failed
TimeoutError
```

**Diagnóstico**:

```bash
# Verificar credenciais
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Testar conexão manualmente
node -e "
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});
redis.ping().then(() => console.log('✅ OK')).catch(console.error);
"
```

**Soluções**:

1. **Verificar credenciais** no `.env.local`
2. **Verificar status** no [Upstash Dashboard](https://console.upstash.com)
3. **Verificar limites** do plano Free (10K comandos/dia)
4. **Aumentar timeout** (se necessário):

```typescript
// lib/cache-redis.ts
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  retry: {
    retries: 3,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 3000),
  },
})
```

---

### 3. Cache Travado (Lock Não Liberado)

**Sintoma**:
```
503 Service Unavailable
Update in progress, please try again
```

**Causa**: Lock não foi liberado (erro na execução anterior)

**Diagnóstico**:

```bash
# Verificar cache status
curl http://localhost:3000/api/cache-status | jq
```

**Solução**:

#### Opção 1: Via API

```bash
# Limpar todo o cache (incluindo locks)
curl -X POST http://localhost:3000/api/clear-cache
```

#### Opção 2: Via Upstash Dashboard

1. Acessar [Upstash Console](https://console.upstash.com)
2. Selecionar database
3. Ir para **Data Browser**
4. Deletar chave: `ranking:lock:2025-11`

#### Opção 3: Adicionar Auto-expire ao Lock

**Arquivo**: `lib/cache-redis.ts`

```typescript
// Lock já tem TTL de 5 minutos (auto-expira)
const LOCK_DURATION_SECONDS = 5 * 60

// Garantir que lock sempre expira
async function acquireUpdateLock(month: string): Promise<boolean> {
  const lockKey = getLockKey(month)
  const result = await redis.set(lockKey, Date.now().toString(), {
    nx: true,
    ex: LOCK_DURATION_SECONDS,  // Auto-expira
  })
  return result === 'OK'
}
```

---

### 4. LP Change Incorreto

**Sintoma**: LP change mostra 0 ou valores estranhos

**Causa**: Snapshot não foi criado no início do mês

**Diagnóstico**:

```typescript
// Adicionar logs em lib/rankSnapshot.ts
function getAllSnapshots(): RankSnapshot[] {
  console.log('📸 All snapshots:', rankSnapshots)
  return Object.values(rankSnapshots)
}

// Chamar na API route
const snapshots = getAllSnapshots()
console.log('Snapshots:', snapshots)
```

**Solução**:

#### Opção 1: Limpar Snapshots

```typescript
// Em lib/rankSnapshot.ts
export function clearAllSnapshots(): void {
  Object.keys(rankSnapshots).forEach(key => {
    delete rankSnapshots[key]
  })
  console.log('🗑️  All snapshots cleared')
}
```

```bash
# Forçar nova busca
curl "http://localhost:3000/api/ranking?month=2025-11&force=true"
```

#### Opção 2: Mover Snapshots para Redis

**Problema**: Em serverless, snapshots em memória não persistem

**Solução**: Salvar snapshots no Redis

```typescript
// lib/rankSnapshot.ts

async function saveRankSnapshot(
  puuid: string, 
  month: string, 
  rank: RankInfo
): Promise<void> {
  const key = `ranking:snapshot:${puuid}:${month}`
  
  // Verificar se já existe
  const existing = await redis.get(key)
  if (!existing) {
    await redis.set(key, JSON.stringify(rank), {
      ex: 90 * 24 * 60 * 60,  // 90 dias
    })
    console.log(`📸 Snapshot saved: ${key}`)
  }
}

async function getRankSnapshot(
  puuid: string, 
  month: string
): Promise<RankInfo | undefined> {
  const key = `ranking:snapshot:${puuid}:${month}`
  const data = await redis.get(key)
  return data ? JSON.parse(data as string) : undefined
}
```

---

### 5. Partidas Não Aparecem

**Sintoma**: `totalGames: 0` para jogadores que jogaram

**Causa**: Filtro de queue ou período incorreto

**Diagnóstico**:

**Arquivo**: `lib/riotApi.ts` → `calculatePlayerStats()`

```typescript
// Adicionar logs
console.log(`📊 Total matches found: ${matchIds.length}`)
console.log(`📊 Period: ${new Date(startTime)} to ${new Date(endTime)}`)

// Dentro do loop de matches
const queueId = matchDetails.info.queueId
console.log(`🎮 Match ${matchId} - Queue: ${queueId}`)

if (validQueues.includes(queueId || 0)) {
  totalGames++
} else {
  console.log(`⏭️  Skipped match (queue ${queueId})`)
}
```

**Soluções**:

1. **Verificar queue IDs**:

```typescript
// Apenas ranked
const validQueues = [420, 440]

// Incluir normals (teste)
const validQueues = [400, 420, 430, 440]
```

2. **Verificar período**:

```typescript
// Garantir UTC correto
const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
```

3. **Verificar se jogador existe**:

```bash
# Testar Riot ID
curl -X GET "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Dorrows/0488" \
  -H "X-Riot-Token: YOUR_API_KEY"
```

---

### 6. Imagens de Rank Não Carregam

**Sintoma**: Placeholder ou erro 404 nas imagens

**Diagnóstico**:

```bash
# Verificar arquivos
ls -la public/*.webp

# Devem existir:
# bronze.webp, silver.webp, gold.webp, platinum.webp,
# emerald.webp, diamond.webp, master.webp, challenger.webp
```

**Solução**:

#### Opção 1: Baixar Imagens Faltantes

```bash
# Criar script para baixar
# download-ranks.sh

#!/bin/bash
cd public

RANKS=("bronze" "silver" "gold" "platinum" "emerald" "diamond" "master" "challenger")

for rank in "${RANKS[@]}"; do
  if [ ! -f "${rank}.webp" ]; then
    echo "Downloading ${rank}.webp..."
    # Usar placeholder ou baixar de CDN
    curl -o "${rank}.webp" "https://your-cdn.com/ranks/${rank}.webp"
  fi
done
```

#### Opção 2: Fallback em Código

**Arquivo**: `components/PlayerTable.tsx`

```typescript
const getRankImage = (tier?: string): string => {
  if (!tier) return '/silver.webp'  // Default
  
  const tierMap: Record<string, string> = {
    'IRON': '/silver.webp',  // Fallback
    'BRONZE': '/bronze.webp',
    'SILVER': '/silver.webp',
    'GOLD': '/gold.webp',
    'PLATINUM': '/platinum.webp',
    'EMERALD': '/emerald.webp',
    'DIAMOND': '/diamond.webp',
    'MASTER': '/master.webp',
    'GRANDMASTER': '/master.webp',  // Use master
    'CHALLENGER': '/challenger.webp',
  }
  
  return tierMap[tier.toUpperCase()] || '/silver.webp'
}

// Com error handling
<Image
  src={getRankImage(player.currentRank?.tier)}
  alt={`${player.currentRank?.tier} ${player.currentRank?.rank}`}
  width={64}
  height={64}
  onError={(e) => {
    e.currentTarget.src = '/silver.webp'  // Fallback
  }}
/>
```

---

## Erros de API

### 400 - Bad Request

**Causa**: Parâmetros inválidos

**Exemplos**:
```
Invalid month format
Month parameter is required
```

**Solução**: Verificar formato `YYYY-MM`

```bash
# ✅ Correto
curl "http://localhost:3000/api/ranking?month=2025-11"

# ❌ Incorreto
curl "http://localhost:3000/api/ranking?month=11-2025"
curl "http://localhost:3000/api/ranking?month=2025/11"
```

### 401 - Unauthorized

**Causa**: API key da Riot inválida

**Solução**:

1. Regenerar API key no [Developer Portal](https://developer.riotgames.com/)
2. Atualizar `.env.local`
3. Reiniciar servidor

```bash
# Testar API key
curl -X GET "https://br1.api.riotgames.com/lol/status/v4/platform-data" \
  -H "X-Riot-Token: $RIOT_API_KEY"
```

### 403 - Forbidden

**Causa**: API key expirada ou bloqueada

**Solução**:

1. Verificar expiração (Dev keys expiram em 24h)
2. Verificar se violou termos de uso
3. Solicitar nova key ou Production key

### 404 - Not Found

**Causa**: Jogador ou recurso não existe

**Solução**:

1. Verificar Riot ID correto (`GameName#TagLine`)
2. Verificar região correta
3. Jogador pode ter mudado nome

```bash
# Procurar jogador
curl "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/NomeDoJogador/TAG" \
  -H "X-Riot-Token: $RIOT_API_KEY"
```

### 500/503 - Server Error

**Causa**: Erro no servidor da Riot ou interno

**Solução**:

1. Verificar [Riot API Status](https://status.riotgames.com/)
2. Implementar retry logic
3. Aguardar e tentar novamente

```typescript
// Retry com backoff
if (error.response?.status >= 500) {
  await delay(5000)  // Aguardar 5s
  return retry()
}
```

---

## Problemas de Cache

### Cache Não Persiste

**Sintoma**: Sempre busca dados frescos, mesmo com cache ativo

**Causa**: Em serverless, cache em memória não persiste

**Solução**: Usar apenas Redis (já implementado)

**Verificar**:

```typescript
// lib/cache-redis.ts deve ser usado em produção
// NÃO usar lib/cache.ts em Vercel/AWS Lambda
```

### Cache Stale Retornado

**Sintoma**: Dados muito antigos sendo retornados

**Diagnóstico**:

```bash
curl "http://localhost:3000/api/cache-status" | jq
```

Verificar `ageMinutes` e `isExpired`.

**Solução**:

```bash
# Forçar refresh
curl "http://localhost:3000/api/ranking?month=2025-11&force=true"

# Ou limpar cache
curl -X POST "http://localhost:3000/api/clear-cache"
```

### Redis Keys Não Expiram

**Sintoma**: Keys antigas permanecem no Redis

**Diagnóstico**: Via Upstash Dashboard → Data Browser

**Solução**: Garantir TTL está sendo setado

```typescript
// lib/cache-redis.ts
await redis.set(cacheKey, JSON.stringify(cacheData), {
  ex: CACHE_DURATION_SECONDS,  // ← Garantir TTL
})
```

---

## Problemas de Performance

### Primeira Carga Muito Lenta (>60s)

**Causa**: Muitas partidas para processar

**Soluções**:

#### 1. Limitar Histórico

```typescript
// lib/riotApi.ts → getMatchHistory
// Limitar para últimas 50 partidas do período
const matchIds = allMatchIds.slice(0, 50)
```

#### 2. Processar em Paralelo (com cuidado)

```typescript
// Aumentar batch size (mas cuidado com rate limit)
const matchDetailsBatch = await processBatch(
  matchesToProcess,
  5,  // De 3 para 5
  async (matchId) => getMatchDetails(matchId),
  300  // Reduzir delay para 300ms
)
```

#### 3. Cache Mais Longo

```typescript
// Aumentar TTL
const CACHE_DURATION_SECONDS = 60 * 60  // 1 hora
```

### High Memory Usage

**Sintoma**: Vercel Function Memory Limit Exceeded

**Solução**:

#### 1. Processar em Chunks

```typescript
// Processar jogadores um por vez
for (const player of TRACKED_PLAYERS) {
  const stats = await calculatePlayerStats(...)
  playerStatsList.push(stats)
  
  // Limpar referências
  stats = null
}
```

#### 2. Limitar Dados Retornados

```typescript
// Não retornar dados desnecessários
const minimalPlayerStats = {
  ...player,
  // Remover campos grandes se não usados
  matchHistory: undefined,
}
```

### Slow Cache Hits

**Sintoma**: Cache hit levando >1s

**Causa**: Latência do Redis ou payload grande

**Solução**:

#### 1. Comprimir Dados

```typescript
// lib/cache-redis.ts
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

async function setCache(...) {
  const data = JSON.stringify(cacheData)
  const compressed = await gzipAsync(data)
  await redis.set(cacheKey, compressed.toString('base64'), { ex: ... })
}

async function getCache(...) {
  const compressed = await redis.get(cacheKey)
  const decompressed = await gunzipAsync(Buffer.from(compressed, 'base64'))
  return JSON.parse(decompressed.toString())
}
```

#### 2. Otimizar Região do Redis

Usar região próxima ao deploy (ex: São Paulo para BR)

---

## Debug Avançado

### Habilitar Logs Detalhados

**Arquivo**: `lib/riotApi.ts`

```typescript
const DEBUG = process.env.NODE_ENV === 'development'

function log(...args: any[]) {
  if (DEBUG) console.log('[RiotAPI]', ...args)
}

// Usar
log('Fetching matches for', puuid)
log('Found', matchIds.length, 'matches')
```

### Monitorar Performance

```typescript
// Adicionar em funções críticas
console.time('calculatePlayerStats')
const stats = await calculatePlayerStats(...)
console.timeEnd('calculatePlayerStats')
// Output: calculatePlayerStats: 2453.567ms
```

### Debug de Rate Limiting

```typescript
// Track API calls
let apiCallCount = 0

async function callRiotAPI(url: string) {
  apiCallCount++
  console.log(`📊 API Call #${apiCallCount}: ${url}`)
  
  const response = await axios.get(url, ...)
  
  // Log rate limit headers
  console.log('Rate Limit:', {
    limit: response.headers['x-rate-limit-count'],
    remaining: response.headers['x-app-rate-limit-count'],
  })
  
  return response.data
}
```

### Inspecting Redis Data

```bash
# Via Upstash CLI (se instalado)
upstash-cli redis get ranking:cache:2025-11

# Ou via Dashboard → Data Browser
```

---

## Otimizações

### 1. Memoização de Componentes

```typescript
import { memo } from 'react'

const PlayerRow = memo(({ player }: { player: PlayerStats }) => {
  // Componente só re-renderiza se player mudar
  return <tr>...</tr>
})
```

### 2. Lazy Loading

```typescript
// Carregar componentes sob demanda
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
  loading: () => <LoadingSpinner />,
  ssr: false,  // Não renderizar no servidor
})
```

### 3. Image Optimization

```typescript
// Usar Next.js Image component
import Image from 'next/image'

<Image
  src="/gold.webp"
  alt="Gold"
  width={64}
  height={64}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### 4. Code Splitting

```typescript
// Dividir código em chunks menores
// Next.js faz isso automaticamente, mas você pode ajudar:

// Importar apenas o necessário
import { specificFunction } from 'large-library'
// Melhor que:
import * as lib from 'large-library'
```

### 5. Debounce de Inputs

```typescript
import { useMemo, useCallback } from 'react'
import debounce from 'lodash/debounce'

const debouncedSearch = useCallback(
  debounce((value: string) => {
    setSearchTerm(value)
  }, 300),
  []
)
```

---

## Recursos Adicionais

- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [Vercel Logs](https://vercel.com/docs/concepts/observability/logging)
- [Upstash Docs](https://docs.upstash.com/redis)
- [Riot API Status](https://status.riotgames.com/)

---

## Ainda com Problemas?

Se nenhuma solução acima funcionou:

1. **Verifique Logs**: Terminal e Vercel Dashboard
2. **Teste Localmente**: Isolar o problema
3. **Consulte Docs**: [README](./README.md) e [Architecture](./ARCHITECTURE.md)
4. **Abra Issue**: Descreva o problema detalhadamente
5. **Stack Overflow**: Tag `next.js`, `riot-api`, `redis`

---

**Próximo**: [Types Reference](./TYPES.md) | [Voltar ao Índice](./README.md)

