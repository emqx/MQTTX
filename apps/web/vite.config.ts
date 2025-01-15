import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import { version } from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.BASE_URL || '/',
    build: {
      outDir: env.VITE_APP_OUTPUT_DIR || 'dist',
    },
    define: {
      'import.meta.env.__APP_VERSION__': JSON.stringify(version),
    },
    plugins: [
      VueRouter(),
      vue(),
      vueJsx(),
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

        // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
        resolvers: [
          ElementPlusResolver(),
        ],

        // Auto import for module exports under directories
        // by default it only scan one level of modules under the directory
        dirs: [
          './src/composables', // only root modules
          '../../packages/ui/src/composables', // only root modules
        ],

        // Auto import inside Vue template
        vueTemplate: true,
      }),
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
      nodePolyfills({
        // WORKAROUND: https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/90
        exclude: ['crypto'],
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
  }
})
