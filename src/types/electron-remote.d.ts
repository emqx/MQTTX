import type { SafeStorage } from 'electron'

// @electron/remote exposes safeStorage at runtime, but its type declarations omit it
declare module '@electron/remote' {
  export const safeStorage: SafeStorage
}
