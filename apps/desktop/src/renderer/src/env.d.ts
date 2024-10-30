/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

declare module '@/composables/useMockData'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
