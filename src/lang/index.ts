import VueI18n from 'vue-i18n'

import enLocale from 'element-ui/lib/locale/lang/en'
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'

import { formati18n } from '@/utils/i18n'

const i18nModules: i18nLocaleModel = ['connections', 'brokers', 'settings', 'common']

const { en, zh }: VueI18n.LocaleMessages = formati18n(i18nModules)

const lang: VueI18n.LocaleMessages = {
  en: { ...en, ...enLocale },
  zh: { ...zh, ...zhLocale },
}

export default lang
