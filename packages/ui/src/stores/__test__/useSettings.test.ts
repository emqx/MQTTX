import type { Settings } from 'mqttx'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from '../useSettingsStore'

// Mocking a class for localStorage with all necessary methods
class LocalStorageMock {
  public store: { [key: string]: string } = {}

  getItem = vi.fn((key: string): string | null => this.store[key] || null)
  setItem = vi.fn((key: string, value: string): void => {
    this.store[key] = value
  })

  removeItem = vi.fn((key: string): void => {
    delete this.store[key]
  })

  clear = vi.fn((): void => {
    this.store = {}
  })

  key = vi.fn((index: number): string | null => Object.keys(this.store)[index] || null)
  get length(): number {
    return Object.keys(this.store).length
  }
}

// Set the mock localStorage on the global object
globalThis.localStorage = new LocalStorageMock() as unknown as Storage

// Set up Pinia store and reset mocks before each test
beforeEach(() => {
  // Create a fresh instance of Pinia and setActivePinia
  setActivePinia(createPinia())
  // Reset the local storage mock's store
  ;(globalThis.localStorage as unknown as LocalStorageMock).store = {}
  vi.clearAllMocks()
})

describe('settingsStore', () => {
  it('should update settings', () => {
    const store = useSettingsStore()
    const newSettings: Settings = {
      currentLang: 'zh',
      autoCheck: true,
      autoResub: true,
      multiTopics: false,
      maxReconnectTimes: 3,
      syncOsTheme: true,
      currentTheme: 'dark',
      jsonHighlight: true,
      logLevel: 'debug',
      ignoreQoS0Message: false,
      enableCopilot: false,
      openAIAPIHost: '',
      openAIAPIKey: '',
      model: '',
    }
    store.updateSettings(newSettings)
    expect(store.settings).toEqual(newSettings)
  })
})
