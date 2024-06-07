export const LARGE_DATA_THRESHOLD = 524288 // 512KB

export const SHOW_MAX_LENGTH = 100

export function isLargeData(message: string): boolean {
  return message.length > LARGE_DATA_THRESHOLD
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
