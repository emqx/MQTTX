import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
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
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        body: {
          fontSize: '14px',
        },
      })
    }),
  ],
}

export default config
