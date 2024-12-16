import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Electron } from 'electron'
import type { ProgressInfo, UpdateCheckResult, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      execute: (...args: any[]) => Promise<any>
      checkForUpdates: () => Promise<UpdateCheckResult | null>
      onUpdateStatus: (callback: (event: Electron.IpcRendererEvent, updateEvent: UpdateEvent) => void) => void
    }
  }
}

export type UpdateEvent =
  | { status: 'checking-for-update' }
  | { status: 'update-available', data: UpdateInfo }
  | { status: 'update-not-available', data: UpdateInfo }
  | { status: 'download-progress', data: ProgressInfo }
  | { status: 'update-downloaded', data: UpdateDownloadedEvent }
  | { status: 'error', data: Error }
