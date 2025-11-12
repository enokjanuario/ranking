# 🛠️ Guia de Desenvolvimento

Workflows, convenções e guia para adicionar novas features ao projeto.

## 📋 Índice

- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Convenções de Código](#convenções-de-código)
- [Adicionando Features](#adicionando-features)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)

---

## Workflow de Desenvolvimento

### Ambiente de Desenvolvimento

```bash
# 1. Atualizar branch main
git checkout main
git pull origin main

# 2. Criar nova branch
git checkout -b feature/nome-da-feature

# 3. Iniciar servidor
npm run dev

# 4. Desenvolver e testar

# 5. Build local (verificar)
npm run build

# 6. Commit e push
git add .
git commit -m "feat: descrição da mudança"
git push origin feature/nome-da-feature
```

### Estrutura de Branches

- `main` - Branch principal (produção)
- `develop` - Branch de desenvolvimento (se usar)
- `feature/*` - Novas features
- `fix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes em produção

### Commits Semânticos

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova métrica de dano por minuto
fix: corrige cálculo de LP para Master+
docs: atualiza documentação da API
style: formata código com Prettier
refactor: reorganiza função calculatePlayerStats
perf: otimiza queries ao Redis
test: adiciona testes para lpCalculator
chore: atualiza dependências
```

---

## Convenções de Código

### Nomenclatura

```typescript
// ✅ Componentes: PascalCase
PlayerTable.tsx
LoadingSpinner.tsx

// ✅ Funções/variáveis: camelCase
calculatePlayerStats()
const winRate = ...

// ✅ Constantes: UPPER_SNAKE_CASE
const CACHE_DURATION_SECONDS = 900
const TRACKED_PLAYERS = [...]

// ✅ Tipos/Interfaces: PascalCase
interface PlayerStats {}
type SortField = ...

// ✅ Arquivos utilitários: camelCase
riotApi.ts
lpCalculator.ts
```

### Organização de Imports

```typescript
// 1. Bibliotecas externas
import { useState, useEffect } from 'react'
import axios from 'axios'

// 2. Bibliotecas do Next.js
import { NextRequest, NextResponse } from 'next/server'
import Image from 'next/image'

// 3. Componentes locais
import Header from '@/components/Header'
import PlayerTable from '@/components/PlayerTable'

// 4. Utilitários e constantes
import { TRACKED_PLAYERS } from '@/lib/constants'
import { calculatePlayerStats } from '@/lib/riotApi'

// 5. Tipos
import { PlayerStats } from '@/types'
```

### Comentários

```typescript
// ✅ Bom: explica o "porquê"
// Cache duration: 15 minutes to balance freshness with API rate limits
const CACHE_DURATION_SECONDS = 15 * 60

// ❌ Ruim: repete o código
// Set cache duration to 15 times 60
const CACHE_DURATION_SECONDS = 15 * 60

// ✅ Bom: documenta lógica complexa
/**
 * Calcula LP absoluto para permitir comparação entre tiers
 * Exemplo: Gold II 50 LP = 1200 + 200 + 50 = 1450 LP absolutos
 */
function rankToAbsoluteLP(rank: RankInfo): number

// ✅ Bom: marca TODOs
// TODO: Implementar cache de imagens de campeões
// FIXME: Rate limiting pode falhar em picos de tráfego
```

### TypeScript Best Practices

```typescript
// ✅ Use tipos explícitos
function calculateWinRate(wins: number, total: number): number {
  return (wins / total) * 100
}

// ✅ Evite 'any'
// ❌ Bad
function processData(data: any) { }

// ✅ Good
function processData(data: PlayerStats[]) { }

// ✅ Use interfaces para objetos
interface ApiResponse {
  success: boolean
  data?: PlayerStats[]
  error?: string
}

// ✅ Use type para unions/aliases
type SortOrder = 'asc' | 'desc'
type SortField = 'winRate' | 'kda' | 'avgCS'
```

---

## Adicionando Features

### 1. Adicionar Novo Jogador

**Arquivo**: `lib/constants.ts`

```typescript
export const TRACKED_PLAYERS = [
  'Dorrows#0488',
  'Atziluth#537',
  'Gordaker#prata',
  'NovoJogador#BR1',  // ← Adicionar aqui
]

// Opcional: adicionar apelido
export const PLAYER_NICKNAMES: Record<string, string> = {
  'Atziluth#537': 'Bronziocre',
  'Gordaker#prata': 'JB Sniper',
  'NovoJogador#BR1': 'Apelido Legal',  // ← Adicionar aqui
}
```

**Após mudança**:
```bash
# Limpar cache para reprocessar
curl -X POST "http://localhost:3000/api/clear-cache"
```

### 2. Adicionar Nova Métrica

#### Passo 1: Adicionar ao tipo PlayerStats

**Arquivo**: `types/index.ts`

```typescript
export interface PlayerStats {
  // ... campos existentes
  damagePerMinute: number  // ← Nova métrica
}
```

#### Passo 2: Calcular a métrica

**Arquivo**: `lib/riotApi.ts` → `calculatePlayerStats()`

```typescript
export async function calculatePlayerStats(
  riotId: string,
  puuid: string,
  startTime: number,
  endTime: number
): Promise<Omit<PlayerStats, 'position' | 'previousPosition'> | null> {
  // ... código existente
  
  let totalDamage = 0  // ← Acumulador
  
  for (const matchDetails of matchDetailsBatch) {
    if (!matchDetails) continue
    
    const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
    if (!participant) continue
    
    // Calcular nova métrica
    totalDamage += participant.totalDamageDealtToChampions
  }
  
  const damagePerMinute = totalGames > 0 
    ? totalDamage / (totalDuration / 60) 
    : 0
  
  return {
    // ... campos existentes
    damagePerMinute: parseFloat(damagePerMinute.toFixed(2)),
  }
}
```

#### Passo 3: Adicionar coluna na tabela

**Arquivo**: `components/PlayerTable.tsx`

```typescript
// Header
<th className="px-4 py-4 text-center">
  <button
    onClick={() => handleSort('damagePerMinute')}
    className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold w-full"
  >
    Dano/Min
    <SortIcon field="damagePerMinute" />
  </button>
</th>

// Body
<td className="px-4 py-3 text-center">
  <div className="font-semibold text-sm text-white">
    {player.damagePerMinute.toFixed(0)}
  </div>
</td>
```

#### Passo 4: Adicionar ao tipo de ordenação

```typescript
type SortField = 
  | 'position' 
  | 'summonerName' 
  | 'winRate' 
  | 'totalGames' 
  | 'kda' 
  | 'avgCS'
  | 'damagePerMinute'  // ← Adicionar
```

### 3. Modificar Critérios de Ranking

**Arquivo**: `lib/riotApi.ts` → `rankPlayers()`

```typescript
export function rankPlayers(
  players: Omit<PlayerStats, 'position' | 'previousPosition'>[]
): PlayerStats[] {
  const sorted = [...players].sort((a, b) => {
    // 1. Win rate (descending)
    if (a.winRate !== b.winRate) {
      return b.winRate - a.winRate
    }
    
    // 2. Total wins (descending)
    if (a.wins !== b.wins) {
      return b.wins - a.wins
    }
    
    // 3. KDA (descending)
    if (a.kda !== b.kda) {
      return b.kda - a.kda
    }
    
    // 4. ← ADICIONAR NOVO CRITÉRIO AQUI
    // Exemplo: CS médio (descending)
    if (a.avgCS !== b.avgCS) {
      return b.avgCS - a.avgCS
    }
    
    // 5. Avg game duration (ascending - faster games win)
    return a.avgGameDuration - b.avgGameDuration
  })

  return sorted.map((player, index) => ({
    ...player,
    position: index + 1,
  }))
}
```

### 4. Modificar Duração do Cache

**Arquivo**: `lib/cache-redis.ts`

```typescript
// Atualmente: 15 minutos
const CACHE_DURATION_SECONDS = 15 * 60

// Para 30 minutos:
const CACHE_DURATION_SECONDS = 30 * 60

// Para 1 hora:
const CACHE_DURATION_SECONDS = 60 * 60
```

**Importante**: Também atualizar no frontend (`app/page.tsx`):

```typescript
// Auto-refresh interval (deve ser > CACHE_DURATION)
const interval = setInterval(() => {
  if (selectedMonth) {
    fetchRankingData(true)
  }
}, 31 * 60 * 1000)  // ← Ajustar aqui (cache + 1min)
```

### 5. Adicionar Filtro de Queue

Por padrão, apenas Ranked Solo/Duo (420) e Ranked Flex (440) são contados.

**Arquivo**: `lib/riotApi.ts` → `calculatePlayerStats()`

```typescript
// Linha ~175
const queueId = matchDetails.info.queueId
const validQueues = [420, 440]  // ← Modificar aqui

// Exemplo: adicionar Normal Draft (400)
const validQueues = [400, 420, 440]

// Queue IDs comuns:
// 400 - Normal Draft
// 420 - Ranked Solo/Duo
// 430 - Normal Blind
// 440 - Ranked Flex
// 450 - ARAM
```

### 6. Customizar Cores do Tema

**Arquivo**: `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#a855f7',  // ← Modificar cores neon
          blue: '#3b82f6',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
        dark: {
          bg: '#0d111c',      // ← Modificar cores de fundo
          card: '#1a1f2e',
          hover: '#232938',
        }
      },
    },
  },
}
```

**Aplicar mudanças**:

```bash
# Reiniciar servidor de desenvolvimento
npm run dev
```

---

## Testing

### Teste Manual Completo

```bash
# 1. Cache vazio - primeira carga
curl "http://localhost:3000/api/ranking?month=2025-11"
# Deve levar 15-30s

# 2. Cache hit - segunda carga imediata
curl "http://localhost:3000/api/ranking?month=2025-11"
# Deve retornar em <200ms

# 3. Status do cache
curl "http://localhost:3000/api/cache-status" | jq

# 4. Forçar atualização
curl "http://localhost:3000/api/ranking?month=2025-11&force=true"

# 5. Limpar cache
curl -X POST "http://localhost:3000/api/clear-cache"

# 6. Verificar diferentes meses
curl "http://localhost:3000/api/ranking?month=2025-10"
curl "http://localhost:3000/api/ranking?month=2025-09"
```

### Teste de Concorrência

```bash
# Múltiplas requisições simultâneas
for i in {1..5}; do
  curl "http://localhost:3000/api/ranking?month=2025-11" &
done
wait

# Verificar logs:
# Apenas 1 deve adquirir lock
# Outros devem aguardar ou retornar cache
```

### Teste de Expiração de Cache

```bash
# 1. Criar cache
curl "http://localhost:3000/api/ranking?month=2025-11"

# 2. Verificar status
curl "http://localhost:3000/api/cache-status" | jq '.cacheEntries[0].remainingMinutes'

# 3. Aguardar 15+ minutos

# 4. Nova requisição deve revalidar
curl "http://localhost:3000/api/ranking?month=2025-11"
```

---

## Debugging

### 1. Logs do Sistema

Logs importantes aparecem no terminal do servidor:

```typescript
// Conexão
'✅ Redis conectado com sucesso'

// Cache hit
'✅ Cache valido para 2025-11 (expira em 14min)'

// Cache miss
'⚠️  Cache nao encontrado para 2025-11'

// Lock adquirido
'🔒 Lock adquirido para 2025-11'

// Lock liberado
'🔓 Lock liberado para 2025-11'

// Cache salvo
'💾 Cache atualizado no Redis para 2025-11 com 3 jogadores'

// Rank encontrado
'✅ Rank found: GOLD II 45 LP'

// LP Change
'📊 LP Change para Dorrows#0488: GOLD III 60LP → GOLD I 85LP = +225 LP'
```

### 2. Debug de Cache Redis

#### Ver Status do Cache

```bash
# Via API
curl http://localhost:3000/api/cache-status | jq
```

#### Limpar Cache

```bash
# Via API
curl -X POST http://localhost:3000/api/clear-cache
```

#### Ver Dados no Upstash Dashboard

1. Acessar: https://console.upstash.com
2. Clicar no database
3. Ir em **Data Browser**
4. Ver chaves:
   - `ranking:cache:2025-11`
   - `ranking:lock:2025-11`

### 3. Debug no Browser

**DevTools do Chrome**:

1. **Console**: Ver logs e erros
2. **Network**: Monitorar requisições API
3. **Application** → Local Storage: Ver dados locais
4. **Performance**: Analisar performance

**React DevTools**:

1. Instalar extensão
2. Visualizar árvore de componentes
3. Inspecionar props e state

### 4. Adicionar Logs Customizados

```typescript
// Em lib/riotApi.ts
console.log('📊 Total matches found:', matchIds.length)
console.log('📊 Matches processed:', totalGames)
console.log('📊 Queue IDs found:', uniqueQueueIds)

// Em app/api/ranking/route.ts
console.time('fetchRankingData')
// ... código
console.timeEnd('fetchRankingData')

// Em components/PlayerTable.tsx
useEffect(() => {
  console.log('Players updated:', players.length)
}, [players])
```

---

## Performance

### 1. Reduzir Chamadas à API

```typescript
// Cachear dados que raramente mudam
const championCache = new Map<number, string>()

async function getChampionName(championId: number): Promise<string> {
  if (championCache.has(championId)) {
    return championCache.get(championId)!
  }
  
  // Buscar de Data Dragon
  const response = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/champion.json`
  )
  const data = await response.json()
  
  // Popular cache
  Object.values(data.data).forEach((champ: any) => {
    championCache.set(champ.key, champ.id)
  })
  
  return championCache.get(championId) || 'Unknown'
}
```

### 2. Lazy Loading de Imagens

```typescript
// Em PlayerTable.tsx
<Image
  src={getRankImage(player.currentRank.tier)}
  alt={`${player.currentRank.tier} ${player.currentRank.rank}`}
  width={64}
  height={64}
  loading="lazy"      // ← Adicionar
  placeholder="blur"  // ← Opcional
  className="object-contain drop-shadow-lg"
/>
```

### 3. Memoização de Componentes

```typescript
// Em PlayerTable.tsx
import { memo } from 'react'

const PlayerRow = memo(({ player }: { player: PlayerStats }) => {
  return (
    <tr>
      {/* ... */}
    </tr>
  )
})

// No componente principal
{filteredAndSortedPlayers.map((player) => (
  <PlayerRow key={player.puuid} player={player} />
))}
```

### 4. Debounce na Busca

```typescript
// Em PlayerTable.tsx
import { useMemo, useState, useCallback } from 'react'
import { debounce } from 'lodash'

const debouncedSetSearch = useCallback(
  debounce((value: string) => {
    setSearchTerm(value)
  }, 300),
  []
)

<input
  type="text"
  onChange={(e) => debouncedSetSearch(e.target.value)}
  // ...
/>
```

### 5. Otimizar Rate Limiting

```typescript
// Aumentar delays em lib/riotApi.ts
await delay(200)  // De 100ms para 200ms

// Reduzir tamanho dos batches
const matchDetailsBatch = await processBatch(
  matchesToProcess,
  2,    // De 3 para 2
  async (matchId) => getMatchDetails(matchId),
  1000  // De 500ms para 1000ms
)
```

---

## Boas Práticas

### Do's ✅

- **Sempre validar inputs** do usuário
- **Usar TypeScript** para type safety
- **Implementar error handling** adequado
- **Adicionar logs** para debugging
- **Testar localmente** antes de commitar
- **Fazer commits pequenos** e descritivos
- **Documentar mudanças** importantes
- **Seguir convenções** estabelecidas

### Don'ts ❌

- **Nunca commitar** `.env.local`
- **Nunca expor** chaves de API no frontend
- **Nunca fazer** deploy sem testar
- **Nunca ignorar** erros silenciosamente
- **Nunca usar** `any` sem necessidade
- **Nunca deixar** `console.log` em produção (excessivos)
- **Nunca fazer** force push em `main`

---

## Próximos Passos

Após dominar o desenvolvimento:

1. **Deploy**: Consulte [Guia de Deployment](./DEPLOYMENT.md)
2. **Troubleshooting**: Veja [Guia de Resolução](./TROUBLESHOOTING.md)
3. **API Reference**: Entenda [Documentação da API](./API.md)

---

**Próximo**: [Deployment Guide](./DEPLOYMENT.md) | [Voltar ao Índice](./README.md)

