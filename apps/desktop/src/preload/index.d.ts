import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      execute: (...args: any[]) => Promise<any>
    }
  }
}
