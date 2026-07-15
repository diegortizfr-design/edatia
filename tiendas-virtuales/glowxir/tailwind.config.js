/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glowxir: {
          50: '#f9f6fe',
          100: '#f2eefc',
          200: '#e5dbf9',
          300: '#d1bdf3',
          400: '#b494eb',
          500: '#9466e0',
          600: '#7d45d0',
          700: '#6932b7',
          800: '#572999',
          900: '#48237d',
          950: '#2a0f53',
        }
      }
    },
  },
  plugins: [],
}
