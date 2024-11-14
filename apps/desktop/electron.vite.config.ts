import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
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
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: 'icon',
            customCollections: [
              'custom',
            ],
          }),
        ],
      }),
      Icons({
        compiler: 'vue3',
        customCollections: {
          custom: FileSystemIconLoader('../../packages/ui/src/assets/icons'),
        },
      }),
    ],
  },
})
