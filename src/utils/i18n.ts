import VueI18n from 'vue-i18n'

type FormatLang = {
  [key in Language]?: any
}

const LANGUAGE_KEYS: Language[] = ['zh', 'en', 'ja', 'tr', 'hu', 'ko']

/** A node whose keys are language codes, for example `{ en: 'Hello', zh: '你好' }` */
const isLanguageMap = (value: any): boolean =>
  Boolean(value) && typeof value === 'object' && LANGUAGE_KEYS.some((lang) => lang in value)

/** Picks the value of every language map in a (possibly nested) locale object */
const buildLocale = (values: any, lang: Language): any => {
  const result: any = {}
  Object.keys(values).forEach((key) => {
    const value = values[key]
    if (isLanguageMap(value)) {
      result[key] = value[lang]
    } else if (value && typeof value === 'object') {
      result[key] = buildLocale(value, lang)
    } else {
      result[key] = value
    }
  })
  return result
}

export const formati18n = (transItems: i18nLocaleModel, langs: SupportLangModel): VueI18n.LocaleMessages => {
  const formatLang: FormatLang = {}
  langs.forEach((lang) => {
    formatLang[lang] = {
      connections: {},
      settings: {},
      common: {},
      about: {},
      script: {},
      log: {},
      help: {},
      update: {},
      viewer: {},
      agent: {},
    }
  })
  transItems.forEach((item) => {
    const values = require(`@/lang/${item}`).default
    langs.forEach((lang) => {
      formatLang[lang][item] = buildLocale(values, lang)
    })
  })
  return formatLang
}
