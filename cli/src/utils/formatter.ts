/**
 * Format bytes into human readable string
 * @param bytes Number of bytes
 * @returns Formatted string like "1.54 MB"
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0 || Number.isNaN(bytes)) {
    return '0B'
  }

  if (bytes === 0) {
    return '0B'
  }

  if (bytes < 1) {
    return `${Number(bytes.toFixed(2))}B`
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  if (i >= sizes.length) return '∞TB'

  if (i === 0) {
    return `${Math.floor(bytes)}B`
  }

  const value = bytes / Math.pow(k, i)
  const hasDecimal = Math.abs(value - Math.floor(value)) > 0.001

  if (!hasDecimal) {
    return `${Math.floor(value)}${sizes[i]}`
  }

  return `${Number(value.toFixed(2))}${sizes[i]}`
}
