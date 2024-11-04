import type { Config } from 'tailwindcss'
import baseConfig from '@mqttx/tailwind-config/base.config'

const config: Config = {
  presets: [baseConfig],
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
}

export default config
