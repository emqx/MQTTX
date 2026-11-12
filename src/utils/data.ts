export const DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE = 512 * 1024 // 512KB
export const MIN_MAX_PAYLOAD_DISPLAY_SIZE = 16 * 1024 // 16KB
export const MAX_MAX_PAYLOAD_DISPLAY_SIZE = 2 * 1024 * 1024 // 2MB

export const SHOW_MAX_LENGTH = 100

export function normalizeMaxPayloadDisplaySize(value?: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE
  }
  if (value < MIN_MAX_PAYLOAD_DISPLAY_SIZE) {
    return MIN_MAX_PAYLOAD_DISPLAY_SIZE
  }
  if (value > MAX_MAX_PAYLOAD_DISPLAY_SIZE) {
    return MAX_MAX_PAYLOAD_DISPLAY_SIZE
  }
  return value
}

export const DEFAULT_AGENT_MAX_STEPS = 50
export const MIN_AGENT_MAX_STEPS = 10
export const MAX_AGENT_MAX_STEPS = 200

export function normalizeAgentMaxSteps(value?: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return DEFAULT_AGENT_MAX_STEPS
  }
  if (value < MIN_AGENT_MAX_STEPS) {
    return MIN_AGENT_MAX_STEPS
  }
  if (value > MAX_AGENT_MAX_STEPS) {
    return MAX_AGENT_MAX_STEPS
  }
  return Math.round(value)
}

export type BatchStorageMode = 'full' | 'summary'

export const DEFAULT_BATCH_STORAGE_MODE: BatchStorageMode = 'full'
export const DEFAULT_BATCH_MAX_ITEMS = 256
export const MIN_BATCH_MAX_ITEMS = 1
export const MAX_BATCH_MAX_ITEMS = 65535
export const DEFAULT_BATCH_MAX_BYTES = 65536
export const MIN_BATCH_MAX_BYTES = 1024
export const MAX_BATCH_MAX_BYTES = 1048576

export function normalizeBatchStorageMode(value?: unknown): BatchStorageMode {
  return value === 'summary' ? 'summary' : DEFAULT_BATCH_STORAGE_MODE
}

export function normalizeBatchMaxItems(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_BATCH_MAX_ITEMS
  return Math.round(Math.min(MAX_BATCH_MAX_ITEMS, Math.max(MIN_BATCH_MAX_ITEMS, value)))
}

export function normalizeBatchMaxBytes(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_BATCH_MAX_BYTES
  return Math.round(Math.min(MAX_BATCH_MAX_BYTES, Math.max(MIN_BATCH_MAX_BYTES, value)))
}

export function isLargeData(message: string, maxPayloadDisplaySize = DEFAULT_MAX_PAYLOAD_DISPLAY_SIZE): boolean {
  return message.length >= maxPayloadDisplaySize
}

export function calculateTextSize(text: string, decimals = 2) {
  const blob = new Blob([text], { type: 'text/plain' })
  const bytes = blob.size

  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default {}
