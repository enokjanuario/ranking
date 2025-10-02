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
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        glow: {
          'from': {
            'box-shadow': '0 0 10px rgba(191, 64, 191, 0.5), 0 0 20px rgba(191, 64, 191, 0.3)',
          },
          'to': {
            'box-shadow': '0 0 20px rgba(191, 64, 191, 0.8), 0 0 30px rgba(191, 64, 191, 0.5)',
          }
        },
        slideUp: {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          'from': { transform: 'translateY(-10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

