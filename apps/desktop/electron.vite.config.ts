import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
      },
    },
    plugins: [
      VueRouter({
        routesFolder: [
          {
            src: 'src/renderer/src/pages',
          },
        ],
      }),
      vue(),
      Components({
        dts: true,
        directoryAsNamespace: true,
        dirs: ['src/components', '../../../../packages/ui/src/components'],
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
})
