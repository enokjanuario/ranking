# 🚀 Guia de Deployment

Guia completo para fazer deploy da aplicação na Vercel e configurar produção.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Deploy na Vercel](#deploy-na-vercel)
- [Configuração de Produção](#configuração-de-produção)
- [Verificação Pós-Deploy](#verificação-pós-deploy)
- [Monitoramento](#monitoramento)
- [Troubleshooting de Deploy](#troubleshooting-de-deploy)

---

## Pré-requisitos

Antes de fazer deploy, certifique-se de ter:

### Contas Necessárias

- ✅ Conta na [Vercel](https://vercel.com)
- ✅ Conta no [Upstash Redis](https://upstash.com)
- ✅ Riot API Key válida ([Portal](https://developer.riotgames.com/))
- ✅ Repositório Git (GitHub/GitLab/Bitbucket)

### Build Local Funcional

```bash
# Teste build local
npm run build

# Deve completar sem erros
# Verificar output: .next/
```

---

## Deploy na Vercel

### Método 1: Via Dashboard (Recomendado)

#### 1. Conectar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..." → "Project"**
3. Selecione seu Git provider (GitHub/GitLab/Bitbucket)
4. Autorize acesso ao repositório
5. Selecione o repositório `ranking`
6. Clique em **"Import"**

#### 2. Configurar Projeto

**Framework Preset**: Next.js (detectado automaticamente)

**Build Settings**:
```
Framework: Next.js
Build Command: npm run build
Output Directory: .next (default)
Install Command: npm install
```

**Root Directory**: `.` (raiz do projeto)

#### 3. Configurar Environment Variables

Na seção **"Environment Variables"**, adicione:

| Name | Value | Environment |
|------|-------|-------------|
| `RIOT_API_KEY` | `RGAPI-xxxxxxxx-...` | Production, Preview, Development |
| `RIOT_REGION` | `br1` | Production, Preview, Development |
| `RIOT_ROUTING` | `americas` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | `Axxxxxxxxxxxx` | Production, Preview, Development |

**⚠️ IMPORTANTE**: 
- Adicionar variáveis para **todos** os ambientes (Production, Preview, Development)
- Valores sensíveis não são mostrados após salvos (segurança)

#### 4. Deploy!

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Deploy completo! 🎉

**URL de Produção**: `https://seu-projeto.vercel.app`

---

### Método 2: Via CLI

#### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

#### 2. Login

```bash
vercel login
```

Seguir instruções no navegador.

#### 3. Deploy

```bash
# Na raiz do projeto
vercel

# Responder perguntas:
# ? Set up and deploy "~/path/to/ranking"? [Y/n] y
# ? Which scope? Seu username
# ? Link to existing project? [y/N] n
# ? What's your project's name? ranking
# ? In which directory is your code located? ./

# Aguardar build e deploy
```

#### 4. Deploy para Produção

```bash
# Deploy de produção (domínio principal)
vercel --prod
```

#### 5. Adicionar Environment Variables via CLI

```bash
# Adicionar variável
vercel env add RIOT_API_KEY

# Seguir prompts:
# ? What's the value of RIOT_API_KEY? RGAPI-xxxxx
# ? Add RIOT_API_KEY to which Environments? Production, Preview, Development

# Repetir para todas as variáveis
```

---

## Configuração de Produção

### 1. Production API Key (Riot)

A Development API Key expira a cada 24h. Para produção, solicite uma Production API Key:

#### Solicitar Production API Key

1. Acesse [Riot Developer Portal](https://developer.riotgames.com/)
2. Vá para **"Apps" → "Register Product"**
3. Preencha o formulário:

```
Application Name: YoJornada Ranking System
Description: Sistema de ranking mensal para jogadores de League of Legends
Website URL: https://seu-projeto.vercel.app
API Usage: Tracking player rankings and match statistics
```

4. Aguarde aprovação (1-7 dias)
5. Após aprovação, obtenha a Production API Key
6. Atualize no Vercel:
   - Dashboard → Projeto → Settings → Environment Variables
   - Edite `RIOT_API_KEY` para Production

### 2. Verificação Riot (riot.txt)

Riot requer verificação de domínio via arquivo `riot.txt`:

#### Passo 1: Obter UUID

1. No Riot Developer Portal, vá para **"Apps"**
2. Clique em sua aplicação
3. Em **"App Verification"**, copie o UUID único

#### Passo 2: Atualizar riot.txt

**Arquivo**: `public/riot.txt`

```
7de1096e-d9c2-49b1-8a1d-272c06244ba6
```

Substitua pelo UUID fornecido pela Riot.

#### Passo 3: Verificar

Após deploy, acesse:
```
https://seu-projeto.vercel.app/riot.txt
```

Deve exibir o UUID. Riot verificará automaticamente.

### 3. Configuração de Domínio (Opcional)

#### Adicionar Domínio Customizado

1. No Vercel Dashboard, vá para **Settings → Domains**
2. Clique em **"Add"**
3. Digite seu domínio (ex: `ranking.seusite.com`)
4. Seguir instruções para configurar DNS:

**A Record**:
```
Type: A
Name: @ ou ranking
Value: 76.76.21.21
```

**CNAME Record** (alternativa):
```
Type: CNAME
Name: ranking
Value: cname.vercel-dns.com
```

5. Aguardar propagação DNS (5min - 48h)
6. Vercel configurará SSL automaticamente

### 4. Ajustes de Performance

#### vercel.json

Criar/atualizar `vercel.json` na raiz:

```json
{
  "functions": {
    "app/api/ranking/route.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/riot.txt",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/plain; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Notas**:
- `maxDuration`: Vercel Hobby tem limite de 10s, Pro tem 60s
- Headers de segurança aplicados a todas as rotas

---

## Verificação Pós-Deploy

### Checklist de Deploy

Execute após cada deploy:

#### ✅ 1. Build Completado

- [ ] Build finalizou sem erros
- [ ] Logs do build não mostram warnings críticos
- [ ] Todas as páginas foram geradas

#### ✅ 2. Acesso à Aplicação

```bash
# Abrir no navegador
open https://seu-projeto.vercel.app

# Ou via curl
curl -I https://seu-projeto.vercel.app
# Deve retornar: HTTP/2 200
```

- [ ] Página principal carrega
- [ ] Imagens aparecem
- [ ] CSS/JS carregam

#### ✅ 3. API Endpoints

```bash
# Teste /api/ranking
curl "https://seu-projeto.vercel.app/api/ranking?month=2025-11" | jq

# Teste /api/cache-status
curl "https://seu-projeto.vercel.app/api/cache-status" | jq

# Teste /api/clear-cache (cuidado em produção!)
curl -X POST "https://seu-projeto.vercel.app/api/clear-cache" | jq
```

- [ ] Todos retornam `"success": true`
- [ ] Dados corretos são retornados
- [ ] Tempo de resposta aceitável (<2s)

#### ✅ 4. Riot API Integration

- [ ] Jogadores são carregados
- [ ] Ranks aparecem corretamente
- [ ] Partidas são processadas
- [ ] Sem erros 401/403 (API key)

#### ✅ 5. Cache Redis

- [ ] Cache está funcionando
- [ ] Dados são salvos no Redis
- [ ] TTL está configurado corretamente
- [ ] Lock mechanism funciona

#### ✅ 6. Verificação Riot

```bash
# Verificar riot.txt
curl https://seu-projeto.vercel.app/riot.txt

# Deve retornar UUID correto
```

#### ✅ 7. Performance

- [ ] First Load < 3s
- [ ] Cache hit < 500ms
- [ ] Imagens otimizadas
- [ ] Core Web Vitals OK

#### ✅ 8. Mobile/Responsive

- [ ] Layout responsivo funciona
- [ ] Tabela scroll horizontal em mobile
- [ ] Filtros funcionam em mobile
- [ ] Touch interactions OK

#### ✅ 9. Error Handling

- [ ] Página 404 customizada (se configurada)
- [ ] Erros não quebram a aplicação
- [ ] Mensagens de erro amigáveis

---

## Monitoramento

### 1. Vercel Analytics

**Ativar**:
1. Vercel Dashboard → Projeto → Analytics
2. Habilitar Analytics
3. Visualizar métricas:
   - Page views
   - Top pages
   - Top referrers
   - Devices
   - Countries

### 2. Vercel Logs

**Acessar**:
```
Dashboard → Projeto → Deployments → [Deployment] → Runtime Logs
```

**Filtros úteis**:
- Por status (error, warn, info)
- Por função (API routes)
- Por tempo (última hora, dia, semana)

**Monitorar**:
- Erros de runtime
- Rate limits da Riot API
- Falhas no Redis
- Timeouts

### 3. Upstash Dashboard

**Monitorar Redis**:
1. Acesse [Upstash Console](https://console.upstash.com)
2. Selecione seu database
3. Visualizar:
   - **Metrics**: Requests, latency, storage
   - **Data Browser**: Ver chaves e valores
   - **Logs**: Operações recentes

**Alertas importantes**:
- Storage próximo do limite
- Latência aumentada
- Erros de conexão

### 4. Core Web Vitals

**Ferramentas**:
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- Vercel Analytics

**Métricas-alvo**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 5. Uptime Monitoring

**Ferramentas gratuitas**:
- [UptimeRobot](https://uptimerobot.com/)
- [Freshping](https://www.freshworks.com/website-monitoring/)
- [Cronitor](https://cronitor.io/)

**Configurar**:
- Monitorar: `https://seu-projeto.vercel.app/api/ranking?month=2025-11`
- Intervalo: 5 minutos
- Alertas: Email/SMS quando down

---

## Troubleshooting de Deploy

### Problema: Build Falha

**Sintoma**: Deploy falha na etapa de build

**Logs típicos**:
```
Error: Process completed with exit code 1.
```

**Soluções**:

```bash
# 1. Testar build local
npm run build

# 2. Verificar erros TypeScript
npm run type-check  # Se configurado

# 3. Limpar cache
rm -rf .next node_modules
npm install
npm run build

# 4. Verificar versão do Node
# Vercel usa Node 18 por default
# Especificar versão em package.json:
{
  "engines": {
    "node": "18.x"
  }
}
```

### Problema: Environment Variables Não Funcionam

**Sintoma**: Erros como "API key undefined"

**Solução**:

1. Verificar variáveis no Dashboard:
   - Settings → Environment Variables
2. Certificar que estão marcadas para **Production**
3. Verificar nome exato (case-sensitive)
4. **Redeploy** após adicionar variáveis:
   ```bash
   vercel --prod
   ```

### Problema: Redis Connection Failed

**Sintoma**: Logs mostram "Redis connection failed"

**Solução**:

1. Verificar credenciais no Vercel:
   - `UPSTASH_REDIS_REST_URL` correto?
   - `UPSTASH_REDIS_REST_TOKEN` correto?
2. Testar no Upstash Dashboard:
   - Database está ativo?
   - Região correta?
3. Verificar rate limits do Upstash
4. Verificar firewall/IP whitelist (se configurado)

### Problema: Timeout Errors (Function Exceeded Duration)

**Sintoma**: "Error: FUNCTION_INVOCATION_TIMEOUT"

**Causa**: Função serverless excedeu tempo limite

**Soluções**:

1. **Vercel Pro**: Aumentar em `vercel.json`:
   ```json
   {
     "functions": {
       "app/api/ranking/route.ts": {
         "maxDuration": 60
       }
     }
   }
   ```

2. **Otimizar código**:
   - Reduzir número de requisições
   - Aumentar batch delays
   - Limitar histórico de partidas

3. **Cache mais agressivo**:
   - Aumentar TTL
   - Retornar cache stale se necessário

### Problema: Rate Limit 429

**Sintoma**: Muitos erros 429 da Riot API

**Solução**:

1. Aumentar delays em `lib/riotApi.ts`:
   ```typescript
   await delay(200)  // Aumentar de 100ms
   ```

2. Reduzir batch size:
   ```typescript
   processBatch(items, 2, processor, 1000)  // De 3 para 2
   ```

3. Implementar exponential backoff
4. Considerar Production API Key (limits maiores)

### Problema: Imagens Não Carregam

**Sintoma**: Imagens de rank ou campeões não aparecem

**Solução**:

1. Verificar arquivos em `/public`:
   ```bash
   ls -la public/*.webp
   ```

2. Configurar domínios de imagens em `next.config.js`:
   ```javascript
   module.exports = {
     images: {
       domains: [
         'ddragon.leagueoflegends.com',
         'cdn.communitydragon.org',
       ],
     },
   }
   ```

3. Redeploy após mudanças

---

## Rollback de Deploy

Se algo der errado, você pode reverter para deploy anterior:

### Via Dashboard

1. Vercel Dashboard → Projeto → Deployments
2. Encontre deploy anterior funcional
3. Clique nos 3 pontos → **"Promote to Production"**

### Via CLI

```bash
# Listar deployments
vercel ls

# Promover deployment específico
vercel promote <deployment-url>
```

---

## Continuous Deployment (CD)

Vercel automaticamente faz deploy em:

- **Production**: Push para branch `main`
- **Preview**: Push para qualquer branch ou Pull Request

### Configurar Branch de Deploy

Dashboard → Settings → Git:
- **Production Branch**: `main` (ou `master`)
- **Branches to Deploy**: Todas ou específicas

### Preview Deployments

Cada PR recebe URL única:
```
https://ranking-abc123.vercel.app
```

Perfeito para:
- Testar features antes de merge
- QA/Review
- Compartilhar com equipe

---

## Próximos Passos

Após deploy bem-sucedido:

1. **Monitorar**: Configure alertas e monitore métricas
2. **Otimizar**: Use insights do Vercel Analytics
3. **Documentar**: Anote configurações e decisões
4. **Backup**: Configure backups do Redis (se crítico)

---

## Recursos Adicionais

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Riot API Production](https://developer.riotgames.com/docs/portal#web-apis_production-api-keys)

---

**Próximo**: [Troubleshooting Guide](./TROUBLESHOOTING.md) | [Voltar ao Índice](./README.md)

