# 🔑 Informações sobre a Riot Games API

## Obtendo sua API Key

### Development Key (Gratuita)

1. Acesse: [https://developer.riotgames.com/](https://developer.riotgames.com/)
2. Clique em "SIGN IN" e faça login com sua conta Riot
3. No Dashboard, você verá sua "Development API Key"
4. Copie a chave (formato: `RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Limitações:**
- ⏰ Expira em 24 horas
- 🔢 Rate limit: 20 requisições a cada 1 segundo, 100 a cada 2 minutos
- ⚠️ Apenas para desenvolvimento/testes

### Production Key (Para sites públicos)

Se você quer hospedar o site publicamente:

1. No [Developer Portal](https://developer.riotgames.com/), vá em "Apps"
2. Clique em "Register Product"
3. Preencha o formulário:
   - Nome do projeto
   - Descrição detalhada
   - URL do site
   - Estimativa de tráfego
4. Aguarde aprovação da Riot (geralmente 1-3 dias)

**Vantagens:**
- ✅ Não expira
- ✅ Rate limits maiores
- ✅ Suporte oficial da Riot

---

## Rate Limits

### Development Key:
- **20 requisições/segundo**
- **100 requisições/2 minutos**

### Production Key:
- Varia conforme aprovado pela Riot
- Geralmente muito maior que Dev Key

### Como o projeto respeita os limites:

O código já implementa delays automáticos:

```typescript
// Em lib/riotApi.ts
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Delay de 100ms entre cada requisição
await delay(100)
```

Com 15 jogadores e ~50 partidas cada:
- ~765 requisições por atualização completa
- Com delay de 100ms: ~76 segundos para completar
- Bem dentro dos limites da API

---

## Endpoints Utilizados

O projeto usa os seguintes endpoints da Riot API:

### 1. Account-V1
```
GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
```
- Busca informações da conta pelo Riot ID
- Retorna: PUUID, gameName, tagLine

### 2. Summoner-V4
```
GET /lol/summoner/v4/summoners/by-puuid/{puuid}
```
- Busca informações do invocador
- Retorna: ID, accountId, nivel, etc.

### 3. Match-V5
```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids
```
- Lista IDs de partidas de um jogador
- Parâmetros: start, count, startTime, endTime

```
GET /lol/match/v5/matches/{matchId}
```
- Detalhes completos de uma partida
- Retorna: participantes, estatísticas, duração, etc.

---

## Regiões e Routing

### Regiões (Platform Routing)
Para APIs de Summoner e League:

| Região | Código | Países |
|--------|--------|--------|
| Brasil | `br1` | Brasil |
| North America | `na1` | USA, Canada |
| EU West | `euw1` | UK, Germany, France, etc |
| EU Nordic & East | `eun1` | Poland, Romania, etc |
| Korea | `kr` | South Korea |
| Latin America North | `la1` | Mexico |
| Latin America South | `la2` | Argentina, Chile |
| Oceania | `oc1` | Australia |
| Turkey | `tr1` | Turkey |
| Russia | `ru` | Russia |
| Japan | `jp1` | Japan |

### Regional Routing
Para APIs de Account e Match:

| Routing | Regiões Incluídas |
|---------|-------------------|
| `americas` | na1, br1, la1, la2, oc1 |
| `europe` | euw1, eun1, tr1, ru |
| `asia` | kr, jp1 |
| `sea` | (outras regiões asiáticas) |

### Exemplo de Configuração:

**Para jogadores brasileiros:**
```env
RIOT_REGION=br1
RIOT_ROUTING=americas
```

**Para jogadores europeus:**
```env
RIOT_REGION=euw1
RIOT_ROUTING=europe
```

**Para jogadores coreanos:**
```env
RIOT_REGION=kr
RIOT_ROUTING=asia
```

---

## Dados Retornados

### Por Partida:
- ✅ Resultado (vitória/derrota)
- ✅ Campeão jogado
- ✅ Kills, Deaths, Assists
- ✅ Duração da partida
- ✅ Data/hora da partida
- ✅ Outros 9 jogadores
- ✅ Itens, runas, feitiços
- E muito mais...

### Calculado pelo Sistema:
- 📊 Win rate
- 📊 KDA médio
- 📊 Tempo médio de partida
- 📊 Campeão mais jogado
- 📊 Total de jogos no período

---

## Otimizações e Boas Práticas

### 1. Limite de Partidas
```typescript
// Em lib/riotApi.ts, linha ~87
const matchesToProcess = matchIds.slice(0, 50)
```
Analisa até 50 partidas por jogador. Ajuste conforme necessário.

### 2. Cache (Opcional)
Para produção, considere cachear resultados:
```typescript
// Exemplo com Redis
const cachedData = await redis.get(`ranking:${month}`)
if (cachedData) return JSON.parse(cachedData)

// ... buscar da API ...

await redis.set(`ranking:${month}`, JSON.stringify(data), 'EX', 3600)
```

### 3. Batch Requests
O código já processa jogadores em paralelo:
```typescript
const playerPromises = TRACKED_PLAYERS.map(async (riotId) => {
  // Processamento paralelo
})
const results = await Promise.all(playerPromises)
```

### 4. Error Handling
Tratamento de erros já implementado:
```typescript
try {
  // API call
} catch (error) {
  console.error('Error:', error)
  return null // Continua processando outros jogadores
}
```

---

## Troubleshooting

### 403 Forbidden
```
Error: 403 Forbidden
```
**Causas:**
- API key inválida ou expirada
- API key não tem permissão para essa região

**Solução:**
1. Verifique se a key está correta no `.env.local`
2. Gere uma nova key no Developer Portal
3. Confirme se a região está correta

### 404 Not Found
```
Error: Account not found
```
**Causas:**
- Riot ID incorreto
- Jogador não existe naquela região
- Formato errado (deve ser `Nome#TAG`)

**Solução:**
1. Verifique o formato: `NomeJogador#TAG`
2. Confirme que o jogador existe
3. Veja se a região está correta

### 429 Rate Limit
```
Error: 429 Too Many Requests
```
**Causas:**
- Muitas requisições em pouco tempo
- Ultrapassou rate limit

**Solução:**
1. Aumente os delays em `riotApi.ts`
2. Reduza o número de partidas analisadas
3. Considere obter uma Production Key

### 503 Service Unavailable
```
Error: 503 Service Unavailable
```
**Causas:**
- API da Riot está fora do ar
- Manutenção nos servidores

**Solução:**
1. Aguarde alguns minutos
2. Verifique [status da Riot](https://status.riotgames.com/)
3. Tente novamente mais tarde

---

## Links Úteis

- 📚 [Documentação Oficial](https://developer.riotgames.com/docs/lol)
- 🔧 [Developer Portal](https://developer.riotgames.com/)
- 📊 [API Status](https://status.riotgames.com/)
- 💬 [Community Discord](https://discord.gg/riotgamesdevrel)

---

## Perguntas Frequentes

**Q: Posso usar API de terceiros (op.gg, u.gg)?**
A: Tecnicamente sim, mas essas APIs são não-oficiais e podem mudar. A Riot API oficial é mais confiável.

**Q: Quanto custa a Production Key?**
A: É gratuita! Você só precisa preencher um formulário e aguardar aprovação.

**Q: Posso vender acesso ao meu site?**
A: Consulte os [Termos de Uso](https://developer.riotgames.com/terms) da Riot API.

**Q: A API tem dados de todas as partidas?**
A: Sim, desde que a partida tenha sido jogada recentemente. Partidas muito antigas podem não estar disponíveis.

**Q: Posso buscar dados de ranked/normal/ARAM?**
A: Sim, mas o código atual busca todas as partidas. Você pode filtrar por tipo adicionando parâmetros na chamada da API.

---

Bom desenvolvimento! 🎮

