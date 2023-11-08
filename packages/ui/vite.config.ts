import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import path from 'path'

import type { UserConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), vueJsx(), dts()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, '/src/index.ts'),
      name: '@mqttx/ui',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'element-plus'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
      },
    },
  },
}) as UserConfig
