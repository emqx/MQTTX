import type { Lang } from 'mqttx'
import ElementPlusEN from 'element-plus/dist/locale/en.mjs'
import ElementPlusHU from 'element-plus/dist/locale/hu.mjs'
import ElementPlusJA from 'element-plus/dist/locale/ja.mjs'
import ElementPlusTR from 'element-plus/dist/locale/tr.mjs'
import ElementPlusZH from 'element-plus/dist/locale/zh-cn.mjs'
import { createI18n } from 'vue-i18n'

export const ElementI18nMap: Record<Lang, any> = {
  zh: ElementPlusZH,
  en: ElementPlusEN,
  ja: ElementPlusJA,
  hu: ElementPlusHU,
  tr: ElementPlusTR,
}

// Define a type for individual locale messages within a module
interface ModuleLocaleMessages {
  [languageCode: string]: string
}

// Define a type for the messages of a module, identified by a key
interface ModuleMessages {
  [key: string]: ModuleLocaleMessages
}

// Define a type for the aggregated i18n messages structure
interface I18nMessages {
  [languageCode: string]: {
    [moduleName: string]: ModuleLocaleMessages
  }
}

// Dynamically import all .ts files in the i18n folder
const modules = import.meta.glob('./*.ts', { eager: true }) as Record<string, { default: ModuleMessages }>

// Transform and aggregate the imported messages into the format expected by Vue i18n
const i18nMessages: I18nMessages = Object.keys(modules).reduce((acc, path) => {
  const moduleName = path.split('/').pop()?.replace('.ts', '') || 'unknown'
  const moduleMessages = modules[path].default
  Object.keys(moduleMessages).forEach((key) => {
    Object.keys(moduleMessages[key]).forEach((lang) => {
      if (!acc[lang]) {
        acc[lang] = {}
      }
      if (!acc[lang][moduleName]) {
        acc[lang][moduleName] = {}
      }
      acc[lang][moduleName][key] = moduleMessages[key][lang]
    })
  })
  return acc
}, {} as I18nMessages)

// Create and export the i18n instance
export const i18n = createI18n({
  locale: 'en', // Default language
  fallbackLocale: 'en', // Fallback language
  messages: i18nMessages,
})
