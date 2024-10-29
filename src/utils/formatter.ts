/**
 * Format bytes into human readable string
 * @param bytes Number of bytes
 * @returns Formatted string like "1.5 MB"
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0 || Number.isNaN(bytes)) {
    return '0 B'
  }

  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  if (i >= sizes.length) return '∞ TB'

  if (i === 0) return `${Math.floor(bytes)} B`

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
