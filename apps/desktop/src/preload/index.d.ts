import type { ElectronAPI } from '@electron-toolkit/preload'
import type pkg from 'electron-updater'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      execute: (...args: any[]) => Promise<any>
      checkForUpdates: () => Promise<pkg.UpdateCheckResult | null>
    }
  }
}
