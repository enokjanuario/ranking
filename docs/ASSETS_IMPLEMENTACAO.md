# 🎨 Implementação dos Assets - Academia Y

## Visão Geral

Este documento detalha a integração dos assets visuais da Academia Y no sistema de ranking YoJornada.

---

## Assets Implementados

### 1. Logo Academia Y (`logo-academia-y.png`)

**Localização**: `public/logo-academia-y.png`  
**Origem**: `assets/logo academia y.png`

**Onde é usado**:
- **Header Principal** (`components/Header.tsx`)
  - Substituiu o título textual "YoJornada"
  - Dimensões: 200x64px (responsivo)
  - Carregamento prioritário (priority)
  - Otimizado com Next.js Image

**Implementação**:
```tsx
<Image 
  src="/logo-academia-y.png" 
  alt="Academia Y Logo" 
  width={200}
  height={64}
  className="object-contain h-full w-auto"
  priority
/>
```

**Características**:
- ✅ Responsivo em todos os breakpoints
- ✅ Otimizado para performance
- ✅ Carrega antes do conteúdo principal
- ✅ Mantém proporções originais

---

### 2. Background Colorido (`background-colorido.png`)

**Localização**: `public/background-colorido.png`  
**Origem**: `assets/background_colorido.png`

**Onde é usado**:
- **Página Principal** (`app/page.tsx`)
  - Background de toda a aplicação
  - Opacity: 15% para não prejudicar legibilidade
  - Overlay em gradiente para contraste

**Implementação**:
```tsx
<div 
  className="fixed inset-0 z-0"
  style={{
    backgroundImage: 'url(/background-colorido.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 0.15,
  }}
>
  <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/80 via-dark-bg/90 to-dark-bg/95"></div>
</div>
```

**Características**:
- ✅ Cobre toda a tela (fixed + inset-0)
- ✅ Opacity baixa (15%) para não competir com conteúdo
- ✅ Overlay gradiente para legibilidade
- ✅ z-index gerenciado para ficar atrás do conteúdo

---

## Estrutura de Arquivos

```
project-root/
├── assets/                           # Assets originais (não usados em produção)
│   ├── logo academia y.png
│   └── background_colorido.png
│
├── public/                           # Assets servidos publicamente
│   ├── logo-academia-y.png          # Logo otimizada
│   └── background-colorido.png      # Background otimizado
│
├── components/
│   └── Header.tsx                   # Usa logo-academia-y.png
│
└── app/
    └── page.tsx                     # Usa background-colorido.png
```

---

## Decisões de Design

### Opacidade do Background

**Valor escolhido**: 15%  
**Motivo**: 
- Mantém identidade visual da Academia Y
- Não prejudica legibilidade do conteúdo
- Harmonia com a paleta de cores implementada

### Overlay Gradiente

**Implementação**: `from-dark-bg/80 via-dark-bg/90 to-dark-bg/95`  
**Motivo**:
- Aumenta contraste entre background e conteúdo
- Cria profundidade visual
- Garante legibilidade em todas as seções

### Logo no Header

**Substituição do título textual**  
**Motivo**:
- Fortalece identidade visual da Academia Y
- Mais profissional e reconhecível
- Mantém mesma hierarquia visual

---

## Otimizações Implementadas

### Next.js Image Component

✅ **Lazy loading automático** (exceto logo com priority)  
✅ **Otimização automática de tamanho**  
✅ **WebP/AVIF quando suportado**  
✅ **Responsive images**  

### Performance

✅ **Logo carrega prioritariamente** (visible on load)  
✅ **Background carrega assincronamente**  
✅ **CSS backgrounds para performance**  
✅ **Sem impacto no LCP (Largest Contentful Paint)**

---

## Testes Realizados

### Checklist Visual

- [x] Logo aparece corretamente no header
- [x] Logo mantém proporções em mobile
- [x] Background cobre toda a tela
- [x] Background não interfere na legibilidade
- [x] Contraste adequado (WCAG AA)
- [x] Performance não impactada
- [x] Sem erros no console
- [x] Build passa sem warnings

### Breakpoints Testados

- [x] Mobile (320px - 640px)
- [x] Tablet (640px - 1024px)
- [x] Desktop (1024px+)
- [x] Large Desktop (1400px+)

---

## Assets Disponíveis Não Utilizados

Arquivos que estão em `assets/` mas ainda não foram implementados:

| Asset | Uso Potencial |
|-------|---------------|
| `brasão transparente branco.png` | Favicon, watermark |
| `Y medalha.png` | Badge de conquistas |
| `textura.jpg` | Background alternativo |
| `Gume 2.png` | Decoração, divisores |
| `Icon Y.png` | Favicon, loading |
| `Icon suporte.png` | Ícone de categoria |
| `Icon relogio.png` | Indicador de tempo |
| `Icon diploma.png` | Badge de ranking |

### Sugestões para Implementação Futura

1. **Favicon**: Usar `Icon Y.png` ou `brasão transparente branco.png`
2. **Loading State**: Usar `Icon Y.png` com animação
3. **Badges de Conquista**: Sistema de medalhas com `Y medalha.png`
4. **Categorias**: Ícones personalizados para diferentes stats
5. **Watermark**: Brasão transparente em páginas de compartilhamento

---

## Comandos Úteis

### Adicionar novo asset

```bash
# Windows PowerShell
Copy-Item "assets/nome-do-arquivo.ext" "public/nome-padronizado.ext"

# Git Bash / Linux / Mac
cp assets/nome-do-arquivo.ext public/nome-padronizado.ext
```

### Otimizar imagens antes de adicionar

```bash
# Instalar ferramentas de otimização
npm install -g sharp-cli

# Otimizar PNG
npx sharp -i input.png -o output.png --quality 90

# Converter para WebP
npx sharp -i input.png -o output.webp --quality 85
```

---

## Configuração Next.js

O arquivo `next.config.js` já está configurado para otimização de imagens:

```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ddragon.leagueoflegends.com', 'cdn.communitydragon.org'],
  },
}
```

**Nota**: Assets locais (`public/`) não precisam de configuração adicional.

---

## Troubleshooting

### Logo não aparece

1. Verificar se arquivo está em `public/logo-academia-y.png`
2. Limpar cache do Next.js: `rm -rf .next`
3. Rebuild: `npm run dev`

### Background não carrega

1. Verificar se arquivo está em `public/background-colorido.png`
2. Verificar console do browser para erros 404
3. Hard refresh: `Ctrl + Shift + R` (ou `Cmd + Shift + R`)

### Performance impactada

1. Verificar tamanho dos arquivos PNG
2. Considerar converter para WebP
3. Ajustar opacidade do background (menor = melhor performance)
4. Usar ferramentas de otimização de imagem

---

## Próximos Passos Sugeridos

1. ✅ **Logo implementada** - Header
2. ✅ **Background implementado** - Página principal
3. ⏳ **Favicon personalizado** - Usar Icon Y.png
4. ⏳ **Sistema de badges** - Implementar medalhas
5. ⏳ **Loading state customizado** - Animação com logo
6. ⏳ **Metadata/OG Images** - Usar logo para compartilhamento

---

## Referências

- [Next.js Image Component](https://nextjs.org/docs/api-reference/next/image)
- [Web Performance Best Practices](https://web.dev/fast/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Última atualização**: Novembro 2025  
**Responsável**: YoJornada Team  
**Status**: ✅ Implementação Completa

