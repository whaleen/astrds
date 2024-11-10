/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-blue': '#4dc1f9',
        'game-green': '#4dff4d',
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        glow: {
          'from': {
            textShadow: '0 0 10px #4dc1f9, 0 0 20px #4dc1f9, 0 0 30px #4dc1f9',
          },
          'to': {
            textShadow: '0 0 20px #4dc1f9, 0 0 30px #4dc1f9, 0 0 40px #4dc1f9',
          }
        }
      },
    },
  },
  plugins: [],
}
