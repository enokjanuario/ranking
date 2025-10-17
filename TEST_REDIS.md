# Como Testar Redis Localmente

## Setup Rapido (5 minutos)

### 1. Criar conta Upstash
- Acesse: https://console.upstash.com/
- Cadastre-se (pode usar GitHub)

### 2. Criar database Redis
- Clique em "Create Database"
- Nome: `ranking-cache`
- Region: `us-east-1`
- Clique em "Create"

### 3. Copiar credenciais
Na pagina do database, copie:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 4. Configurar arquivo .env.local

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Riot API (suas credenciais atuais)
RIOT_API_KEY=sua_chave_atual
RIOT_REGION=br1
RIOT_ROUTING=americas

# Upstash Redis (cole as credenciais que voce copiou)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxxxxxxxxxxxxxxxxxxxx
```

### 5. Atualizar o import da cache

Abra `app/api/ranking/route.ts` e mude a linha 4:

**Antes:**
```typescript
import { getCache, setCache, initCache, acquireUpdateLock, releaseUpdateLock, isUpdateInProgress, waitForUpdate } from '@/lib/cache'
```

**Depois:**
```typescript
import { getCache, setCache, initCache, acquireUpdateLock, releaseUpdateLock, isUpdateInProgress, waitForUpdate } from '@/lib/cache-redis'
```

### 6. Testar

```bash
npm run dev
```

Abra http://localhost:3000

**Logs esperados:**
```
✅ Redis conectado com sucesso
📦 Cache em memoria inicializado (ambiente serverless)
```

Na primeira carga:
```
⚠️  Cache nao encontrado para 2025-10
🔒 Lock adquirido para 2025-10
🚀 Iniciando busca de dados para 2025-10
💾 Cache atualizado no Redis para 2025-10 com 3 jogadores
🔓 Lock liberado para 2025-10
```

Na segunda carga (recarregue a pagina):
```
✅ Cache valido para 2025-10 (expira em 14min)
```

## Testes

### Teste 1: Cache persiste
1. Acesse o site
2. Pare o servidor (Ctrl+C)
3. Inicie novamente: `npm run dev`
4. Acesse o site novamente
5. ✅ Deve usar cache (instantaneo)

### Teste 2: Ver dados no Redis
1. Acesse: https://console.upstash.com
2. Clique no seu database
3. Clique em "Data Browser"
4. Veja as chaves:
   - `ranking:cache:2025-10` (dados do cache)
   - `ranking:lock:2025-10` (se houver update em progresso)

### Teste 3: Cache expira
1. No Redis Dashboard, veja o TTL da chave
2. Aguarde 15 minutos OU
3. Delete a chave manualmente no "Data Browser"
4. Proxima requisicao vai buscar dados novos

## Voltar para cache em memoria

Se quiser voltar ao cache antigo:

1. Abra `app/api/ranking/route.ts`
2. Mude o import de volta:
```typescript
import { getCache, setCache, ... } from '@/lib/cache'
```

3. Restart: `npm run dev`

## Deploy na Vercel (apos testar)

1. No dashboard da Vercel > Settings > Environment Variables
2. Adicione:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Commite e push:
```bash
git add .
git commit -m "Add Redis cache"
git push
```

## Troubleshooting

**Erro: "Redis connection failed"**
- Verifique se `.env.local` existe
- Verifique se as credenciais estao corretas
- Reinicie o servidor

**Cache nao funciona**
- Verifique os logs do console
- Veja se aparece "Redis conectado"
- Verifique no Upstash Dashboard se comandos estao sendo executados

**Muito lento**
- Normal na primeira carga (busca API)
- Cargas seguintes devem ser instantaneas

