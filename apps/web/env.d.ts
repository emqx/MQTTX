/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly VITE_WEB_DB_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
