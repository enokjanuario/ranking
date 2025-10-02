# 🚀 Guia Rápido de Configuração

## Passo a Passo para Começar

### 1. Obter sua Riot API Key

1. Acesse [https://developer.riotgames.com/](https://developer.riotgames.com/)
2. Faça login com sua conta Riot
3. No Dashboard, copie sua "Development API Key"
4. ⚠️ **Importante**: Esta chave expira em 24 horas. Para produção, solicite uma Production Key.

### 2. Instalar Dependências

```bash
npm install
```

Aguarde a instalação de todas as dependências (Next.js, React, Tailwind, Framer Motion, etc.)

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (no mesmo nível que `package.json`):

```env
RIOT_API_KEY=RGAPI-sua-chave-aqui
RIOT_REGION=br1
RIOT_ROUTING=americas
```

**Explicação das variáveis:**
- `RIOT_API_KEY`: Sua chave obtida no passo 1
- `RIOT_REGION`: Região do servidor (br1 para Brasil)
- `RIOT_ROUTING`: Roteamento regional (americas para BR, NA, LAN, LAS, OCE)

**Regiões Disponíveis:**
- **Brasil**: `br1` (routing: `americas`)
- **North America**: `na1` (routing: `americas`)
- **EU West**: `euw1` (routing: `europe`)
- **Korea**: `kr` (routing: `asia`)
- **E mais**: la1, la2, oc1, eun1, tr1, ru, jp1

### 4. Configurar Jogadores

Abra o arquivo `lib/constants.ts` e edite a lista `TRACKED_PLAYERS`:

```typescript
export const TRACKED_PLAYERS = [
  'Brtt#BR1',
  'Kami#BR1',
  'Robo#BR1',
  // ... adicione seus 15 jogadores aqui
]
```

**Formato importante:** `NomeNoJogo#TAG`

**Como encontrar o Riot ID:**
- No cliente do LoL, o nome aparece como: `NomeNoJogo #TAG`
- Exemplo: Se no jogo aparece "Brtt #BR1", use `'Brtt#BR1'`
- A TAG pode variar (BR1, NA1, EUW, etc.)

### 5. Iniciar o Projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 6. Primeira Execução

Na primeira execução, o carregamento pode demorar alguns minutos porque:
- O sistema precisa buscar dados de 15 jogadores
- Para cada jogador, busca até 50 partidas recentes
- Há delays entre requisições para respeitar rate limits

**Seja paciente na primeira vez!** ⏳

## ⚡ Dicas de Uso

### Para Testar Rapidamente

1. Comece com apenas 3-5 jogadores em `TRACKED_PLAYERS`
2. Após confirmar que funciona, adicione os demais

### Se Estiver Muito Lento

Em `lib/riotApi.ts`, linha ~87, reduza o número de partidas:
```typescript
const matchesToProcess = matchIds.slice(0, 20) // Em vez de 50
```

### Atualizações

- O ranking atualiza automaticamente a cada 5 minutos
- Use o botão "Atualizar Agora" para forçar uma atualização
- Selecione diferentes meses para ver o histórico

## 🔍 Verificando se Funcionou

Após iniciar o servidor, você deve ver:
1. ✅ O título "Ranking Mensal de LoL" no topo
2. ✅ Um seletor de mês
3. ✅ Um botão "Atualizar Agora"
4. ✅ Loading spinner enquanto carrega
5. ✅ Cards dos jogadores com suas estatísticas

## 🐛 Problemas Comuns

### "Failed to fetch ranking data"
- Verifique se o `.env.local` existe e está correto
- Confirme se sua API key é válida
- Veja o console do terminal onde rodou `npm run dev`

### "Account not found"
- Verifique o formato do Riot ID: `Nome#TAG`
- Certifique-se de que não há espaços extras
- Confirme se o jogador existe naquela região

### API Key Expirada
- Keys de desenvolvimento expiram em 24h
- Gere uma nova no dashboard da Riot
- Atualize no `.env.local`

### Site não carrega
- Certifique-se de estar em [http://localhost:3000](http://localhost:3000)
- Verifique se a porta 3000 não está em uso
- Veja o terminal para mensagens de erro

## 📞 Precisa de Ajuda?

1. Verifique o console do navegador (F12)
2. Verifique o terminal onde o servidor está rodando
3. Leia as mensagens de erro - elas geralmente indicam o problema

## 🎉 Pronto!

Agora você tem um ranking de LoL totalmente funcional! 

Personalize as cores em `tailwind.config.js` e divirta-se! 🎮

