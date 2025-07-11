/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        greenboard: {
          bg: '#0d3b3b', // deep teal
          surface: '#1a4747', // slightly lighter teal
          cream: '#f5f5e6', // soft cream
          accent: '#1ca7a7', // accent teal
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}

