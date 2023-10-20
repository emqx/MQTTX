import baseConfig from '@mqttx/tailwind-config/base.config'
import { Config } from 'tailwindcss'

const config: Config = {
  presets: [baseConfig],
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
}

export default config
