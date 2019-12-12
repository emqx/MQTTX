declare module 'lodash-id'
declare module 'jump.js'
declare module 'element-ui/lib/transitions/collapse-transition'
declare module 'element-ui/lib/locale' {}
declare module 'element-ui/lib/locale/lang/en' {}
declare module 'element-ui/lib/locale/lang/zh-CN' {}

type i18nLocaleModel = ['connections', 'brokers', 'settings', 'common', 'about']

declare module '*.json' {
  const value: any
  export default value
}
