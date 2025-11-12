# 📚 YoJornada Ranking System - Documentation

Sistema de ranking mensal para jogadores de League of Legends que rastreia estatísticas, desempenho e progresso através da API da Riot Games.

## 🎯 Visão Geral

O YoJornada é uma aplicação web desenvolvida com Next.js 14 que monitora e rankeia jogadores de League of Legends com base em suas performances mensais em partidas ranked. O sistema utiliza cache inteligente, cálculo preciso de LP (League Points) e apresenta estatísticas detalhadas em uma interface moderna e responsiva.

## 🏗️ Arquitetura em Resumo

```
Cliente (Browser)
    ↓
Next.js Frontend (React Components)
    ↓
API Routes (/api/ranking, /api/cache-status, /api/clear-cache)
    ↓
Cache Layer (Redis - Upstash)
    ↓
Riot API Integration
    ↓
Riot Games API
```

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript 5.2+
- **Estilização**: Tailwind CSS 3.3+
- **Animações**: Framer Motion 10.16+
- **Cache**: Upstash Redis 1.35+
- **HTTP Client**: Axios 1.6+
- **Datas**: date-fns 2.30+

## 📖 Documentação Completa

### Primeiros Passos

- **[Setup e Instalação](./SETUP.md)** - Configure o ambiente local e as variáveis de ambiente
- **[Deployment](./DEPLOYMENT.md)** - Deploy na Vercel e configuração de produção

### Desenvolvimento

- **[Arquitetura](./ARCHITECTURE.md)** - Estrutura do sistema, componentes e padrões de design
- **[API Reference](./API.md)** - Documentação completa das rotas e integração com Riot API
- **[Guia de Desenvolvimento](./DEVELOPMENT.md)** - Workflows, convenções e como adicionar features
- **[Tipos TypeScript](./TYPES.md)** - Interfaces e definições de tipos
- **[Fórmulas e Cálculos](./FORMULAS.md)** - Como são calculados LP, KDA, Win Rate, etc.
- **[Guia de Estilo](./STYLE-GUIDE.md)** - Convenções visuais e de código
- **[Implementação de Assets](./ASSETS_IMPLEMENTACAO.md)** - Logo, backgrounds e recursos visuais

### Suporte

- **[Troubleshooting](./TROUBLESHOOTING.md)** - Soluções para problemas comuns e debugging

## ⚡ Quick Start

```bash
# 1. Clone o repositório
git clone <repository-url>
cd ranking

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse http://localhost:3000
```

## ✨ Características Principais

- ✅ Cache inteligente com TTL de 15 minutos
- ✅ Sistema de mutex para evitar requisições duplicadas
- ✅ Cálculo preciso de LP através de snapshots
- ✅ Suporte a múltiplos períodos mensais
- ✅ Interface responsiva e moderna
- ✅ Filtros e ordenação dinâmica
- ✅ Rate limiting compliance com Riot API

## 📂 Estrutura do Projeto

```
ranking/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── ranking/       # Endpoint principal
│   │   ├── cache-status/  # Status do cache
│   │   └── clear-cache/   # Limpar cache
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── Header.tsx
│   ├── PlayerTable.tsx
│   └── ...
├── lib/                   # Lógica de negócio
│   ├── riotApi.ts        # Integração Riot API
│   ├── cache-redis.ts    # Sistema de cache
│   ├── lpCalculator.ts   # Cálculos de LP
│   └── ...
├── types/                 # Definições TypeScript
├── public/               # Assets estáticos
└── docs/                 # Documentação
```

## 🔗 Links Úteis

- [Riot Games Developer Portal](https://developer.riotgames.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Upstash Redis](https://upstash.com/)
- [Vercel Platform](https://vercel.com)

## 📝 Contribuindo

Ao contribuir para este projeto, consulte:
1. [Guia de Desenvolvimento](./DEVELOPMENT.md) para workflows e convenções
2. [Arquitetura](./ARCHITECTURE.md) para entender o sistema
3. [Guia de Estilo](./STYLE-GUIDE.md) para padrões de código

## 📄 Versão

**Versão**: 1.0.0  
**Última Atualização**: Novembro 2025  
**Mantido por**: Equipe YoJornada

---

Para dúvidas ou sugestões, abra uma issue no repositório.
