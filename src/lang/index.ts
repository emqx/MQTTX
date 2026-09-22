import VueI18n from 'vue-i18n'

import zhLocale from 'element-ui/lib/locale/lang/zh-CN'
import enLocale from 'element-ui/lib/locale/lang/en'
import jaLocale from 'element-ui/lib/locale/lang/ja'
import trLocale from 'element-ui/lib/locale/lang/tr-TR'
import huLocale from 'element-ui/lib/locale/lang/hu'
import koLocale from 'element-ui/lib/locale/lang/ko'

import { formati18n } from '@/utils/i18n'

const supportLang: SupportLangModel = ['zh', 'en', 'ja', 'tr', 'hu', 'ko']
const i18nModules: i18nLocaleModel = [
  'connections',
  'settings',
  'common',
  'about',
  'script',
  'log',
  'help',
  'update',
  'viewer',
  'copilot',
]

const { en, zh, ja, tr, hu, ko }: VueI18n.LocaleMessages = formati18n(i18nModules, supportLang)

const lang: VueI18n.LocaleMessages = {
  en: { ...en, ...enLocale },
  zh: { ...zh, ...zhLocale },
  ja: { ...ja, ...jaLocale },
  tr: { ...tr, ...trLocale },
  hu: { ...hu, ...huLocale },
  ko: { ...ko, ...koLocale },
}

export default lang
