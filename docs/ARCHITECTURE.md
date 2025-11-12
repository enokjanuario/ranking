# 🏗️ Arquitetura do Sistema

Documentação técnica da arquitetura do YoJornada Ranking System.

## 📋 Índice

- [Stack Tecnológico](#stack-tecnológico)
- [Fluxo de Dados](#fluxo-de-dados)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Componentes Frontend](#componentes-frontend)
- [Sistema de Cache](#sistema-de-cache)
- [Padrões de Design](#padrões-de-design)
- [Fluxo Completo de Requisição](#fluxo-completo-de-requisição)

---

## Stack Tecnológico

### Core

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript 5.2+
- **Estilização**: Tailwind CSS 3.3+
- **Animações**: Framer Motion 10.16+

### Backend & Integração

- **Cache**: Upstash Redis 1.35+
- **HTTP Client**: Axios 1.6+
- **Datas**: date-fns 2.30+
- **API Externa**: Riot Games API v5

### Deploy & Infraestrutura

- **Hosting**: Vercel (Serverless Functions)
- **Cache Database**: Upstash Redis (Cloud)
- **CDN**: Vercel Edge Network

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Header     │  │ PlayerTable  │  │   Footer     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ GET /api/ranking?month=YYYY-MM
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /ranking    │  │ /cache-status│  │ /clear-cache │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ Check cache / Acquire lock
          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Cache Layer (Redis)                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ranking:cache:{month}  │  ranking:lock:{month}     │  │
│  │  TTL: 15min             │  TTL: 5min                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          │ Cache miss → Fetch data
          ↓
┌─────────────────────────────────────────────────────────────┐
│                Riot API Integration (lib/)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  riotApi.ts  │  │lpCalculator  │  │rankSnapshot  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP Requests (rate-limited)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Riot Games API                          │
│                                                              │
│  • Account by Riot ID    • Summoner by PUUID               │
│  • League Entries        • Match History                    │
│  • Match Details         • Data Dragon (Champions)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Diretórios

```
ranking/
├── app/
│   ├── api/
│   │   ├── cache-status/
│   │   │   └── route.ts          # Endpoint para status do cache
│   │   ├── clear-cache/
│   │   │   └── route.ts          # Endpoint para limpar cache
│   │   └── ranking/
│   │       └── route.ts          # Endpoint principal de ranking
│   ├── globals.css               # Estilos globais + Tailwind
│   ├── layout.tsx                # Layout raiz da aplicação
│   └── page.tsx                  # Página principal (home)
│
├── components/
│   ├── Footer.tsx                # Rodapé da aplicação
│   ├── Header.tsx                # Cabeçalho com seletor de mês
│   ├── LoadingSpinner.tsx        # Componente de loading
│   ├── PlayerCard.tsx            # Card individual (view antiga)
│   ├── PlayerTable.tsx           # Tabela de jogadores (view atual)
│   ├── RankingList.tsx           # Lista de ranking (view antiga)
│   └── StatsBar.tsx              # Barra de progresso para stats
│
├── lib/
│   ├── cache-redis.ts            # Sistema de cache com Redis
│   ├── cache.ts                  # Cache em memória (fallback)
│   ├── constants.ts              # Constantes e configurações
│   ├── locales.ts                # Configuração de idioma pt-BR
│   ├── lpCalculator.ts           # Cálculo de LP absoluto
│   ├── rankSnapshot.ts           # Sistema de snapshots de rank
│   └── riotApi.ts                # Integração com Riot API
│
├── public/
│   ├── *.webp                    # Imagens de ranks
│   ├── *.jpg                     # Imagens de fundo
│   ├── favicon.ico
│   └── riot.txt                  # Arquivo de verificação da Riot
│
├── types/
│   └── index.ts                  # Definições de tipos TypeScript
│
├── docs/                         # Documentação completa
├── next.config.js                # Configuração do Next.js
├── tailwind.config.js            # Configuração do Tailwind
├── tsconfig.json                 # Configuração do TypeScript
└── vercel.json                   # Configuração de deploy
```

---

## Componentes Frontend

### Hierarquia de Componentes

```
app/page.tsx (Client Component)
    │
    ├─ Header
    │   ├─ Month Selector
    │   ├─ Last Update Display
    │   └─ Countdown Timer
    │
    ├─ LoadingSpinner (conditional)
    │
    ├─ PlayerTable
    │   ├─ Search & Filters
    │   ├─ Table Header (sortable columns)
    │   ├─ Player Rows
    │   │   ├─ Rank Image
    │   │   ├─ Champion Icons
    │   │   ├─ StatsBar (multiple)
    │   │   └─ Metrics Display
    │   └─ Summary Cards
    │
    └─ Footer
```

### 1. Header Component

**Responsabilidades**:
- Seletor de mês (últimos 12 meses)
- Display de timestamp de atualização
- Contador regressivo para próxima atualização
- Formatação de datas em português

**Props**:
```typescript
interface HeaderProps {
  selectedMonth: string         // Formato: YYYY-MM
  onMonthChange: (month: string) => void
  lastUpdate: Date
  isCached?: boolean
  dataTimestamp?: Date | null
  nextUpdateIn?: number         // Segundos
}
```

### 2. PlayerTable Component

**Responsabilidades**:
- Exibição de jogadores em formato tabular
- Ordenação por qualquer coluna (asc/desc)
- Filtros: busca por nome e mínimo de partidas
- Cálculo de estatísticas gerais
- Exibição de contadores

**Colunas**:
1. Posição (#)
2. Jogador (nome + apelido)
3. Elo atual (imagem + LP)
4. Top 3 campeões
5. Partidas (total + W/L)
6. LP Ganhos (com indicador)
7. Win Rate (% + barra)
8. KDA (valor + barra)
9. CS/Jogo
10. Tempo Médio

### 3. LoadingSpinner Component

**Features**:
- Spinner rotativo com gradient
- Texto pulsante
- Dots animados com bounce effect
- Mensagens descritivas

### 4. StatsBar Component

**Uso**: Visualização de métricas como barra de progresso

```typescript
interface StatsBarProps {
  value: number
  max: number
  color?: string          // Classe Tailwind
  showValue?: boolean
}
```

---

## Sistema de Cache

### Arquitetura do Cache

```
┌─────────────────────────────────────────────────────────────┐
│                      Cache Strategy                          │
└─────────────────────────────────────────────────────────────┘

1. Request → Check Cache
   │
   ├─ Cache HIT (< 15min)
   │  └─ Return cached data ✓
   │
   └─ Cache MISS
      │
      ├─ Update in progress?
      │  ├─ Yes → Wait (polling 2s, timeout 60s)
      │  └─ No → Continue
      │
      ├─ Try acquire lock (Redis SET NX)
      │  │
      │  ├─ Lock acquired ✓
      │  │  ├─ Fetch from Riot API
      │  │  ├─ Save to cache (TTL 15min)
      │  │  └─ Release lock
      │  │
      │  └─ Lock failed ✗
      │     ├─ Stale cache exists? → Return stale
      │     └─ No cache → Error 503
```

### Cache Redis (lib/cache-redis.ts)

**Configuração**:
- **Cache TTL**: 15 minutos (900 segundos)
- **Lock TTL**: 5 minutos (300 segundos)
- **Prefixos**: `ranking:cache:{month}`, `ranking:lock:{month}`

**Estrutura de Dados**:
```typescript
interface CacheData {
  players: PlayerStats[]
  period: {
    start: string       // ISO 8601
    end: string         // ISO 8601
  }
  timestamp: number     // Unix timestamp em ms
  month: string         // YYYY-MM
}
```

**Funções Principais**:
- `initCache()` - Inicializa conexão Redis
- `getCache(month)` - Obtém dados do cache
- `setCache(month, players, period)` - Salva com TTL
- `acquireUpdateLock(month)` - Tenta adquirir lock (atomic)
- `releaseUpdateLock(month)` - Libera lock
- `waitForUpdate(month)` - Aguarda update em progresso
- `getCacheStatus()` - Status de todas as entradas
- `clearAllCache()` - Limpa todo o cache

### Sistema de Mutex (Lock)

O sistema utiliza Redis SET NX (Set if Not eXists) para garantir operações atômicas e evitar race conditions:

```typescript
// Atomic lock acquisition
await redis.set(lockKey, Date.now().toString(), {
  nx: true,     // Only set if key doesn't exist
  ex: 300,      // Expire in 5 minutes
})
```

**Benefícios**:
- Previne requisições duplicadas simultâneas
- Evita rate limiting da Riot API
- Garante consistência de dados
- Auto-expira em caso de falha

---

## Padrões de Design

### 1. Singleton Pattern

**Uso**: Cliente Redis

```typescript
// lib/cache-redis.ts
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
// Única instância reutilizada em todas as requisições
```

### 2. Factory Pattern

**Uso**: Endpoints da API

```typescript
// lib/constants.ts
export const RIOT_API_ENDPOINTS = {
  accountByRiotId: (name: string, tag: string, routing: string) => 
    `https://${routing}.api.riotgames.com/...`,
}
```

### 3. Strategy Pattern

**Uso**: Ordenação de jogadores

```typescript
const sortStrategies = {
  position: (a, b) => a.position - b.position,
  winRate: (a, b) => b.winRate - a.winRate,
  kda: (a, b) => b.kda - a.kda,
}
```

### 4. Observer Pattern

**Uso**: React State Management

```typescript
const [players, setPlayers] = useState<PlayerStats[]>([])
// Componentes observam mudanças e re-renderizam
```

### 5. Mutex/Lock Pattern

**Uso**: Controle de concorrência

```typescript
async function acquireUpdateLock(month: string): Promise<boolean> {
  return await redis.set(lockKey, value, { nx: true, ex: 300 }) === 'OK'
}
```

### 6. Adapter Pattern

**Uso**: Adaptação de API externa

```typescript
// Adapta resposta da Riot API para formato interno
async function getAccountByRiotId(riotId: string) {
  const response = await api.get(url)  // Formato Riot
  return { puuid, gameName, tagLine }   // Nosso formato
}
```

### 7. Decorator Pattern

**Uso**: Retry logic e rate limiting

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await delay(1000 * (i + 1))
    }
  }
}
```

---

## Fluxo Completo de Requisição

### Diagrama de Sequência

```
Usuário seleciona mês "2025-10"
    │
    ├─→ Frontend: fetchRankingData("2025-10")
    │
    ├─→ API: GET /api/ranking?month=2025-10
    │       │
    │       ├─ Validar parâmetro month
    │       ├─ Calcular startTime e endTime
    │       │
    │       ├─ Verificar cache Redis
    │       │   ├─ Cache válido? → [Return data + cached: true]
    │       │   └─ Cache inválido → Continue
    │       │
    │       ├─ Verificar update em progresso
    │       │   ├─ Sim? → waitForUpdate() → Retry cache
    │       │   └─ Não → Continue
    │       │
    │       ├─ Tentar adquirir lock
    │       │   ├─ Sucesso:
    │       │   │   ├─ Para cada TRACKED_PLAYER:
    │       │   │   │   ├─ getAccountByRiotId()
    │       │   │   │   ├─ getCurrentRankByPuuid()
    │       │   │   │   ├─ getMatchHistory()
    │       │   │   │   └─ Para cada match:
    │       │   │   │       ├─ getMatchDetails()
    │       │   │   │       └─ Acumular estatísticas
    │       │   │   │
    │       │   │   ├─ calculatePlayerStats()
    │       │   │   ├─ rankPlayers()
    │       │   │   ├─ setCache() [TTL 15min]
    │       │   │   └─ releaseUpdateLock()
    │       │   │
    │       │   └─ Falha:
    │       │       ├─ Stale cache existe? → Return stale
    │       │       └─ Sem cache → Error 503
    │       │
    │       └─ Return JSON response
    │
    ├─→ Frontend: Recebe dados
    │       │
    │       ├─ setPlayers(data.players)
    │       ├─ setLastUpdate(now)
    │       └─ setCacheInfo(...)
    │
    ├─→ PlayerTable: Re-renderiza
    │       │
    │       ├─ Aplica filtros (search, minGames)
    │       ├─ Aplica ordenação (sortField, sortOrder)
    │       └─ Renderiza linhas com animação
    │
    └─→ Usuário vê dados atualizados
        │
        └─ Auto-refresh após 16 minutos (loop)
```

### Timing & Performance

**Cache Hit** (dados já disponíveis):
- Latência Redis: ~50-100ms
- Resposta total: <200ms

**Cache Miss** (busca necessária):
- 3 jogadores × ~20 partidas cada
- Tempo médio: 15-30 segundos
- Pode chegar a 60s com muitas partidas

**Rate Limiting Safe**:
- Limite Riot: 20 req/s
- Sistema atual: ~3-6 req/s
- Margem de segurança: 70-85%

---

## Conceitos Importantes

### Server-Side vs Client-Side

**Server-Side** (API Routes):
```typescript
// ✅ Pode acessar
- Redis, variáveis de ambiente, Riot API
// ❌ Não pode acessar
- window, localStorage, DOM APIs
```

**Client-Side** (Components):
```typescript
'use client'  // Necessário para browser APIs
// ✅ Pode acessar
- window, localStorage, useState, useEffect
```

### Revalidação no Next.js

```typescript
// Forçar dynamic rendering (sem cache)
export const dynamic = 'force-dynamic'

// Revalidar a cada 60 segundos (ISR)
export const revalidate = 60
```

### Ambientes Serverless

**Importante**: Em Vercel/AWS Lambda:
- Cache em memória NÃO persiste entre invocações
- Snapshots em memória são efêmeros
- Use Redis para persistência real

---

## Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [Redis Commands](https://redis.io/commands)
- [Riot API Documentation](https://developer.riotgames.com/apis)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook)

---

**Próximo**: [API Reference](./API.md) | [Voltar ao Índice](./README.md)
