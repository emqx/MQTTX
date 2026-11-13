declare module 'uuid'

declare module 'uuid/v5' {
  export default function uuidV5(value: string, namespace: string): string
}

declare module 'vue-click-outside'
declare module 'monaco-proto-lint'
declare module 'vue-markdown'
declare module 'crypto-js'

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
