/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1F2A',
          900: '#0E2A3B',
          800: '#132F42',
          700: '#1A3A4F',
          600: '#234558',
        },
        accent: {
          DEFAULT: '#1FA2FF',
          bright: '#00E5FF',
          muted: '#1F7A8C',
        },
        surface: {
          border: 'rgba(31, 162, 255, 0.15)',
        },
        text: {
          primary: '#EAF2F8',
          muted: '#94A3B8',
          secondary: '#64748B',
        },
        // Light mode colors
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        blue: {
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'vsparkz': '12px',
        'vsparkz-lg': '16px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.24)',
        'glow': '0 0 24px rgba(31, 162, 255, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.12)',
        'light': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(180deg, #0B1F2A 0%, #132F42 50%, #1A252E 100%)',
        'gradient-accent': 'linear-gradient(135deg, #1FA2FF 0%, #00E5FF 100%)',
      },
    },
  },
  plugins: [],
}
