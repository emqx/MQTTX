declare module 'element-ui/lib/transitions/collapse-transition'
declare module 'element-ui/lib/locale' {}
declare module 'element-ui/lib/locale/lang/en' {}
declare module 'element-ui/lib/locale/lang/zh-CN' {}
declare module 'element-ui/lib/locale/lang/ja' {}
declare module 'element-ui/lib/locale/lang/tr-TR' {}

type i18nLocaleModel = ['connections', 'settings', 'common', 'about', 'script', 'log']
type SupportLangModel = ['zh', 'en', 'ja', 'tr']

declare module '*.json' {
  const value: any
  export default value
}
