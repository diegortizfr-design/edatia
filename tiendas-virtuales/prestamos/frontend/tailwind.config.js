/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#b8d6ff',
          300: '#7cb2ff',
          400: '#3b89ff',
          500: '#0062ff',
          600: '#004ee0',
          700: '#003bb8',
          800: '#002e94',
          900: '#00257a',
          950: '#00134a',
        }
      }
    },
  },
  plugins: [],
}
