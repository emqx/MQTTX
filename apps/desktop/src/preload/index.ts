import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api: Window['api'] = {
  execute: (...args) => ipcRenderer.invoke('db:execute', ...args),
  onUpdateStatus: callback => ipcRenderer.on('update-status', (event, status, data) => {
    callback(event, { status, data })
  }),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  cancelDownload: () => ipcRenderer.invoke('cancel-download'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  installCLI: () => ipcRenderer.invoke('install-cli'),
  onInstallCLIStatus: callback => ipcRenderer.on('install-cli-status', (event, status, data) => {
    callback(event, { status, data })
  }),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
