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
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
