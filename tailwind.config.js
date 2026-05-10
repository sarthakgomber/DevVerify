/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        surface: {
          1: 'rgba(255, 255, 255, 0.03)',
          2: 'rgba(255, 255, 255, 0.06)',
          3: 'rgba(255, 255, 255, 0.09)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-in':      'fade-in 0.5s ease-out both',
        'fade-in-slow': 'fade-in-slow 0.7s ease-out both',
        'slide-up':     'slide-up 0.6s ease-out both',
        'pulse-glow':   'pulse-glow 3s ease-in-out infinite',
        'float':        'float 4s ease-in-out infinite',
        'spin-slow':    'spin-slow 20s linear infinite',
      },
    },
  },
  plugins: [],
}
