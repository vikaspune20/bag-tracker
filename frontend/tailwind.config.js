/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        airline: {
          blue: '#003366',
          sky: '#87CEEB',
          dark: '#001F3F',
          light: '#F0F8FF',
        },
        premium: {
          bg: '#050508',
          surface: '#0c0e14',
          card: '#12151f',
          muted: '#8b92a8',
          border: 'rgba(255,255,255,0.08)',
        },
        neon: {
          blue: '#22d3ee',
          teal: '#2dd4bf',
          glow: '#38bdf8',
        },
        landing: {
          bg: '#f4f7fb',
          surface: '#eef2f7',
          card: '#ffffff',
          text: '#0f172a',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.15), transparent), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(45,212,191,0.08), transparent)',
        'hero-mesh-light':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.2), transparent), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(45,212,191,0.12), transparent)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        'path-dash': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s ease-out both',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'path-dash': 'path-dash 8s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-light':
          '0 4px 24px rgba(15,23,42,0.07), 0 1px 0 rgba(255,255,255,0.95) inset',
        neon: '0 0 40px rgba(34,211,238,0.25), 0 0 80px rgba(45,212,191,0.1)',
        'neon-soft': '0 8px 28px rgba(34,211,238,0.18), 0 0 1px rgba(45,212,191,0.2)',
      },
    },
  },
  plugins: [],
}
