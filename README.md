# 🏆 Ranking Mensal de League of Legends

Um site moderno e responsivo para exibir o ranking mensal de jogadores específicos de League of Legends, com integração à Riot Games API.

## ✨ Características

- 🎮 **Design Moderno**: Interface futurista com tema dark mode e cores neon (roxo, azul, rosa)
- 📊 **Ranking Dinâmico**: Atualização automática a cada 5 minutos
- 📅 **Filtros Temporais**: Visualize o ranking de qualquer mês
- 🏅 **Critérios de Desempate**: Win rate → Vitórias totais → KDA → Tempo médio de jogo
- 📱 **Totalmente Responsivo**: Otimizado para desktop e mobile
- ✨ **Animações Suaves**: Transições e animações com Framer Motion
- 🔄 **Auto-refresh**: Atualização automática e manual sob demanda

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Uma chave de API da Riot Games ([obtenha aqui](https://developer.riotgames.com/))

## 🚀 Instalação

1. **Clone o repositório (ou navegue até a pasta do projeto)**

```bash
cd ranking
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Riot Games API Key
RIOT_API_KEY=sua_chave_api_aqui

# Região (br1, na1, euw1, kr, etc)
RIOT_REGION=br1

# Routing (americas, europe, asia, sea)
RIOT_ROUTING=americas
```

4. **Configure os jogadores**

Edite o arquivo `lib/constants.ts` e adicione os 15 jogadores que deseja acompanhar:

```typescript
export const TRACKED_PLAYERS = [
  'NomeDoJogador1#BR1',
  'NomeDoJogador2#BR1',
  'NomeDoJogador3#BR1',
  // ... adicione 15 jogadores no formato GameName#TagLine
]
```

## 🎮 Como Usar

1. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

2. **Acesse o site**

Abra seu navegador e vá para: [http://localhost:3000](http://localhost:3000)

3. **Construir para produção**

```bash
npm run build
npm start
```

## 📊 Funcionalidades Detalhadas

### Ranking de Jogadores

O ranking é calculado com base nos seguintes critérios (em ordem de prioridade):

1. **Win Rate**: Taxa de vitórias no período
2. **Vitórias Totais**: Número absoluto de vitórias
3. **KDA**: Kill/Death/Assist ratio médio
4. **Tempo Médio**: Menor tempo médio de jogo (jogos mais rápidos são favorecidos)

### Informações Exibidas

Para cada jogador, o ranking mostra:

- 🏅 Posição no ranking (#1, #2, #3, etc.)
- 👤 Nome do invocador e Riot ID
- 🎯 Campeão mais jogado no período (com imagem)
- 📈 Win rate (porcentagem)
- 🎮 Total de partidas jogadas
- ⚔️ KDA médio
- ⏱️ Tempo médio de jogo
- 📊 Vitórias e derrotas

### Filtros e Controles

- **Seletor de Mês**: Visualize o ranking dos últimos 12 meses
- **Botão de Atualização**: Force uma atualização imediata dos dados
- **Auto-refresh**: Os dados são atualizados automaticamente a cada 5 minutos

## 🎨 Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilização**: Tailwind CSS com tema dark personalizado
- **Animações**: Framer Motion
- **API**: Riot Games API
- **HTTP Client**: Axios
- **Datas**: date-fns

## 📁 Estrutura do Projeto

```
ranking/
├── app/
│   ├── api/
│   │   └── ranking/
│   │       └── route.ts          # API route para buscar dados
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Página inicial
│   └── globals.css               # Estilos globais
├── components/
│   ├── Header.tsx                # Cabeçalho com controles
│   ├── RankingList.tsx           # Lista de jogadores
│   ├── PlayerCard.tsx            # Card individual do jogador
│   └── LoadingSpinner.tsx        # Indicador de carregamento
├── lib/
│   ├── constants.ts              # Configurações e constantes
│   └── riotApi.ts                # Lógica de integração com Riot API
├── types/
│   └── index.ts                  # Tipos TypeScript
├── tailwind.config.js            # Configuração do Tailwind
├── next.config.js                # Configuração do Next.js
└── package.json                  # Dependências do projeto
```

## 🔧 Configurações Avançadas

### Limites de Rate da API

O código já implementa delays entre requisições para respeitar os limites de rate da Riot API. Se você possui uma chave de produção, pode ajustar os delays em `lib/riotApi.ts`.

### Número de Partidas Analisadas

Por padrão, o sistema analisa até 50 partidas por jogador no período. Você pode ajustar isso em `lib/riotApi.ts` na função `calculatePlayerStats`:

```typescript
const matchesToProcess = matchIds.slice(0, 50) // Altere o número aqui
```

### Personalização de Cores

As cores do tema podem ser customizadas em `tailwind.config.js`:

```javascript
colors: {
  neon: {
    purple: '#bf40bf',
    blue: '#00e5ff',
    pink: '#ff10f0',
    cyan: '#39ff14',
  },
  dark: {
    bg: '#0a0e27',
    card: '#141b35',
    hover: '#1a2341',
  }
}
```

## ⚠️ Notas Importantes

- **API Key**: Mantenha sua chave da Riot API em segredo. Nunca a compartilhe ou comite no Git.
- **Rate Limits**: A API gratuita da Riot tem limites de requisições. O sistema implementa delays para respeitá-los.
- **Performance**: Para muitos jogadores e partidas, as requisições podem demorar. Considere implementar cache.
- **Região**: Certifique-se de usar a região correta (br1 para Brasil, na1 para North America, etc.)

## 🐛 Troubleshooting

### Erro 403 (Forbidden)
- Verifique se sua chave de API está correta e válida
- Certifique-se de que a chave não expirou

### Erro 404 (Not Found)
- Verifique se os nomes dos jogadores estão no formato correto: `GameName#TagLine`
- Confirme se a região está correta

### Dados não aparecem
- Verifique se os jogadores têm partidas no período selecionado
- Olhe o console do navegador e do servidor para erros

## 📝 Licença

Este projeto é para uso pessoal e educacional.

## 🤝 Contribuições

Sinta-se à vontade para fazer fork, melhorias e sugestões!

---

Desenvolvido com ❤️ para a comunidade de League of Legends

