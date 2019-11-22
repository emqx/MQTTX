import VueI18n from 'vue-i18n'

export const formati18n = (transItems: i18nLocaleModel): VueI18n.LocaleMessages => {
  const en: any = {
    connections: {},
    brokers: {},
    settings: {},
    common: {},
  }
  const zh: any = {
    connections: {},
    brokers: {},
    settings: {},
    common: {},
  }
  transItems.forEach((item) => {
    const values = require(`@/lang/${item}`).default
    Object.keys(values).forEach((key: string) => {
      const { zh: $zh, en: $en } = values[key]
      en[item][key] = $en
      zh[item][key] = $zh
    })
  })
  return { en, zh }
}
