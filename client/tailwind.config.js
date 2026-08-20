/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          950: '#0A0F1D',
          900: '#0F172A',
          850: '#1E293B',
          800: '#334155',
          700: '#475569',
          600: '#64748B',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        surface: {
          bg: '#F1F5F9',
          card: '#FFFFFF',
          border: '#CBD5E1',
        },
        teal: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#2DD4BF',
          500: '#0D9488',
          600: '#0F766E',
          700: '#115E59',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#D97706',
          600: '#B45309',
        },
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
        },
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        pop: '0 10px 25px -3px rgba(15, 23, 42, 0.15), 0 4px 6px -4px rgba(15, 23, 42, 0.1)',
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.125rem' }],
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
      },
    },
  },
  plugins: [],
}
