/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
