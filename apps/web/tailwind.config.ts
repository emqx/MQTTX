import baseConfig from '@mqttx/tailwind-config/base.config'
import { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  presets: [baseConfig],
}

export default config
