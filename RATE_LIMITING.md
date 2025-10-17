# Sistema de Rate Limiting

## Limites da Riot API

- **20 requisicoes a cada 1 segundo**
- **100 requisicoes a cada 2 minutos**

## Solucao Implementada

### 1. Rate Limiter Conservador

**Configuracao:**
- **Batch size**: 5 requisicoes por vez (reduzido de 10)
- **Delay entre batches**: 300ms (aumentado de 100ms)
- **Resultado**: ~16.6 req/s (abaixo do limite de 20 req/s)

**Calculo:**
```
5 requisicoes / 300ms = 16.6 req/s
Margem de seguranca: 20 - 16.6 = 3.4 req/s (17% de folga)
```

### 2. Mutex (Lock System)

**Objetivo:**
Garantir que apenas uma atualizacao de cache aconteca por vez, evitando requisicoes concorrentes.

**Como funciona:**
1. Antes de iniciar uma atualizacao, verifica se ja ha uma em progresso
2. Se sim, aguarda a atualizacao terminar e retorna o cache atualizado
3. Se nao, adquire o lock e inicia a atualizacao
4. Apos terminar (com sucesso ou erro), libera o lock automaticamente

**Funcoes implementadas:**
- `acquireUpdateLock(month)` - Tenta adquirir lock
- `releaseUpdateLock(month)` - Libera lock
- `isUpdateInProgress(month)` - Verifica se ha update em progresso
- `waitForUpdate(month)` - Aguarda update terminar

### 3. Fluxo de Atualizacao

```
Usuario 1 requisita dados -> Cache valido? -> Sim -> Retorna cache
                                            -> Nao -> Update em progresso?
                                                   -> Sim -> Aguarda e retorna cache
                                                   -> Nao -> Adquire lock -> Busca API -> Salva cache -> Libera lock
```

Se Usuario 2 requisita enquanto Usuario 1 esta atualizando:
- Usuario 2 aguarda
- Quando Usuario 1 termina, Usuario 2 recebe o cache atualizado
- Sem requisicoes duplicadas a API

## Metricas de Performance

### Com 3 jogadores (~225 requisicoes):
- **Tempo de atualizacao**: ~13.5 segundos
- **Taxa de requisicoes**: 16.6 req/s
- **Uso do limite de 1s**: 83% (20 req/s disponivel)
- **Uso do limite de 2min**: 225 req em 13.5s = 13% do tempo (87% de folga)

### Com 15 jogadores (~1.125 requisicoes):
- **Tempo de atualizacao**: ~67.5 segundos (1min 7s)
- **Taxa de requisicoes**: 16.6 req/s
- **Uso do limite de 1s**: 83%
- **Uso do limite de 2min**: 1.125 req em 67s = 56% do tempo

## Beneficios

1. **Respeita limites da Riot**: Sempre abaixo dos 20 req/s
2. **Margem de seguranca**: 17% de folga para picos
3. **Evita concorrencia**: Mutex garante apenas 1 update por vez
4. **Cache eficiente**: Com 15min de cache, usuarios nao sentem a diferenca
5. **Protecao automatica**: Sistema se auto-regula

## Logs

O sistema gera logs uteis para monitoramento:

```
Lock adquirido para 2025-10
Iniciando busca de dados para 2025-10
Lock liberado para 2025-10
```

Se houver concorrencia:
```
Atualizacao ja em progresso para 2025-10, aguardando...
Aguardando atualizacao em progresso para 2025-10...
```

## Testes

Para testar o sistema de rate limiting:

1. **Teste de cache**: Acesse o site varias vezes rapidamente
   - Deve retornar cache instantaneamente
   - Nao deve fazer novas requisicoes a API

2. **Teste de concorrencia**: Abra multiplas abas e atualize simultaneamente
   - Apenas uma atualizacao deve acontecer
   - Outras devem aguardar e receber o cache

3. **Teste de expiracao**: Aguarde 16 minutos
   - Proxima requisicao deve atualizar
   - Deve levar ~13.5 segundos (3 jogadores)

## Monitoramento

Use os logs do servidor para verificar:
- Tempo de atualizacao
- Se o mutex esta funcionando
- Quantas requisicoes estao sendo feitas

No Vercel, acesse: Dashboard > Projeto > Functions > Logs

