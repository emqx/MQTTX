import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import AutoImport from 'unplugin-auto-import/vite'
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
      AutoImport({
        // targets to transform
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/,
          /\.vue\?vue/, // .vue
          /\.md$/, // .md
        ],

        // global imports to register
        imports: [
          'vue',
          'vue-router',
          'vue-i18n',
          'pinia',
        ],

        // Auto import for module exports under directories
        // by default it only scan one level of modules under the directory
        dirs: [
          './src/composables', // only root modules
          '../../../../packages/ui/src/composables', // only root modules
        ],

        // Auto import inside Vue template
        vueTemplate: true,
      }),
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
      {
        name: 'element-plus-night-theme',
        transform(code, id) {
          if (id.endsWith('packages/ui/src/styles/index.scss')) {
            const nightThemeCode = code.replace(/html\.dark/g, 'html.night')
            return `${code}\n${nightThemeCode}`
          }
          return code
        },
      },
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },
})