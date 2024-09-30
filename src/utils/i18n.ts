import VueI18n from 'vue-i18n'

type FormatLang = {
  [key in Language]?: any
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
    }
  })
  transItems.forEach((item) => {
    const values = require(`@/lang/${item}`).default
    Object.keys(values).forEach((key: string) => {
      langs.forEach((lang) => {
        formatLang[lang][item][key] = values[key][lang]
      })
    })
  })
  return formatLang
}
