import type { Config } from 'tailwindcss'
import colors from './colors'

const config: Config = {
  darkMode: 'class',
  content: [],
  theme: {
    colors,
    extend: {
      backgroundImage: () => ({
        'gradient-card': 'var(--color-bg-card-gradient)',
      }),
    },
  },
  plugins: [],
}

export default config
