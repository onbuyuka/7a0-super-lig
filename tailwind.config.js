/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Oswald', 'Inter', 'sans-serif'],
        score: ['"Libre Caslon Display"', 'Georgia', 'serif'],
      },
      colors: {
        cream: {
          50: '#faf8f2',
          100: '#f5f1e8',
          200: '#ece4d4',
          300: '#ddd2bb',
        },
        pitch: {
          400: '#3f9d63',
          500: '#2f7d4f',
          600: '#26683f',
          700: '#1f5132',
          800: '#173d27',
          900: '#0f2a1a',
        },
        ink: {
          700: '#2a2620',
          800: '#211d16',
          900: '#15130f',
        },
        flag: {
          red: '#e30a17',
          dark: '#c70000',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.45s ease-out',
        pop: 'pop 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
