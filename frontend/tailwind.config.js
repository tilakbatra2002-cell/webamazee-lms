/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eefcf9',
          100: '#d4f7ef',
          200: '#a9eede',
          300: '#72e0c9',
          400: '#3ccbae',
          500: '#1cae93',
          600: '#128d78',
          700: '#127161',
          800: '#135a4f',
          900: '#134a43',
          950: '#052b27',
        },
        amber: {
          50: '#fff9ec',
          100: '#ffefc8',
          200: '#ffdc8c',
          300: '#ffc250',
          400: '#ffa524',
          500: '#f9860a',
          600: '#dd6405',
          700: '#b74508',
          800: '#94360d',
          900: '#7a2e0e',
        },
        ink: {
          50: '#f4f6f7',
          100: '#e4e9eb',
          200: '#cad3d8',
          300: '#a3b2ba',
          400: '#748994',
          500: '#586d79',
          600: '#495a65',
          700: '#3d4b54',
          800: '#232d33',
          850: '#1a2226',
          900: '#12181b',
          950: '#0a0e10',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(60,203,174,0.15), 0 8px 24px -8px rgba(28,174,147,0.35)',
        card: '0 1px 2px rgba(10,14,16,0.06), 0 8px 24px -12px rgba(10,14,16,0.12)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.35s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
