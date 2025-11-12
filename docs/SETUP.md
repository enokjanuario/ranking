# ⚙️ Setup e Instalação

Guia completo para configurar o ambiente de desenvolvimento local.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Configuração do Redis](#configuração-do-redis)
- [Configuração da Riot API](#configuração-da-riot-api)
- [Primeira Execução](#primeira-execução)
- [Verificação](#verificação)

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### Obrigatórios

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Contas Necessárias

1. **Riot Games Developer Account** ([Criar conta](https://developer.riotgames.com/))
2. **Upstash Account** para Redis ([Criar conta](https://upstash.com/))

### Verificar Instalação

```bash
# Verificar Node.js
node --version
# Deve mostrar: v18.x.x ou superior

# Verificar npm
npm --version
# Deve mostrar: 9.x.x ou superior

# Verificar Git
git --version
```

---

## Instalação

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd ranking
```

### 2. Instale as Dependências

```bash
npm install
```

Isso instalará:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Upstash Redis
- Axios
- date-fns
- Framer Motion
- E todas as outras dependências

### 3. Estrutura de Arquivos

Após a instalação, sua estrutura deve ser:

```
ranking/
├── app/
├── components/
├── lib/
├── types/
├── public/
├── docs/
├── node_modules/     ← Criado pelo npm install
├── package.json
├── package-lock.json
└── ...
```

---

## Variáveis de Ambiente

### 1. Criar Arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local`:

```bash
# Windows (Git Bash)
touch .env.local

# Windows (PowerShell)
New-Item .env.local

# Linux/Mac
touch .env.local
```

### 2. Configurar Variáveis

Adicione o seguinte conteúdo ao `.env.local`:

```env
# ============================================
# Riot Games API
# ============================================
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
RIOT_REGION=br1
RIOT_ROUTING=americas

# ============================================
# Upstash Redis
# ============================================
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxxxxxxxxxxxxxxxxxxxx
```

### 3. Descrição das Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `RIOT_API_KEY` | Chave da API da Riot Games | `RGAPI-12345678-...` |
| `RIOT_REGION` | Região do servidor | `br1`, `na1`, `euw1` |
| `RIOT_ROUTING` | Routing para API | `americas`, `europe`, `asia` |
| `UPSTASH_REDIS_REST_URL` | URL do Redis Upstash | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Token de autenticação Redis | `Axxxx...` |

**⚠️ IMPORTANTE**: 
- NUNCA commite o arquivo `.env.local`
- Ele já está incluído no `.gitignore`
- Cada desenvolvedor deve ter seu próprio arquivo

---

## Configuração do Redis

### 1. Criar Database no Upstash

1. Acesse [Upstash Console](https://console.upstash.com)
2. Clique em **"Create Database"**
3. Configurações:
   - **Name**: `yojornada-ranking` (ou qualquer nome)
   - **Type**: Regional ou Global
   - **Region**: Escolha mais próxima (ex: São Paulo para BR)
   - **Primary Region**: Sua região principal
   - **Read Regions**: Opcional
4. Clique em **"Create"**

### 2. Obter Credenciais

No dashboard do database criado:

1. Vá para a aba **"REST API"**
2. Copie:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
3. Cole no seu `.env.local`

### 3. Testar Conexão

Crie um arquivo temporário `test-redis.js`:

```javascript
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

async function test() {
  try {
    await redis.set('test', 'Hello Redis!');
    const value = await redis.get('test');
    console.log('✅ Redis conectado! Valor:', value);
    await redis.del('test');
  } catch (error) {
    console.error('❌ Erro ao conectar Redis:', error);
  }
}

test();
```

Execute:

```bash
node test-redis.js
```

Deve mostrar: `✅ Redis conectado! Valor: Hello Redis!`

**Limpeza**:
```bash
rm test-redis.js
```

---

## Configuração da Riot API

### 1. Criar Conta de Desenvolvedor

1. Acesse [Riot Games Developer Portal](https://developer.riotgames.com/)
2. Faça login com sua conta Riot
3. Aceite os termos de uso

### 2. Gerar API Key

1. No dashboard, encontre **"DEVELOPMENT API KEY"**
2. Clique em **"Regenerate API Key"**
3. Copie a chave (formato: `RGAPI-xxxxxxxx-...`)
4. Cole no seu `.env.local`

**⚠️ IMPORTANTE**:
- A Development API Key expira a cada 24 horas
- Você precisará regenerá-la diariamente durante desenvolvimento
- Para produção, solicite uma Production API Key

### 3. Production API Key (Opcional)

Para deploy em produção:

1. No Developer Portal, vá para **"Apps"**
2. Clique em **"Register Product"**
3. Preencha o formulário:
   - Nome da aplicação
   - Descrição
   - URL do site
   - Como você usa a API
4. Aguarde aprovação (pode levar alguns dias)

### 4. Verificar API Key

Teste sua API key:

```bash
# Substituir SEU_API_KEY pela sua chave
curl -X GET "https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Faker" \
  -H "X-Riot-Token: SEU_API_KEY"
```

Se funcionar, você verá dados JSON do summoner.

### 5. Configurar riot.txt

O arquivo `public/riot.txt` é usado pela Riot para verificar domínios em produção.

**Desenvolvimento**: Não é necessário modificar

**Produção**: 
1. Após deploy, acesse o Developer Portal
2. Registre seu domínio (ex: `yojornada.vercel.app`)
3. A Riot fornecerá um UUID único
4. Substitua o conteúdo de `public/riot.txt` com esse UUID

---

## Primeira Execução

### 1. Configurar Jogadores Rastreados

Edite `lib/constants.ts`:

```typescript
export const TRACKED_PLAYERS = [
  'SeuNome#BR1',      // Substitua pelos jogadores desejados
  'Amigo1#0123',
  'Amigo2#4567',
]

// Opcional: Adicionar apelidos
export const PLAYER_NICKNAMES: Record<string, string> = {
  'SeuNome#BR1': 'Apelido Legal',
  'Amigo1#0123': 'Pro Player',
}
```

**Formato**: `GameName#TagLine`

**Como encontrar**:
1. Abra o LoL
2. Seu Riot ID aparece no perfil
3. Formato: Nome do Jogo + # + Tag

### 2. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Você verá:

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### 3. Acessar Aplicação

Abra seu navegador em: http://localhost:3000

**Primeira carga**:
- Pode levar 15-30 segundos
- Sistema está buscando dados da Riot API
- Cache será criado automaticamente

### 4. Logs Importantes

No terminal, você verá logs como:

```
✅ Redis conectado com sucesso
⚠️  Cache não encontrado para 2025-11
🔒 Lock adquirido para 2025-11
📊 Processando jogador: SeuNome#BR1
✅ Rank encontrado: GOLD II 45 LP
📊 LP Change: +150 LP
💾 Cache atualizado no Redis para 2025-11 com 3 jogadores
🔓 Lock liberado para 2025-11
```

---

## Verificação

### Checklist de Funcionamento

Execute estes testes para garantir que tudo está funcionando:

#### ✅ 1. Página Principal

- [ ] Página carrega sem erros
- [ ] Seletor de mês funciona
- [ ] Tabela mostra jogadores
- [ ] Imagens de rank aparecem
- [ ] Ícones de campeões carregam

#### ✅ 2. API Endpoints

```bash
# Teste /api/ranking
curl "http://localhost:3000/api/ranking?month=2025-11" | jq

# Teste /api/cache-status
curl "http://localhost:3000/api/cache-status" | jq

# Teste /api/clear-cache
curl -X POST "http://localhost:3000/api/clear-cache" | jq
```

Todos devem retornar JSON válido com `"success": true`.

#### ✅ 3. Cache Redis

```bash
# Verificar status do cache
curl "http://localhost:3000/api/cache-status" | jq '.cacheEntries'
```

Deve mostrar pelo menos uma entrada de cache.

#### ✅ 4. Funcionalidades da Tabela

- [ ] Ordenação por colunas funciona
- [ ] Filtro de busca funciona
- [ ] Filtro de mínimo de partidas funciona
- [ ] Estatísticas gerais aparecem no rodapé
- [ ] Contador de jogadores atualiza

#### ✅ 5. Performance

- [ ] Cache hit < 200ms
- [ ] Cache miss < 60s
- [ ] Sem erros no console do navegador
- [ ] Sem erros 429 (Rate Limit) no terminal

---

## Problemas Comuns

### Erro: "Redis connection failed"

**Causa**: Credenciais do Redis incorretas

**Solução**:
1. Verifique `.env.local`
2. Confirme URL e Token no Upstash Dashboard
3. Teste conexão com script acima

### Erro: "401 Unauthorized" da Riot API

**Causa**: API Key inválida ou expirada

**Solução**:
1. Regenere API Key no Developer Portal
2. Atualize `.env.local`
3. Reinicie servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Player not found"

**Causa**: Riot ID incorreto em TRACKED_PLAYERS

**Solução**:
1. Verifique formato: `GameName#TagLine`
2. Confirme no cliente do LoL
3. Teste no site: https://www.op.gg/

### Página em branco ou erro 500

**Causa**: Falta de variáveis de ambiente

**Solução**:
1. Confirme que `.env.local` existe
2. Verifique todas as variáveis estão preenchidas
3. Reinicie servidor

### Build falha

**Causa**: Dependências não instaladas ou versão incorreta do Node

**Solução**:
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versão do Node
node --version  # Deve ser 18+
```

---

## Próximos Passos

Após setup completo:

1. **Desenvolva**: Consulte [Guia de Desenvolvimento](./DEVELOPMENT.md)
2. **Entenda a Arquitetura**: Leia [Arquitetura](./ARCHITECTURE.md)
3. **Deploy**: Siga [Guia de Deployment](./DEPLOYMENT.md)

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor dev (porta 3000)

# Build
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção

# Linting & Formatting (se configurado)
npm run lint         # Verifica código
npm run format       # Formata código

# Limpar cache
rm -rf .next         # Limpa cache do Next.js
```

---

## Suporte

Se encontrar problemas:

1. Consulte [Troubleshooting](./TROUBLESHOOTING.md)
2. Verifique logs do terminal
3. Abra issue no repositório
4. Consulte documentação oficial:
   - [Next.js Docs](https://nextjs.org/docs)
   - [Riot API Docs](https://developer.riotgames.com/docs)
   - [Upstash Docs](https://docs.upstash.com/redis)

---

**Próximo**: [Development Guide](./DEVELOPMENT.md) | [Voltar ao Índice](./README.md)

