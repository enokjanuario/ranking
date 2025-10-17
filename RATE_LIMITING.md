# Sistema de Rate Limiting

## Limites da Riot API

- **20 requisicoes a cada 1 segundo**
- **100 requisicoes a cada 2 minutos**

## Solucao Implementada

### 1. Rate Limiter Conservador

**Configuracao:**
- **Batch size**: 3 requisicoes por vez
- **Delay entre batches**: 500ms
- **Delay em outras chamadas**: 200ms
- **Taxa resultante**: ~6 req/s

**Calculo:**
```
3 requisicoes / 500ms = 6 req/s
Margem de seguranca: 20 - 6 = 14 req/s (70% de folga)
```

### 2. Mutex (Lock System)

Garante que apenas uma atualizacao de cache aconteca por vez, evitando requisicoes concorrentes.

### 3. Cache Serverless

Em ambientes serverless (Vercel), o cache funciona apenas em memoria, sem persistencia em disco.

## Metricas de Performance

### Com 3 jogadores (~225 requisicoes):
- **Tempo de atualizacao**: ~37.5 segundos
- **Taxa**: ~6 req/s (30% do limite)
- **Margem**: 70% de folga

### Com 15 jogadores (~1.125 requisicoes):
- **Tempo**: ~187 segundos (3min 7s)
- **Taxa**: ~6 req/s (30% do limite)
- **Margem**: Seguro dentro de 2min limite

## Beneficios

1. **70% de margem de seguranca**
2. **Mutex evita concorrencia**
3. **Cache de 15min: usuarios nao sentem a diferenca**
4. **Compativel com serverless**
