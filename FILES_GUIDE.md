# 📁 Guia de Arquivos do Projeto

## 🎯 Arquivos que VOCÊ PRECISA EDITAR

### 1. `.env.local` (CRIAR ESTE ARQUIVO!)
```env
RIOT_API_KEY=sua-key-aqui
RIOT_REGION=br1
RIOT_ROUTING=americas
```
**📍 Local:** Raiz do projeto (mesma pasta que package.json)
**✏️ Ação:** CRIAR e adicionar sua API key da Riot

---

### 2. `lib/constants.ts`
```typescript
export const TRACKED_PLAYERS = [
  'Jogador1#BR1',
  'Jogador2#BR1',
  // ... 15 jogadores
]
```
**📍 Local:** `lib/constants.ts`
**✏️ Ação:** EDITAR a lista com seus 15 jogadores

---

## 📚 Arquivos de DOCUMENTAÇÃO (LEIA)

| Arquivo | Para que serve | Quando ler |
|---------|----------------|------------|
| **START_HERE.md** | 🎯 Início rápido | AGORA! Primeiro arquivo |
| **QUICKSTART.txt** | ⚡ Comandos rápidos | Quando quiser referência rápida |
| **SETUP.md** | 📖 Guia passo a passo | Se tiver dúvidas |
| **README.md** | 📘 Documentação completa | Para entender tudo |
| **API_INFO.md** | 🔑 Info sobre Riot API | Se tiver problemas com API |
| **PLAYERS_EXAMPLE.md** | 👥 Exemplos de jogadores | Para ver como adicionar jogadores |
| **DEPLOY.md** | 🚀 Como fazer deploy | Quando quiser colocar online |
| **PROJECT_SUMMARY.md** | 📋 Resumo técnico | Para overview do projeto |
| **FILES_GUIDE.md** | 📁 Este arquivo | Para navegar no projeto |

---

## 💻 Arquivos de CÓDIGO (NÃO MEXA agora)

### Frontend (Interface)
```
app/
├── layout.tsx          # Layout da aplicação
├── page.tsx            # Página principal
└── globals.css         # Estilos globais

components/
├── Header.tsx          # Cabeçalho com filtros
├── RankingList.tsx     # Lista de jogadores
├── PlayerCard.tsx      # Card de cada jogador
└── LoadingSpinner.tsx  # Loading animado
```

### Backend (API)
```
app/api/
└── ranking/
    └── route.ts        # API que busca dados da Riot
```

### Lógica
```
lib/
├── constants.ts        # ⚠️ EDITAR: Jogadores e configs
├── riotApi.ts          # Integração com Riot API
└── locales.ts          # Localização PT-BR

types/
└── index.ts            # Tipos TypeScript
```

### Configurações
```
package.json            # Dependências do projeto
tsconfig.json           # Configuração TypeScript
tailwind.config.js      # Configuração Tailwind (cores)
next.config.js          # Configuração Next.js
postcss.config.js       # Configuração PostCSS
.gitignore              # Arquivos ignorados pelo Git
```

---

## 🎨 Onde CUSTOMIZAR

### Mudar Cores
**Arquivo:** `tailwind.config.js`
```javascript
colors: {
  neon: {
    purple: '#bf40bf',  // Mude aqui
    blue: '#00e5ff',    // Mude aqui
    pink: '#ff10f0',    // Mude aqui
  }
}
```

### Mudar Título
**Arquivo:** `components/Header.tsx` (linha ~17)
```typescript
<h1>Ranking Mensal de LoL</h1>  // Mude aqui
```

### Mudar Região
**Arquivo:** `.env.local`
```env
RIOT_REGION=br1        # Mude para: na1, euw1, kr, etc
RIOT_ROUTING=americas  # Mude para: europe, asia, etc
```

### Mudar Número de Partidas
**Arquivo:** `lib/riotApi.ts` (linha ~87)
```typescript
const matchesToProcess = matchIds.slice(0, 50)  // 50 → outro número
```

---

## 🚫 NÃO EDITE (a menos que saiba o que está fazendo)

```
node_modules/           # Dependências (gerado por npm install)
.next/                  # Build do Next.js (gerado automaticamente)
.git/                   # Controle de versão Git
package-lock.json       # Lock de dependências
```

---

## 📂 Estrutura Visual

```
ranking/
│
├── 📄 START_HERE.md              ← COMECE AQUI!
├── 📄 QUICKSTART.txt             ← Comandos rápidos
├── 📄 README.md                  ← Documentação completa
│
├── ⚙️ .env.local                 ← CRIAR COM SUA API KEY
├── ⚙️ package.json
│
├── 📱 app/
│   ├── page.tsx                  ← Página principal
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── ranking/
│           └── route.ts          ← API backend
│
├── 🎨 components/
│   ├── Header.tsx                ← Cabeçalho
│   ├── RankingList.tsx           ← Lista
│   ├── PlayerCard.tsx            ← Card
│   └── LoadingSpinner.tsx        ← Loading
│
├── 🔧 lib/
│   ├── constants.ts              ← ⚠️ EDITAR JOGADORES AQUI
│   ├── riotApi.ts                ← Lógica da API
│   └── locales.ts
│
├── 📘 types/
│   └── index.ts
│
├── 🎨 tailwind.config.js         ← Customizar cores
├── ⚙️ next.config.js
├── ⚙️ tsconfig.json
│
└── 📚 Documentação/
    ├── SETUP.md
    ├── DEPLOY.md
    ├── API_INFO.md
    ├── PLAYERS_EXAMPLE.md
    ├── PROJECT_SUMMARY.md
    └── FILES_GUIDE.md
```

---

## 🎯 Fluxo de Trabalho Recomendado

### Primeira Vez (Setup)
1. ✅ Ler **START_HERE.md**
2. ✅ Executar `npm install`
3. ✅ Criar `.env.local` com API key
4. ✅ Editar `lib/constants.ts` com jogadores
5. ✅ Executar `npm run dev`
6. ✅ Acessar http://localhost:3000

### Uso Normal
1. ✅ `npm run dev`
2. ✅ Navegar no site
3. ✅ Fazer ajustes se necessário

### Customização
1. ✅ Cores → `tailwind.config.js`
2. ✅ Jogadores → `lib/constants.ts`
3. ✅ Região → `.env.local`
4. ✅ Partidas → `lib/riotApi.ts`

### Deploy
1. ✅ Testar local: `npm run build` → `npm start`
2. ✅ Ler **DEPLOY.md**
3. ✅ Fazer deploy na Vercel/Netlify

---

## 🔍 Procurando Algo Específico?

**Quero mudar os jogadores**
→ `lib/constants.ts`

**Quero mudar as cores**
→ `tailwind.config.js`

**Erro de API**
→ Verifique `.env.local` e leia `API_INFO.md`

**Quero entender o código**
→ Leia `PROJECT_SUMMARY.md`

**Quero fazer deploy**
→ Leia `DEPLOY.md`

**Quero ver exemplos de jogadores**
→ Leia `PLAYERS_EXAMPLE.md`

**Comando não funciona**
→ Leia `QUICKSTART.txt`

---

## 💡 Dica Final

**IMPORTANTE:** Você só precisa editar 2 arquivos:
1. `.env.local` (criar com API key)
2. `lib/constants.ts` (adicionar jogadores)

Todo o resto já está pronto! 🎉

---

## 📞 Ajuda Rápida

**Erro ao iniciar?**
→ Execute `npm install` novamente

**Dados não carregam?**
→ Verifique `.env.local` e `lib/constants.ts`

**Quer customizar?**
→ Veja seção "Onde CUSTOMIZAR" acima

**Tudo funcionou?**
→ Leia `DEPLOY.md` para colocar online!

---

Boa sorte com seu ranking! 🎮🏆

