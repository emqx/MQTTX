declare module 'lodash-id'
declare module 'jump.js'
declare module 'uuid'
declare module 'vue-click-outside'
declare module 'element-ui/lib/transitions/collapse-transition'
declare module 'element-ui/lib/locale' {}
declare module 'element-ui/lib/locale/lang/en' {}
declare module 'element-ui/lib/locale/lang/zh-CN' {}

type i18nLocaleModel = ['connections', 'settings', 'common', 'about']

declare module '*.json' {
  const value: any
  export default value
}
