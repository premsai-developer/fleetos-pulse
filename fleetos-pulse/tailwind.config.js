/** FleetOS Pulse B2B SaaS Design Tokens (Light Theme) */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#F5F7F5',
        'panel': '#FFFFFF',
        'forest': '#245B49',
        'forest-hover': '#1D4A3B',
        'forest-light': '#EBF2EE',
        'dark': '#202923',
        'mute': '#69756D',
        'subtle': '#E2E8E3',
        'amber-warn': '#D99A36',
        'amber-light': '#FEF8EC',
        'red-err': '#DC2626',
        'red-light': '#FEE2E2',
        'green-ok': '#16A34A',
        'green-light': '#DCFCE7'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        card: '10px'
      }
    }
  },
  plugins: []
};

