/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#E5E8CE',
        sage: {
          DEFAULT: '#789575',
          light: '#9bb699',
          dark: '#556d53',
          darker: '#344533',
          slate: '#233022',
        },
        terracotta: {
          DEFAULT: '#D97746',
          light: '#e58c5f',
          dark: '#bf5f2f',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
