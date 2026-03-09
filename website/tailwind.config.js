/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // V-Sparkz strict palette
        navy: {
          950: '#0B1F2A',   // Primary deep navy
          900: '#0E2A3B',   // Midnight blue
          800: '#132F42',
          700: '#1A3A4F',
          600: '#234558',
        },
        accent: {
          DEFAULT: '#1FA2FF',  // Electric blue
          bright: '#00E5FF',   // Cyan glow
          muted: '#1F7A8C',    // Teal-blue
        },
        surface: {
          dark: 'rgba(14, 42, 59, 0.6)',
          card: 'rgba(19, 47, 66, 0.7)',
          border: 'rgba(31, 162, 255, 0.15)',
        },
        text: {
          primary: '#EAF2F8',
          muted: '#94A3B8',
          secondary: '#64748B',
        },
        // Keep primary for compatibility; map to accent
        primary: {
          50: '#E0F7FF',
          100: '#B3ECFF',
          200: '#80DFFF',
          300: '#4DD2FF',
          400: '#1FA2FF',
          500: '#00C8FF',
          600: '#00E5FF',
          700: '#00B8E6',
          800: '#0099C4',
          900: '#1F7A8C',
        },
        dark: {
          900: '#0B1F2A',
          800: '#0E2A3B',
          700: '#132F42',
          600: '#1A3A4F',
          500: '#234558',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'vsparkz': '12px',
        'vsparkz-lg': '16px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.24)',
        'glow': '0 0 24px rgba(31, 162, 255, 0.2)',
        'glow-cyan': '0 0 32px rgba(0, 229, 255, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(180deg, #0B1F2A 0%, #132F42 50%, #1A252E 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(14, 42, 59, 0.8) 0%, rgba(19, 47, 66, 0.6) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #1FA2FF 0%, #00E5FF 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(31, 162, 255, 0.2)' },
          '50%': { opacity: '0.9', boxShadow: '0 0 20px 4px rgba(31, 162, 255, 0.15)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
