/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      colors: {
        brand: {
          lime: '#84cc16',
          dark: '#0f172a',
          black: '#171717',
        }
      }
    },
  },
  plugins: [],
}
