/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#E50914',
        'brand-black': '#000000',
        'brand-grey': '#141414',
      },
      backgroundImage: {
        'red-glow': 'radial-gradient(circle, rgba(229,9,20,0.4) 0%, rgba(0,0,0,0) 70%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
