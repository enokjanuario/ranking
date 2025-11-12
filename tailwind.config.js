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
        // Nova paleta YoJornada - Baseada nos valores da academia
        
        // Primária - SERENIDADE (Azul)
        primary: {
          DEFAULT: '#006aff',
          light: '#3d8cff',
          dark: '#0052cc',
        },
        
        // Secundária - OTIMISMO (Amarelo)
        secondary: {
          DEFAULT: '#efd971',
          light: '#f5e89d',
          dark: '#d4ba4a',
        },
        
        // Acento - SABEDORIA (Roxo)
        accent: {
          DEFAULT: '#312178',
          light: '#4a3399',
          dark: '#1f1550',
        },
        
        // Neutra - FOCO (Bege)
        neutral: {
          DEFAULT: '#f9f3e2',
          light: '#fdfbf5',
          dark: '#e8dcc5',
        },
        
        // Backgrounds
        dark: {
          bg: '#1a1042',      // Roxo muito escuro
          card: '#2d1f6b',    // Roxo para cards
          hover: '#3a2685',   // Roxo hover
          secondary: '#251860', // Background secundário
        },
        
        // Manter compatibilidade com código existente (migração gradual)
        neon: {
          blue: '#006aff',    // Mapeia para primary
          purple: '#312178',  // Mapeia para accent
          pink: '#efd971',    // Mapeia para secondary
          cyan: '#3d8cff',    // Variação da primary
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #006aff 0%, #3d8cff 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #efd971 0%, #f5e89d 100%)',
        'gradient-accent': 'linear-gradient(135deg, #312178 0%, #1f1550 100%)',
        'gradient-bg': 'linear-gradient(180deg, #1a1042 0%, #0f0a2e 100%)',
        'gradient-highlight': 'linear-gradient(90deg, #006aff 0%, #efd971 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 106, 255, 0.4)',
        'glow-secondary': '0 0 20px rgba(239, 217, 113, 0.4)',
        'glow-accent': '0 0 20px rgba(49, 33, 120, 0.4)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

