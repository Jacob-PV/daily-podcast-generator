import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        bg: '#0D1117',
        'bg-light': '#161B22',
        surface: '#21262D',
        'surface-hover': '#30363D',
        'text-primary': '#F0F6FC',
        'text-muted': '#8B949E',
        'text-dim': '#484F58',
        border: '#30363D',
        success: '#3FB950',
        error: '#F85149',
        warning: '#D29922',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wave': 'wave 1s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(255, 107, 107, 0.5)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
