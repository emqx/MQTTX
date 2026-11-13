import { ipcRenderer } from 'electron'
import { cloudError } from './cloudErrors'
import type { CloudMethod, CloudParams, CloudResponse, CloudResults, CloudState } from '../types/cloud'

type Arguments<M extends CloudMethod> = Record<string, never> extends CloudParams[M]
  ? [args?: CloudParams[M]]
  : [args: CloudParams[M]]

export async function invokeCloud<M extends CloudMethod>(method: M, ...args: Arguments<M>): Promise<CloudResults[M]> {
  const response = (await ipcRenderer.invoke('cloud:invoke', method, args[0] || {})) as CloudResponse<M>
  if (!response?.ok) throw cloudError(response?.error)
  return response.data
}

export function watchCloudState(listener: (state: CloudState) => void): () => void {
  const onState = (_event: Electron.IpcRendererEvent, state: CloudState) => listener(state)
  ipcRenderer.on('cloud:state', onState)
  return () => {
    ipcRenderer.removeListener('cloud:state', onState)
  }
}
