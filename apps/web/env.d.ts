/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly VITE_WEB_DB_SECRET_KEY: string
  readonly __APP_VERSION__: string
  readonly VITE_APP_DEFAULT_HOST: string
  readonly VITE_APP_IS_ONLINE_ENV?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
