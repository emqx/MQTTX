import type { Config } from 'tailwindcss'
import colors from './colors'

const config: Config = {
  darkMode: 'class',
  content: [],
  theme: {
    colors,
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}

export default config
