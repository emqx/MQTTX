import type { Config } from 'tailwindcss'
import baseConfig from '@mqttx/tailwind-config/base.config'

const config: Config = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  presets: [baseConfig],
}

export default config
