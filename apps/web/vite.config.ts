import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    vue(),
    vueJsx(),
    Components({
      dts: true,
      directoryAsNamespace: true,
      dirs: ['src/components', '../../packages/ui/src/components'],
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
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
