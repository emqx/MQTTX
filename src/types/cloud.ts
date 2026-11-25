export interface CloudIssue {
  code: string
  params: Record<string, string | number>
}
export type CloudSessionStatus = 'signed-out' | 'authorizing' | 'exchanging' | 'signed-in' | 'expired'
export interface CloudSession {
  status: CloudSessionStatus
  message: CloudIssue | null
  expiresAt: number | null
  email: string | null
}
export interface CloudRelease {
  id: string
  version: string
}
export interface CloudReleaseInfo extends CloudRelease {
  url: string
}
export interface ExtensionSnapshot {
  removed: boolean
  busy: boolean
  active: CloudReleaseInfo | null
  candidate: CloudReleaseInfo | null
  error: CloudIssue | null
  updateError: CloudIssue | null
}
export interface CloudState extends ExtensionSnapshot {
  revision: number
  session: CloudSession
}
export interface CloudManifest {
  version: string
  apiVersion: number
  kind: string
  entry: string
}
export interface CloudTheme {
  lang: string
  messages: Record<string, string>
  tokens: Record<string, string>
}
export interface CloudConnectionDraft {
  name: string
  host: string
  port: number
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss'
}
export interface CloudDocument {
  id: string
  document: string
}
export interface CloudParams {
  copyText: CloudDocument & { text: string }
  createConnection: CloudDocument & { connection: CloudConnectionDraft }
  copyConnection: CloudDocument & { connection: CloudConnectionDraft }
  requestRemove: CloudDocument
  login: { locale: string }
  logout: Record<string, never>
  cancel: Record<string, never>
  status: Record<string, never>
  enter: Record<string, never>
  add: Record<string, never>
  retry: Record<string, never>
  remove: Record<string, never>
  leave: Record<string, never>
  mounting: { id: string }
  connect: { id: string }
  ready: CloudDocument
  unmount: { id: string }
  request: CloudDocument & { method: 'GET'; path: string }
}
export interface CloudResults {
  copyText: void
  createConnection: CloudConnectionDraft
  copyConnection: void
  requestRemove: void
  login: CloudState
  logout: CloudState
  cancel: CloudState
  status: CloudState
  enter: CloudState
  add: CloudState
  retry: CloudState
  remove: CloudState
  leave: void
  mounting: CloudState
  connect: string
  ready: CloudState
  unmount: CloudState
  request: unknown
}
export type CloudMethod = keyof CloudParams
export type CloudRequest = { [M in CloudMethod]: { method: M; args: CloudParams[M] } }[CloudMethod]
export type CloudResponse<M extends CloudMethod> =
  | { ok: true; data: CloudResults[M] }
  | { ok: false; error: CloudIssue }
export interface CloudDiagnostic {
  name: string
  code?: string
  syscall?: string
  file?: string
  frames: string[]
}
export interface InstallRequest {
  bytes: Uint8Array
  directory: string
  hash: string
  version: string
}
export type InstallResponse =
  | { ok: true; manifest: CloudManifest }
  | { ok: false; error: CloudIssue; diagnostic: CloudDiagnostic }
