# 🏆 Ranking de League of Legends

> Site moderno para acompanhar o ranking mensal de jogadores de LoL

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

---

## ✨ Características

🎮 **Design Futurista** - Dark mode com cores neon (roxo, azul, rosa)
📊 **Ranking Automático** - Atualização a cada 5 minutos
📅 **Filtros** - Visualize qualquer mês
🏅 **Sistema de Desempate** - Win rate → Vitórias → KDA → Tempo
📱 **Responsivo** - Funciona em mobile e desktop
✨ **Animações Suaves** - Interface moderna e fluida

---

## 🚀 Início Rápido (3 minutos)

### 1. Instalar
```bash
npm install
```

### 2. Configurar API Key
Crie `.env.local`:
```env
RIOT_API_KEY=sua-key-aqui
RIOT_REGION=br1
RIOT_ROUTING=americas
```

[Obtenha sua key aqui](https://developer.riotgames.com/)

### 3. Adicionar Jogadores
Edite `lib/constants.ts`:
```typescript
export const TRACKED_PLAYERS = [
  'Brtt#BR1',
  'Kami#BR1',
  // ... adicione 13 a mais
]
```

### 4. Iniciar
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 📊 O que Mostra

Para cada jogador:
- 🏅 Posição no ranking
- 👤 Nome e Riot ID
- 🎯 Campeão mais jogado
- 📈 Win rate
- 🎮 Total de partidas
- ⚔️ KDA médio
- ⏱️ Tempo médio

---

## 🛠️ Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **API:** Riot Games API oficial
- **Data:** date-fns

---

## 📁 Estrutura

```
ranking/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Logic & utils
├── types/            # TypeScript types
└── docs/             # Documentation
```

---

## 📚 Documentação

| Arquivo | Conteúdo |
|---------|----------|
| **START_HERE.md** | 🎯 Comece aqui! |
| **QUICKSTART.txt** | ⚡ Comandos rápidos |
| **SETUP.md** | 📖 Guia completo |
| **API_INFO.md** | 🔑 Info sobre Riot API |
| **DEPLOY.md** | 🚀 Como fazer deploy |
| **FILES_GUIDE.md** | 📁 Navegação no projeto |

---

## 🎨 Customização

### Cores
Edite `tailwind.config.js`:
```javascript
colors: {
  neon: {
    purple: '#bf40bf',
    blue: '#00e5ff',
  }
}
```

### Jogadores
Edite `lib/constants.ts`

### Região
Edite `.env.local`

---

## 🌐 Deploy

### Vercel (Recomendado)
1. Push para GitHub
2. Importe no Vercel
3. Adicione variáveis de ambiente
4. Deploy! ✅

Veja `DEPLOY.md` para mais opções.

---

## 🔧 Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm start        # Iniciar produção
npm run lint     # Verificar código
```

---

## ⚠️ Requisitos

- Node.js 18+
- API Key da Riot Games
- Lista de 15 jogadores

---

## 🐛 Problemas Comuns

**API Key expirou**
→ Gere uma nova (keys de dev expiram em 24h)

**Jogadores não aparecem**
→ Verifique formato: `Nome#TAG`

**Erro 403**
→ Verifique API key no `.env.local`

Veja `API_INFO.md` para mais troubleshooting.

---

## 📈 Performance

- ⏱️ Primeira carga: ~60-90 segundos
- 🔄 Auto-refresh: 5 minutos
- 📊 Até 50 partidas por jogador
- 🚀 Rate limiting implementado

---

## 🎯 Ranking

Critérios de desempate (ordem):
1. Win rate (%)
2. Total de vitórias
3. KDA médio
4. Menor tempo médio de jogo

---

## 📱 Screenshots

### Desktop
- Header com título neon
- Cards de jogadores com stats
- Top 3 destacado
- Estatísticas gerais

### Mobile
- Layout responsivo
- Touch-friendly
- Todas as features

---

## 🔒 Segurança

✅ API key em variável de ambiente
✅ Rate limiting respeitado
✅ Error handling robusto
✅ `.env` no gitignore

---

## 🎓 Aprenda

Este projeto demonstra:
- Next.js App Router
- TypeScript
- API integration
- Responsive design
- Animations
- State management

---

## 📝 Licença

Uso pessoal e educacional.

---

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas!

---

## 💡 Próximas Features (Sugestões)

- [ ] Gráficos de evolução
- [ ] Comparação entre jogadores
- [ ] Filtro por campeão
- [ ] Exportar para PDF
- [ ] Notificações
- [ ] Histórico de posições

---

## 🎮 Regiões Suportadas

- 🇧🇷 Brasil (br1)
- 🇺🇸 North America (na1)
- 🇪🇺 Europe West (euw1)
- 🇰🇷 Korea (kr)
- E mais...

---

## 📞 Suporte

1. Leia a documentação
2. Verifique os logs
3. Veja `API_INFO.md`

---

## 🎉 Créditos

Desenvolvido com ❤️ para a comunidade de League of Legends

Powered by:
- [Riot Games API](https://developer.riotgames.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Dúvidas?** Leia **START_HERE.md**

**Funcionou?** Compartilhe com seus amigos! 🎮

---

[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-black)](https://nextjs.org/)
[![Powered by Riot API](https://img.shields.io/badge/Powered%20by-Riot%20API-red)](https://developer.riotgames.com/)

---

### 🚀 Quick Links

- 📖 [Documentação Completa](README.md)
- 🎯 [Começar Agora](START_HERE.md)
- 🔑 [Info da API](API_INFO.md)
- 🚀 [Deploy Guide](DEPLOY.md)

---

Bom jogo! ⚔️🏆

