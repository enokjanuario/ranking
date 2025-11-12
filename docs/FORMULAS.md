# 📐 Fórmulas e Cálculos

Documentação completa de todas as fórmulas matemáticas e cálculos utilizados no sistema.

## 📋 Índice

- [Estatísticas de Jogo](#estatísticas-de-jogo)
- [Sistema de LP](#sistema-de-lp)
- [Cálculos de Ranking](#cálculos-de-ranking)
- [Cache e Tempo](#cache-e-tempo)

---

## Estatísticas de Jogo

### Win Rate

Taxa de vitória em porcentagem.

**Fórmula**:
```
winRate = (wins / totalGames) × 100
```

**Exemplo**:
```
Wins: 15
Total Games: 25

winRate = (15 / 25) × 100 = 60%
```

**Implementação**:
```typescript
const winRate = totalGames > 0 
  ? (wins / totalGames) * 100 
  : 0
```

**Casos Especiais**:
- Se `totalGames === 0`, retorna `0`
- Resultado arredondado para 2 casas decimais: `60.00%`

---

### KDA (Kill/Death/Assist Ratio)

Razão entre eliminações/assistências e mortes.

**Fórmula**:

**Com mortes**:
```
KDA = (kills + assists) / deaths
```

**Sem mortes** (Perfect KDA):
```
KDA = kills + assists
```

**Exemplos**:

```
Exemplo 1:
Kills: 100
Deaths: 50
Assists: 150

KDA = (100 + 150) / 50 = 5.0
```

```
Exemplo 2 (Perfect):
Kills: 10
Deaths: 0
Assists: 15

KDA = 10 + 15 = 25.0
```

**Implementação**:
```typescript
const kda = deaths > 0 
  ? (kills + assists) / deaths 
  : (kills + assists)
```

**Interpretação**:
- `KDA >= 4.0`: Excelente
- `KDA >= 3.0`: Muito bom
- `KDA >= 2.0`: Bom
- `KDA < 2.0`: Precisa melhorar

---

### CS Médio (Creep Score)

Média de minions/monstros abatidos por jogo.

**Fórmula**:
```
avgCS = totalCS / totalGames
totalCS = totalMinionsKilled + neutralMinionsKilled
```

**Exemplo**:
```
Total Minions Killed: 2000
Neutral Minions Killed: 500
Total Games: 15

totalCS = 2000 + 500 = 2500
avgCS = 2500 / 15 = 166.67
```

**Implementação**:
```typescript
let totalCS = 0

for (const match of matches) {
  totalCS += participant.totalMinionsKilled + participant.neutralMinionsKilled
}

const avgCS = totalGames > 0 
  ? totalCS / totalGames 
  : 0
```

**Benchmarks**:
- `avgCS >= 200`: Excelente farm
- `avgCS >= 150`: Bom farm
- `avgCS < 150`: Farm abaixo do esperado

---

### Duração Média de Jogo

Tempo médio de partida em minutos.

**Fórmula**:
```
avgGameDuration = (totalDuration / totalGames) / 60
```

Onde `totalDuration` está em segundos.

**Exemplo**:
```
Total Duration: 15000 segundos
Total Games: 10

avgGameDuration = (15000 / 10) / 60 = 25 minutos
```

**Implementação**:
```typescript
let totalDuration = 0

for (const match of matches) {
  totalDuration += match.info.gameDuration
}

const avgGameDuration = totalGames > 0 
  ? (totalDuration / totalGames) / 60 
  : 0
```

---

## Sistema de LP

### LP Absoluto

Conversão de tier/division/LP para valor absoluto comparável.

**Valores Base**:

```typescript
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

const DIVISION_VALUES: { [key: string]: number } = {
  'IV': 0,
  'III': 100,
  'II': 200,
  'I': 300,
}
```

**Fórmula**:

**Para tiers com divisões** (Iron até Diamond):
```
absoluteLP = tierValue + divisionValue + currentLP
```

**Para tiers sem divisões** (Master+):
```
absoluteLP = tierValue + currentLP
```

**Exemplos**:

```
Exemplo 1: Iron IV 50 LP
tierValue = 0
divisionValue = 0
currentLP = 50
absoluteLP = 0 + 0 + 50 = 50
```

```
Exemplo 2: Bronze III 25 LP
tierValue = 400
divisionValue = 100
currentLP = 25
absoluteLP = 400 + 100 + 25 = 525
```

```
Exemplo 3: Silver II 75 LP
tierValue = 800
divisionValue = 200
currentLP = 75
absoluteLP = 800 + 200 + 75 = 1075
```

```
Exemplo 4: Gold I 0 LP
tierValue = 1200
divisionValue = 300
currentLP = 0
absoluteLP = 1200 + 300 + 0 = 1500
```

```
Exemplo 5: Master 150 LP
tierValue = 2800
currentLP = 150
absoluteLP = 2800 + 150 = 2950
```

**Implementação**:
```typescript
function rankToAbsoluteLP(rank: RankInfo | undefined): number {
  if (!rank) return 0

  const tierValue = TIER_VALUES[rank.tier] || 0
  
  // Master+ não usa divisões
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier)) {
    return tierValue + rank.lp
  }
  
  const divisionValue = DIVISION_VALUES[rank.rank] || 0
  return tierValue + divisionValue + rank.lp
}
```

---

### LP Change

Mudança de LP entre dois momentos.

**Fórmula**:
```
lpChange = currentAbsoluteLP - previousAbsoluteLP
```

**Exemplo de Progressão**:
```
Início do mês: Gold III 60 LP
  tierValue = 1200
  divisionValue = 100
  currentLP = 60
  previousAbsoluteLP = 1200 + 100 + 60 = 1360

Fim do mês: Gold I 85 LP
  tierValue = 1200
  divisionValue = 300
  currentLP = 85
  currentAbsoluteLP = 1200 + 300 + 85 = 1585

LP Change = 1585 - 1360 = +225 LP
```

**Exemplo de Queda**:
```
Início: Platinum II 40 LP
  previousAbsoluteLP = 1600 + 200 + 40 = 1840

Fim: Platinum III 15 LP
  currentAbsoluteLP = 1600 + 100 + 15 = 1715

LP Change = 1715 - 1840 = -125 LP
```

**Implementação**:
```typescript
function calculateLPChange(
  currentRank: RankInfo | undefined,
  previousRank: RankInfo | undefined
): number {
  const currentLP = rankToAbsoluteLP(currentRank)
  const previousLP = rankToAbsoluteLP(previousRank)
  return currentLP - previousLP
}
```

**Casos Especiais**:
- Se `previousRank === undefined`: LP change = 0 (primeira vez no mês)
- Se `currentRank === undefined`: LP change baseado em último rank conhecido

---

### Promoção/Demoção

Detectar quando jogador subiu ou desceu de tier/division.

**Promoção**:
```typescript
function wasPromoted(previous: RankInfo, current: RankInfo): boolean {
  const previousLP = rankToAbsoluteLP(previous)
  const currentLP = rankToAbsoluteLP(current)
  return currentLP > previousLP
}
```

**Demoção**:
```typescript
function wasDemoted(previous: RankInfo, current: RankInfo): boolean {
  const previousLP = rankToAbsoluteLP(previous)
  const currentLP = rankToAbsoluteLP(current)
  return currentLP < previousLP
}
```

---

## Cálculos de Ranking

### Posição no Ranking

Jogadores são rankeados por múltiplos critérios em ordem de prioridade.

**Critérios** (em ordem):

1. **Win Rate** (descending - maior melhor)
2. **Total de Vitórias** (descending - maior melhor)
3. **KDA** (descending - maior melhor)
4. **Duração Média** (ascending - menor melhor)

**Algoritmo**:

```typescript
function rankPlayers(
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
    
    // 4. Avg game duration (ascending - faster games win)
    return a.avgGameDuration - b.avgGameDuration
  })

  return sorted.map((player, index) => ({
    ...player,
    position: index + 1,
  }))
}
```

**Exemplo**:

```
Jogador A: WinRate=60%, Wins=30, KDA=3.5, AvgDuration=25min
Jogador B: WinRate=60%, Wins=25, KDA=4.0, AvgDuration=28min
Jogador C: WinRate=55%, Wins=35, KDA=5.0, AvgDuration=22min

Ordenação:
1. A e B têm mesmo WinRate (60%), C tem menor (55%)
2. Entre A e B, A tem mais wins (30 > 25)

Resultado:
1º - Jogador A (60% WR, 30 wins)
2º - Jogador B (60% WR, 25 wins)
3º - Jogador C (55% WR)
```

---

### Desempate

Em caso de todos os critérios serem iguais, a ordem original é mantida (stable sort).

**Exemplo de Empate Total**:
```
Jogador A: WinRate=60%, Wins=30, KDA=3.5, AvgDuration=25min
Jogador B: WinRate=60%, Wins=30, KDA=3.5, AvgDuration=25min

Resultado: Ordem alfabética ou de inserção é mantida
```

---

## Cache e Tempo

### Idade do Cache

Calcula há quanto tempo o cache foi criado.

**Fórmula**:
```
age = currentTime - cacheTimestamp
ageMinutes = age / 60000
```

Onde `age` está em milissegundos.

**Exemplo**:
```
Cache criado: 2025-10-15 14:00:00 (timestamp: 1729000000000)
Agora: 2025-10-15 14:10:00 (timestamp: 1729000600000)

age = 1729000600000 - 1729000000000 = 600000 ms
ageMinutes = 600000 / 60000 = 10 minutos
```

**Implementação**:
```typescript
const age = Date.now() - cacheData.timestamp
const ageMinutes = Math.floor(age / 60000)
```

---

### Tempo até Expiração

Calcula quanto tempo falta para cache expirar.

**Fórmula**:
```
remainingTime = CACHE_DURATION - age
remainingMinutes = remainingTime / 60000
```

**Exemplo**:
```
Cache Duration: 15 minutos (900000 ms)
Cache criado: 14:00:00
Agora: 14:10:00
Age: 10 minutos (600000 ms)

remainingTime = 900000 - 600000 = 300000 ms
remainingMinutes = 300000 / 60000 = 5 minutos
```

**Implementação**:
```typescript
const CACHE_DURATION_MS = CACHE_DURATION_SECONDS * 1000
const age = Date.now() - cacheData.timestamp
const remainingTime = CACHE_DURATION_MS - age
const remainingMinutes = Math.max(0, Math.floor(remainingTime / 60000))
```

---

### Cache Expirado?

Verifica se cache está expirado.

**Fórmula**:
```
isExpired = age > CACHE_DURATION
```

**Implementação**:
```typescript
const CACHE_DURATION_MS = CACHE_DURATION_SECONDS * 1000
const age = Date.now() - cacheData.timestamp
const isExpired = age > CACHE_DURATION_MS
```

**Exemplo**:
```
Cache Duration: 15 minutos
Age: 20 minutos
isExpired = 20 > 15 = true (cache expirado)
```

---

### Período de Tempo (Mês)

Calcula início e fim de um mês em UTC.

**Fórmula**:
```
startTime = Date.UTC(year, month - 1, 1, 0, 0, 0)
endTime = Date.UTC(year, month, 0, 23, 59, 59, 999)
```

**Exemplo**:
```
Mês: 2025-10 (outubro de 2025)

startTime = Date.UTC(2025, 9, 1, 0, 0, 0)
  = 2025-10-01T00:00:00.000Z

endTime = Date.UTC(2025, 10, 0, 23, 59, 59, 999)
  = 2025-10-31T23:59:59.999Z
```

**Implementação**:
```typescript
const [year, month] = monthStr.split('-').map(Number)

const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

const startTime = startOfMonth.getTime()
const endTime = endOfMonth.getTime()
```

**Nota**: JavaScript months são 0-indexed (0 = Janeiro), por isso `month - 1`.

---

## Fórmulas de Cores

### Win Rate Color

Determina cor baseada em win rate.

**Regras**:
```typescript
function getWinRateColor(winRate: number): string {
  if (winRate >= 60) return 'text-green-400'    // Excelente
  if (winRate >= 50) return 'text-yellow-400'   // Bom
  return 'text-red-400'                          // Precisa melhorar
}
```

### KDA Color

Determina cor baseada em KDA.

**Regras**:
```typescript
function getKDAColor(kda: number): string {
  if (kda >= 4) return 'text-cyan-400'      // Excepcional
  if (kda >= 3) return 'text-blue-400'      // Muito bom
  if (kda >= 2) return 'text-green-400'     // Bom
  return 'text-gray-400'                     // Médio/Baixo
}
```

### CS Color

Determina cor baseada em CS médio.

**Regras**:
```typescript
function getCSColor(avgCS: number): string {
  if (avgCS >= 200) return 'text-green-400'    // Excelente
  if (avgCS >= 150) return 'text-yellow-400'   // Bom
  return 'text-gray-400'                        // Abaixo
}
```

---

## Conversões Úteis

### Milissegundos para Minutos
```typescript
const minutes = milliseconds / 60000
```

### Segundos para Minutos
```typescript
const minutes = seconds / 60
```

### Timestamp para Data
```typescript
const date = new Date(timestamp)
```

### Data para Timestamp
```typescript
const timestamp = date.getTime()
```

---

## Estatísticas Agregadas

### Média de Múltiplos Jogadores

```typescript
function calculateAverage(players: PlayerStats[], field: keyof PlayerStats): number {
  const sum = players.reduce((acc, p) => acc + (p[field] as number), 0)
  return players.length > 0 ? sum / players.length : 0
}

// Uso
const avgWinRate = calculateAverage(players, 'winRate')
const avgKDA = calculateAverage(players, 'kda')
```

### Total de Múltiplos Jogadores

```typescript
function calculateTotal(players: PlayerStats[], field: keyof PlayerStats): number {
  return players.reduce((acc, p) => acc + (p[field] as number), 0)
}

// Uso
const totalGames = calculateTotal(players, 'totalGames')
const totalWins = calculateTotal(players, 'wins')
```

---

## Validações

### Range de Win Rate

```typescript
function isValidWinRate(winRate: number): boolean {
  return winRate >= 0 && winRate <= 100
}
```

### Range de KDA

```typescript
function isValidKDA(kda: number): boolean {
  return kda >= 0  // Sem limite superior (Perfect KDA pode ser muito alto)
}
```

### Range de LP

```typescript
function isValidLP(lp: number, tier: string): boolean {
  // Master+ pode ter LP ilimitado
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
    return lp >= 0
  }
  // Outras divisions: 0-100
  return lp >= 0 && lp <= 100
}
```

---

**Próximo**: [Style Guide](./STYLE-GUIDE.md) | [Voltar ao Índice](./README.md)

