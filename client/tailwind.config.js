/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Kiosk / RPG theme
        quest: {
          bg:      '#0f0c29',
          surface: '#1a1740',
          card:    '#24215c',
          border:  '#3d3a7a',
          gold:    '#fbbf24',
          'gold-light': '#fde68a',
          green:   '#22c55e',
          blue:    '#60a5fa',
          purple:  '#a78bfa',
          red:     '#f87171',
        }
      },
      fontFamily: {
        quest: ['Fredoka One', 'Nunito', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-gold': 'pulseGold 1s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.05)', opacity: '0.8' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      }
    },
  },
  plugins: [],
};
