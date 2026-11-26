/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        noir: {
          950: '#0d0d0c',
          900: '#141413',
          850: '#1a1918',
          800: '#232220',
          700: '#33312e',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f8f5ee',
          200: '#eee8dc',
          300: '#ddd2bf',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
