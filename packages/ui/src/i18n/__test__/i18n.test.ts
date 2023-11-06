import { describe, it, expect } from 'vitest'
import { ElementI18nMap, i18n } from '../index'

describe('i18nSetup', () => {
  it('ElementI18nMap should map language codes to Element Plus locales', () => {
    expect(ElementI18nMap['zh']).toBeDefined()
    expect(ElementI18nMap['en']).toBeDefined()
    expect(ElementI18nMap['ja']).toBeDefined()
    expect(ElementI18nMap['hu']).toBeDefined()
    expect(ElementI18nMap['tr']).toBeDefined()
  })

  it('i18n messages should be correctly populated from modules', () => {
    const messages = i18n.global.messages as unknown as Record<string, any>
    // Assertions for English
    expect(messages['en']).toBeDefined()
    expect(messages['en']['connections']).toBeDefined()
    expect(messages['en']['connections']['connections']).toBe('Connections')

    // Assertions for Chinese
    expect(messages['zh']).toBeDefined()
    expect(messages['zh']['connections']).toBeDefined()
    expect(messages['zh']['connections']['connections']).toBe('连接')

    // Assertions for Hungarian
    expect(messages['hu']).toBeDefined()
    expect(messages['hu']['connections']).toBeDefined()
    expect(messages['hu']['connections']['connections']).toBe('Kapcsolatok')

    // Assertions for Japanese
    expect(messages['ja']).toBeDefined()
    expect(messages['ja']['connections']).toBeDefined()
    expect(messages['ja']['connections']['connections']).toBe('接続')

    // Assertions for Turkish
    expect(messages['tr']).toBeDefined()
    expect(messages['tr']['connections']).toBeDefined()
    expect(messages['tr']['connections']['connections']).toBe('Bağlantılar')
  })

  it('i18n should have correct initial configuration', () => {
    // Similar to above, ensure that the types are being recognized
    const locale = i18n.global.locale as unknown as string
    const fallbackLocale = i18n.global.fallbackLocale as unknown as string
    expect(locale).toBeDefined()
    expect(fallbackLocale).toBe('en')
    const messages = i18n.global.messages as unknown as Record<string, any>
    expect(messages).toBeDefined()
  })
})
