/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          900: '#0f172a', // Darkest blue-gray
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        accent: {
          900: '#7b2cbf', // Purple
          800: '#9d4edd',
          700: '#c77dff',
          600: '#d8b4fe',
          500: '#e9d5ff',
        },
        archive: {
          paper: '#f8f5e6',
          ink: '#2b2820',
          gold: '#d4af37',
          parchment: '#f4ecd8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system'],
        serif: ['Merriweather', 'ui-serif', 'Georgia'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-pulse': 'borderPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typewriter': 'typewriter 2s steps(40) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        borderPulse: {
          '0%, 100%': { borderColor: 'rgba(147, 51, 234, 0.2)' },
          '50%': { borderColor: 'rgba(147, 51, 234, 0.6)' },
        },
        typewriter: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        }
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 10px 0 rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(124, 58, 237, 0.5)',
        'soft': '0 5px 15px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}; 