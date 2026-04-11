/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Edatia Manager dark palette
        navy: {
          950: '#060D1A',
          900: '#0B1120',
          800: '#0F1A2E',
          700: '#111C2E',
          600: '#152238',
          500: '#1A2B47',
          400: '#213356',
        },
        brand: {
          blue:   '#4F8EF7',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          violet: '#7C3AED',
        },
      },
      backgroundImage: {
        'gradient-brand':    'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 100%)',
        'gradient-brand-r':  'linear-gradient(135deg, #8B5CF6 0%, #4F8EF7 100%)',
        'gradient-dark':     'linear-gradient(180deg, #0B1120 0%, #060D1A 100%)',
        'gradient-card':     'linear-gradient(145deg, #111C2E 0%, #0F1A2E 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(79, 142, 247, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-brand':  '0 0 30px rgba(99, 102, 241, 0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'gradient-x':    'gradient-x 4s ease infinite',
        'fade-in':       'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
