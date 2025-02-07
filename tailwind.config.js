/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'text-dark': '#f3f3ef',
        'text-light': '#344c50'
      },
      keyframes: {
        fill: {
          '0%': { width: `0%` },
          '100%': { width: '100%' }
        }
      },
      screens: {
        adCol: '900px',
        tablet: '640px',
        '2xl': '1440px',
        '3xl': '1536px',
        '4xl': '1920px'
      }
    }
  },
  plugins: []
}
