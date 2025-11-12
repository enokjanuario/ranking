// YoJornada Ranking System - Theme Configuration
// Nova identidade visual baseada nos valores da academia

export const theme = {
  // Cores Principais - Baseadas nos pilares da YoJornada
  colors: {
    // Primária - SERENIDADE (Azul)
    // Representa clareza, confiança e progresso
    primary: {
      main: '#006aff',
      light: '#3d8cff',
      dark: '#0052cc',
      contrast: '#ffffff',
    },
    
    // Secundária - OTIMISMO (Amarelo)
    // Representa energia, positividade e crescimento
    secondary: {
      main: '#efd971',
      light: '#f5e89d',
      dark: '#d4ba4a',
      contrast: '#312178',
    },
    
    // Acento - SABEDORIA (Roxo Escuro)
    // Representa profundidade, conhecimento e excelência
    accent: {
      main: '#312178',
      light: '#4a3399',
      dark: '#1f1550',
      contrast: '#f9f3e2',
    },
    
    // Neutra - FOCO (Bege Claro)
    // Representa serenidade, clareza e equilíbrio
    neutral: {
      main: '#f9f3e2',
      light: '#fdfbf5',
      dark: '#e8dcc5',
      contrast: '#312178',
    },
    
    // Backgrounds
    background: {
      primary: '#1a1042',    // Roxo muito escuro (derivado do accent)
      secondary: '#251860',  // Roxo médio escuro
      card: '#2d1f6b',       // Roxo para cards
      hover: '#3a2685',      // Estado hover
      overlay: 'rgba(49, 33, 120, 0.9)', // Overlay com roxo
    },
    
    // Status Colors (mantidas para compatibilidade mas com ajustes)
    status: {
      success: '#10b981',    // Verde para win rate alto
      warning: '#efd971',    // Amarelo (secundária) para médio
      error: '#ef4444',      // Vermelho para baixo
      info: '#006aff',       // Azul (primária) para info
    },
    
    // Text Colors
    text: {
      primary: '#f9f3e2',    // Bege claro para texto principal
      secondary: '#c9bfa8',  // Bege escurecido para texto secundário
      muted: '#9a8f7a',      // Bege ainda mais escuro para texto muted
      accent: '#efd971',     // Amarelo para destaques de texto
      link: '#006aff',       // Azul para links
    },
    
    // Border Colors
    border: {
      default: 'rgba(239, 217, 113, 0.2)',  // Amarelo com opacidade
      focus: '#006aff',                      // Azul para focus
      hover: 'rgba(239, 217, 113, 0.4)',    // Amarelo mais opaco
    },
  },
  
  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #006aff 0%, #3d8cff 100%)',
    secondary: 'linear-gradient(135deg, #efd971 0%, #f5e89d 100%)',
    accent: 'linear-gradient(135deg, #312178 0%, #1f1550 100%)',
    background: 'linear-gradient(180deg, #1a1042 0%, #0f0a2e 100%)',
    card: 'linear-gradient(135deg, rgba(45, 31, 107, 0.6) 0%, rgba(49, 33, 120, 0.4) 100%)',
    highlight: 'linear-gradient(90deg, #006aff 0%, #efd971 100%)', // Azul para amarelo
  },
  
  // Sombras com a nova paleta
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 106, 255, 0.05)',
    md: '0 4px 6px -1px rgba(0, 106, 255, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 106, 255, 0.15)',
    xl: '0 20px 25px -5px rgba(0, 106, 255, 0.2)',
    glow: '0 0 20px rgba(0, 106, 255, 0.4)',
    glowYellow: '0 0 20px rgba(239, 217, 113, 0.4)',
  },
  
  // Rank Colors (mantidas mas com ajustes)
  ranks: {
    iron: '#6b7280',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#efd971',      // Usa a cor secundária
    platinum: '#006aff',   // Usa a cor primária
    emerald: '#10b981',
    diamond: '#3d8cff',    // Variação da primária
    master: '#312178',     // Usa a cor accent
    grandmaster: '#4a3399',
    challenger: '#efd971', // Usa a cor secundária
  },
} as const

// Type exports para TypeScript
export type Theme = typeof theme
export type ThemeColors = typeof theme.colors
export type ThemeGradients = typeof theme.gradients

