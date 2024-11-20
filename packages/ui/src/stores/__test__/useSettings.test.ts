// import { beforeEach, describe, expect, it, vi } from 'vitest'
// import { useSettingsStore } from '../useSettingsStore'
import { beforeEach, vi } from 'vitest'

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

// TODO: Fix the test
// describe('settingsStore', () => {
//   it('should change theme', () => {
//     const store = useSettingsStore()
//     store.changeTheme('light')
//     expect(store.theme).toBe('light')
//   })

//   it('should change language and update localStorage', () => {
//     const store = useSettingsStore()
//     store.changeLang('ja')
//     expect(store.lang).toBe('ja')
//     expect(localStorage.setItem).toHaveBeenCalledWith('lang', 'ja')
//   })

//   it('should retrieve language from localStorage on initialization', () => {
//     localStorage.setItem('lang', 'en')
//     const store = useSettingsStore()
//     expect(store.lang).toBe('en')
//     expect(localStorage.getItem).toHaveBeenCalledWith('lang')
//   })
// })
