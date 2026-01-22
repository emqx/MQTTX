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
