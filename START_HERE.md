# 🎮 COMECE AQUI!

## 👋 Bem-vindo ao seu Ranking de League of Legends!

Seu site foi criado com sucesso! Agora você precisa fazer 3 coisas simples para colocá-lo no ar:

---

## ⚡ 3 Passos Rápidos (5 minutos)

### 1️⃣ Instalar Dependências
Abra o terminal nesta pasta e execute:

```bash
npm install
```

Aguarde ~2 minutos para instalar tudo.

---

### 2️⃣ Configurar API Key

**a) Obter a chave:**
1. Acesse: https://developer.riotgames.com/
2. Faça login
3. Copie sua "Development API Key"

**b) Criar arquivo de configuração:**
1. Crie um arquivo chamado `.env.local` nesta pasta
2. Cole o seguinte conteúdo:

```env
RIOT_API_KEY=cole-sua-key-aqui
RIOT_REGION=br1
RIOT_ROUTING=americas
```

3. Substitua `cole-sua-key-aqui` pela key que você copiou
4. Salve o arquivo

---

### 3️⃣ Adicionar Jogadores

**a) Abra o arquivo:** `lib/constants.ts`

**b) Encontre esta parte:**
```typescript
export const TRACKED_PLAYERS = [
  'Player1#BR1',
  'Player2#BR1',
  // ...
]
```

**c) Substitua pelos 15 jogadores que você quer acompanhar:**
```typescript
export const TRACKED_PLAYERS = [
  'Brtt#BR1',
  'Kami#BR1',
  'Robo#BR1',
  // ... adicione 12 a mais
]
```

**Formato importante:** `NomeDoJogador#TAG` (sem espaço antes do #)

**💡 Dica:** Comece com apenas 3-5 jogadores para testar!

---

## 🚀 Iniciar o Site

No terminal, execute:

```bash
npm run dev
```

Depois abra seu navegador em: **http://localhost:3000**

---

## ✅ O que você deve ver

Se tudo funcionou:
1. Título "Ranking Mensal de LoL" no topo
2. Um seletor de mês
3. Um botão "Atualizar Agora"
4. Loading spinner
5. Cards dos jogadores aparecem em ~60 segundos

---

## 🐛 Problemas?

### "Cannot find module..."
→ Execute: `npm install` novamente

### "Failed to fetch ranking data"
→ Verifique se o arquivo `.env.local` existe e tem a API key correta

### "Account not found"
→ Verifique o formato dos jogadores: `Nome#TAG` (sem espaço)

### API Key expirou
→ Keys de desenvolvimento expiram em 24h
→ Gere uma nova em https://developer.riotgames.com/

---

## 📚 Precisa de Mais Ajuda?

Leia estes arquivos (na ordem):

1. **QUICKSTART.txt** - Comandos rápidos
2. **SETUP.md** - Guia detalhado
3. **API_INFO.md** - Tudo sobre a API da Riot
4. **PLAYERS_EXAMPLE.md** - Exemplos de jogadores
5. **README.md** - Documentação completa

---

## 🎨 Personalizar

Quer mudar as cores? Edite: `tailwind.config.js`

Quer mudar o número de partidas analisadas? Edite: `lib/riotApi.ts` (linha 87)

---

## 🌐 Colocar Online

Quando estiver funcionando local, leia: **DEPLOY.md**

Recomendamos **Vercel** (gratuito e fácil).

---

## 📋 Checklist

Antes de começar, certifique-se:

- [ ] Node.js instalado (versão 18+)
- [ ] Conta na Riot Games
- [ ] API Key da Riot
- [ ] Lista de 15 jogadores (nome#tag)
- [ ] 5-10 minutos de tempo

---

## 🎯 Ordem de Execução

```
1. npm install
2. Criar .env.local (com API key)
3. Editar lib/constants.ts (jogadores)
4. npm run dev
5. Acessar http://localhost:3000
6. Aguardar ~60 segundos
7. Ver o ranking! 🎉
```

---

## 💬 Comandos Úteis

```bash
# Instalar tudo
npm install

# Iniciar desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Ver erros de código
npm run lint
```

---

## 🎉 Pronto!

Seu ranking de LoL está pronto para uso!

**Próximos passos:**
1. Teste localmente
2. Customize as cores e design
3. Faça deploy (Vercel é gratuito!)
4. Compartilhe com seus amigos!

---

**Dúvidas?** Leia a documentação ou veja os logs de erro no terminal.

**Funcionou?** Divirta-se e boa sorte no rift! 🎮

---

Desenvolvido com ❤️ para a comunidade de League of Legends

