/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void:      '#0A0A0F',
        surface:   { 1: '#141420', 2: '#1E1E30', 3: '#2A2A40' },
        memphis:   {
          orange:  '#FF6B35',
          violet:  '#6C5CE7',
          cyan:    '#00D2FF',
          yellow:  '#FECA57',
          pink:    '#FF78B4',
          green:   '#00E676',
          red:     '#FF4757',
        },
        txt:       { 1: '#F5F5FF', 2: '#BEBEDD', 3: '#8888AA' },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        memphis: '20px',
        blob:    '30px',
      },
      borderWidth: {
        3: '3px',
        4: '4px',
      },
      animation: {
        'sphere-pulse':  'sphere-pulse 3s ease-in-out infinite',
        'sphere-orbit':  'sphere-orbit 8s linear infinite',
        'sphere-orbit-r':'sphere-orbit-reverse 6s linear infinite',
        'sphere-glow':   'sphere-glow 2s ease-in-out infinite',
        'sphere-scan':   'sphere-scan 1.5s ease-in-out infinite',
        'geo-float':     'geo-float 6s ease-in-out infinite',
        'geo-spin':      'geo-spin 12s linear infinite',
        'fade-in':       'fade-in 0.5s ease-out both',
        'slide-up':      'slide-up 0.6s ease-out both',
        'bento-pop':     'bento-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'text-reveal':   'text-reveal 0.8s ease-out both',
        'dash-draw':     'dash-draw 2s linear infinite',
        'status-cycle':  'status-cycle 4s steps(1) infinite',
      },
      keyframes: {
        'sphere-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%':      { transform: 'scale(1.05)', opacity: '1' },
        },
        'sphere-orbit': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'sphere-orbit-reverse': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        },
        'sphere-glow': {
          '0%, 100%': { boxShadow: '0 0 40px 10px rgba(0,210,255,0.3), 0 0 80px 30px rgba(108,92,231,0.15)' },
          '50%':      { boxShadow: '0 0 60px 20px rgba(0,210,255,0.5), 0 0 120px 50px rgba(108,92,231,0.3)' },
        },
        'sphere-scan': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '50%':  { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'geo-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotate(10deg)' },
        },
        'geo-spin': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'bento-pop': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'text-reveal': {
          from: { opacity: '0', transform: 'translateY(20px)', filter: 'blur(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        'dash-draw': {
          to: { strokeDashoffset: '-50' },
        },
      },
    },
  },
  plugins: [],
}
