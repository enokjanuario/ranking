# 🎨 Style Guide

Guia completo de convenções visuais, estilos e padrões de design do projeto.

## 📋 Índice

- [Paleta de Cores](#paleta-de-cores)
- [Tipografia](#tipografia)
- [Espaçamento](#espaçamento)
- [Componentes](#componentes)
- [Animações](#animações)
- [Responsividade](#responsividade)
- [Tailwind Configuration](#tailwind-configuration)

---

## Paleta de Cores

### Cores Neon (Primary)

Cores vibrantes usadas para elementos de destaque.

```css
/* Neon Colors */
--neon-purple: #a855f7;  /* Roxo vibrante - Destaque primário */
--neon-blue: #3b82f6;    /* Azul elétrico - Links, botões */
--neon-pink: #ec4899;    /* Rosa neon - Alertas, badges */
--neon-cyan: #06b6d4;    /* Ciano - Info, tooltips */
```

**Classes Tailwind**:
```typescript
'text-neon-purple' | 'bg-neon-purple' | 'border-neon-purple'
'text-neon-blue'   | 'bg-neon-blue'   | 'border-neon-blue'
'text-neon-pink'   | 'bg-neon-pink'   | 'border-neon-pink'
'text-neon-cyan'   | 'bg-neon-cyan'   | 'border-neon-cyan'
```

**Uso**:
- **Purple**: Headers, títulos principais
- **Blue**: Links, botões de ação
- **Pink**: Elementos destacados, badges
- **Cyan**: Informações secundárias

---

### Cores Dark (Background)

Cores de fundo para tema escuro.

```css
/* Dark Theme */
--dark-bg: #0d111c;      /* Background principal - corpo da página */
--dark-card: #1a1f2e;    /* Cards e containers - elementos flutuantes */
--dark-hover: #232938;   /* Estado hover - interação com elementos */
```

**Classes Tailwind**:
```typescript
'bg-dark-bg'   // Fundo principal
'bg-dark-card' // Cards, modals
'bg-dark-hover' // Hover states
```

**Uso**:
- **dark-bg**: Body, páginas principais
- **dark-card**: Cards, tabelas, modals
- **dark-hover**: Estados hover de botões/links

---

### Cores de Status

Cores para feedback visual.

```css
/* Status Colors */
--green: #22c55e;   /* Sucesso / Alto desempenho */
--yellow: #eab308;  /* Aviso / Médio desempenho */
--red: #ef4444;     /* Erro / Baixo desempenho */
--gray: #6b7280;    /* Neutro / Desabilitado */
```

**Classes Tailwind**:
```typescript
'text-green-400'  | 'bg-green-400'
'text-yellow-400' | 'bg-yellow-400'
'text-red-400'    | 'bg-red-400'
'text-gray-400'   | 'bg-gray-400'
```

**Uso no Projeto**:

```typescript
// Win Rate
winRate >= 60 ? 'text-green-400'   // Excelente
winRate >= 50 ? 'text-yellow-400'  // Bom
             : 'text-red-400'      // Precisa melhorar

// KDA
kda >= 4 ? 'text-cyan-400'    // Excepcional
kda >= 3 ? 'text-blue-400'    // Muito bom
kda >= 2 ? 'text-green-400'   // Bom
         : 'text-gray-400'    // Médio

// CS
avgCS >= 200 ? 'text-green-400'   // Excelente
avgCS >= 150 ? 'text-yellow-400'  // Bom
             : 'text-gray-400'    // Abaixo
```

---

### Cores de Texto

```css
/* Text Colors */
--text-primary: #ffffff;    /* Texto principal - branco */
--text-secondary: #9ca3af;  /* Texto secundário - cinza claro */
--text-muted: #6b7280;      /* Texto desativado - cinza médio */
```

**Classes Tailwind**:
```typescript
'text-white'    // Texto principal
'text-gray-300' // Texto secundário
'text-gray-500' // Texto muted
```

---

## Tipografia

### Hierarquia de Fontes

```css
/* Headings */
h1: text-3xl (1.875rem / 30px) - font-bold
h2: text-2xl (1.5rem / 24px)   - font-bold
h3: text-xl (1.25rem / 20px)   - font-semibold

/* Body */
body: text-base (1rem / 16px)    - font-normal
small: text-sm (0.875rem / 14px) - font-normal
tiny: text-xs (0.75rem / 12px)   - font-normal
```

**Font Weights**:
```css
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

**Exemplo de Uso**:

```tsx
// Título principal
<h1 className="text-3xl font-bold text-white">
  YoJornada Ranking
</h1>

// Subtítulo
<h2 className="text-2xl font-bold text-gray-300">
  Outubro 2025
</h2>

// Texto normal
<p className="text-base text-gray-300">
  Sistema de ranking mensal
</p>

// Texto pequeno
<span className="text-sm text-gray-400">
  Última atualização: há 5 minutos
</span>
```

---

### Font Family

```css
font-family: 
  -apple-system, 
  BlinkMacSystemFont, 
  'Segoe UI', 
  'Roboto', 
  'Oxygen', 
  'Ubuntu', 
  'Cantarell', 
  'Fira Sans', 
  'Droid Sans', 
  'Helvetica Neue', 
  sans-serif;
```

Sistema de fontes nativas para melhor performance.

---

## Espaçamento

### Scale de Padding/Margin

```css
/* Spacing Scale */
xs:  0.5rem  (8px)
sm:  0.75rem (12px)
md:  1rem    (16px)
lg:  1.5rem  (24px)
xl:  2rem    (32px)
2xl: 3rem    (48px)
3xl: 4rem    (64px)
```

**Classes Tailwind**:
```typescript
'p-2'  // padding: 0.5rem (8px)
'p-4'  // padding: 1rem (16px)
'p-6'  // padding: 1.5rem (24px)
'm-2'  // margin: 0.5rem (8px)
'm-4'  // margin: 1rem (16px)
```

### Grid Gaps

```css
gap-2: 0.5rem  (8px)
gap-4: 1rem    (16px)
gap-6: 1.5rem  (24px)
gap-8: 2rem    (32px)
```

**Exemplo**:

```tsx
<div className="flex gap-4">  {/* 16px entre items */}
  <button>Filtrar</button>
  <button>Ordenar</button>
</div>
```

---

### Padrões de Espaçamento

**Container Principal**:
```tsx
<div className="min-h-screen p-8 bg-dark-bg">
  {/* Conteúdo */}
</div>
```

**Card/Section**:
```tsx
<div className="bg-dark-card rounded-lg p-6">
  {/* Conteúdo do card */}
</div>
```

**Tabela**:
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th className="px-4 py-4"> {/* Padding generoso */}
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="px-4 py-3"> {/* Padding médio */}
        Cell
      </td>
    </tr>
  </tbody>
</table>
```

---

## Componentes

### Bordas e Cantos

```css
/* Border Radius */
rounded-sm:   0.125rem  (2px)
rounded:      0.25rem   (4px)
rounded-md:   0.375rem  (6px)
rounded-lg:   0.5rem    (8px)
rounded-xl:   0.75rem   (12px)
rounded-2xl:  1rem      (16px)
rounded-full: 9999px    (circular)
```

**Uso**:
- **rounded-lg**: Cards, containers principais
- **rounded-md**: Botões, inputs
- **rounded-full**: Badges, avatares

**Exemplo**:

```tsx
// Card
<div className="bg-dark-card rounded-lg">
  ...
</div>

// Botão
<button className="bg-neon-blue rounded-md px-4 py-2">
  Clique aqui
</button>

// Badge
<span className="bg-neon-pink rounded-full px-3 py-1">
  Novo
</span>
```

---

### Sombras

```css
/* Shadows */
shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow:     0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1)
shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1)
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

**Uso**:
- **shadow-lg**: Cards principais, modals
- **shadow-md**: Botões hover, dropdowns
- **shadow-sm**: Elementos sutis

**Glow Effect** (Neon):

```css
/* Neon Glow */
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);  /* Blue glow */
box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);  /* Purple glow */
```

**Exemplo**:

```tsx
// Card com sombra
<div className="bg-dark-card rounded-lg shadow-lg">
  ...
</div>

// Botão com glow no hover
<button className="hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
  Hover me
</button>
```

---

### Botões

**Primary Button**:

```tsx
<button className="
  bg-neon-blue 
  hover:bg-blue-600 
  text-white 
  font-semibold 
  px-6 py-2 
  rounded-md 
  transition-all 
  duration-150
  hover:shadow-lg
">
  Ação Principal
</button>
```

**Secondary Button**:

```tsx
<button className="
  bg-transparent 
  border-2 
  border-neon-blue 
  text-neon-blue 
  hover:bg-neon-blue 
  hover:text-white 
  font-semibold 
  px-6 py-2 
  rounded-md 
  transition-all 
  duration-150
">
  Ação Secundária
</button>
```

**Ghost Button**:

```tsx
<button className="
  text-gray-300 
  hover:text-white 
  hover:bg-dark-hover 
  px-4 py-2 
  rounded-md 
  transition-colors 
  duration-150
">
  Ação Sutil
</button>
```

---

### Inputs

```tsx
<input 
  type="text"
  className="
    bg-dark-card 
    border-2 
    border-gray-600 
    focus:border-neon-blue 
    text-white 
    placeholder-gray-500
    px-4 py-2 
    rounded-md 
    outline-none 
    transition-colors 
    duration-150
  "
  placeholder="Buscar..."
/>
```

---

### Cards

**Card Padrão**:

```tsx
<div className="
  bg-dark-card 
  rounded-lg 
  p-6 
  shadow-lg 
  border border-gray-700
  hover:border-neon-blue 
  transition-all 
  duration-150
">
  {/* Conteúdo */}
</div>
```

**Card com Hover Effect**:

```tsx
<div className="
  bg-dark-card 
  rounded-lg 
  p-6 
  shadow-lg 
  border border-gray-700
  hover:border-neon-blue 
  hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]
  transform 
  hover:-translate-y-1 
  transition-all 
  duration-200
  cursor-pointer
">
  {/* Conteúdo */}
</div>
```

---

## Animações

### Transições Padrão

```css
/* Default Transition */
transition-all duration-150 ease-in-out
```

**Tipos de Transição**:

```typescript
'transition-all'      // Todas as propriedades
'transition-colors'   // Apenas cores
'transition-opacity'  // Apenas opacidade
'transition-transform' // Apenas transform
```

**Durações**:

```typescript
'duration-75'   // 75ms - Muito rápido
'duration-150'  // 150ms - Rápido (padrão)
'duration-200'  // 200ms - Médio
'duration-300'  // 300ms - Normal
'duration-500'  // 500ms - Lento
```

---

### Hover Effects

**Elevação**:

```tsx
<div className="
  transform 
  hover:-translate-y-1 
  transition-transform 
  duration-200
">
  {/* Sobe 4px no hover */}
</div>
```

**Scale**:

```tsx
<div className="
  transform 
  hover:scale-105 
  transition-transform 
  duration-200
">
  {/* Aumenta 5% no hover */}
</div>
```

**Brightness**:

```tsx
<img 
  className="
    hover:brightness-110 
    transition-all 
    duration-200
  " 
/>
```

---

### Animações Customizadas

**Spin Slow** (para loading):

```tsx
<div className="animate-spin-slow">
  {/* Spinner */}
</div>
```

Configuração em `tailwind.config.js`:

```javascript
animation: {
  'spin-slow': 'spin 3s linear infinite',
}
```

**Pulse Slow**:

```tsx
<div className="animate-pulse-slow">
  {/* Pulsando suavemente */}
</div>
```

Configuração:

```javascript
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}
```

**Bounce** (para dots):

```tsx
<span className="inline-block animate-bounce">●</span>
<span className="inline-block animate-bounce animation-delay-100">●</span>
<span className="inline-block animate-bounce animation-delay-200">●</span>
```

---

### Loading States

**Skeleton**:

```tsx
<div className="
  bg-gray-700 
  animate-pulse 
  h-4 
  rounded
">
</div>
```

**Spinner**:

```tsx
<div className="
  w-16 h-16 
  border-4 
  border-gray-600 
  border-t-neon-blue 
  rounded-full 
  animate-spin
">
</div>
```

---

## Responsividade

### Breakpoints

```css
sm:  640px   /* Small devices (landscape phones) */
md:  768px   /* Medium devices (tablets) */
lg:  1024px  /* Large devices (desktops) */
xl:  1280px  /* Extra large devices (large desktops) */
2xl: 1536px  /* 2X Extra large devices */
```

### Mobile First

Tailwind usa abordagem mobile-first. Classes sem prefixo aplicam em todos os tamanhos, prefixos aplicam a partir do breakpoint.

```tsx
<div className="
  text-sm     /* Mobile: small text */
  md:text-base  /* Tablet+: normal text */
  lg:text-lg    /* Desktop+: large text */
">
  Texto responsivo
</div>
```

---

### Layout Responsivo

**Grid**:

```tsx
<div className="
  grid 
  grid-cols-1     /* Mobile: 1 coluna */
  md:grid-cols-2  /* Tablet: 2 colunas */
  lg:grid-cols-3  /* Desktop: 3 colunas */
  gap-4
">
  {/* Items */}
</div>
```

**Flex**:

```tsx
<div className="
  flex 
  flex-col       /* Mobile: coluna */
  md:flex-row    /* Tablet+: linha */
  gap-4
">
  {/* Items */}
</div>
```

**Hidden/Visible**:

```tsx
{/* Visível apenas em mobile */}
<div className="block md:hidden">
  Mobile menu
</div>

{/* Visível apenas em desktop */}
<div className="hidden md:block">
  Desktop menu
</div>
```

---

### Tabela Responsiva

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>
```

**Scroll Horizontal em Mobile**:

```tsx
<div className="
  overflow-x-auto 
  -mx-4           /* Negative margin para full width */
  px-4            /* Padding interno */
  scrollbar-thin  /* Custom scrollbar (se configurado) */
">
  <table className="min-w-[800px]">  {/* Largura mínima */}
    {/* Table content */}
  </table>
</div>
```

---

## Tailwind Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#a855f7',
          blue: '#3b82f6',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
        dark: {
          bg: '#0d111c',
          card: '#1a1f2e',
          hover: '#232938',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
```

---

### Customizações

**Adicionar Nova Cor**:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: '#ff6b6b',  // Nova cor
    }
  }
}

// Uso
<div className="text-brand bg-brand">
```

**Adicionar Nova Animação**:

```javascript
theme: {
  extend: {
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    },
  }
}

// Uso
<div className="animate-fade-in">
```

---

## Boas Práticas

### Do's ✅

- **Use classes utilitárias** do Tailwind
- **Agrupe classes relacionadas** (layout, cores, tipografia)
- **Use breakpoints** para responsividade
- **Extraia componentes** para evitar repetição
- **Use transições** para melhor UX
- **Mantenha consistência** nas cores e espaçamentos

### Don'ts ❌

- **Não use valores arbitrários** sem necessidade (`w-[347px]`)
- **Não misture unidades** (use rem/em, evite px)
- **Não duplique estilos** (extraia para componente)
- **Não ignore acessibilidade** (contraste, focus states)
- **Não abuse de animações** (pode causar motion sickness)

---

### Exemplo de Componente Bem Estilizado

```tsx
export function PlayerCard({ player }: { player: PlayerStats }) {
  return (
    <div className="
      bg-dark-card 
      rounded-lg 
      p-6 
      shadow-lg 
      border border-gray-700
      hover:border-neon-blue 
      hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]
      transform 
      hover:-translate-y-1 
      transition-all 
      duration-200
      cursor-pointer
    ">
      <h3 className="text-xl font-bold text-white mb-2">
        {player.summonerName}
      </h3>
      
      <div className="flex items-center gap-4">
        <span className={`text-lg font-semibold ${
          player.winRate >= 60 ? 'text-green-400' :
          player.winRate >= 50 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {player.winRate.toFixed(1)}% WR
        </span>
        
        <span className="text-sm text-gray-400">
          {player.totalGames} jogos
        </span>
      </div>
    </div>
  )
}
```

---

## Recursos Adicionais

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---

**Próximo**: [Voltar ao Índice](./README.md)

