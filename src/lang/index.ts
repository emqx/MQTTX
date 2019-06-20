import en from '@/lang/en'
import zh from '@/lang/zh-CN'

import enLocale from 'element-ui/lib/locale/lang/en'
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'

export default {
  en: { ...en, ...enLocale },
  zh: { ...zh, ...zhLocale },
}
