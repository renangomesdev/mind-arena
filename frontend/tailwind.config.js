/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          50:  '#fffdf5',
          100: '#fff9e0',
          200: '#fff0b3',
          300: '#ffe580',
          400: '#ffd740',
          500: '#f5c518',
          600: '#d4a017',
          700: '#a67c00',
          800: '#7a5c00',
          900: '#4a3800',
          950: '#2d2200',
        },
        dark: {
          900: '#0f0e0c',
          800: '#1a1816',
          700: '#252320',
          600: '#33302b',
          500: '#484440',
          400: '#6b6560',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-pop': 'countPop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'float': 'float 3s ease-in-out infinite',
        'player-join': 'playerJoin 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'confetti': 'confetti 1s ease-out forwards',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
        'rank-slide': 'rankSlide 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(245, 197, 24, 0.3), 0 0 20px rgba(245, 197, 24, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(245, 197, 24, 0.5), 0 0 40px rgba(245, 197, 24, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countPop: {
          '0%': { opacity: '0', transform: 'scale(3)' },
          '50%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        playerJoin: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        rankSlide: {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
