declare module 'highlight.js/lib/core' {
  import { PluginObject } from 'vue'
  const hljs: any
  export default hljs
}

declare module 'highlight.js/lib/languages/json' {
  const json: any
  export default json
}

declare module '@highlightjs/vue-plugin' {
  import { Plugin } from 'vue'
  const hljsVuePlugin: Plugin
  export default hljsVuePlugin
}
