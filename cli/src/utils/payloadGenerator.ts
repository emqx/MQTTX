import crypto from 'crypto'
import { MQTT_SINGLE_MESSAGE_BYTE_LIMIT } from './constants'

/**
 * Parses a size string (e.g., "1KB", "512B", "2MB") and returns the size in bytes.
 * @param sizeStr The size string to parse.
 * @returns The size in bytes.
 * @throws Error if the size string is invalid or unit is not recognized.
 */
export function parsePayloadSize(sizeStr: string): number {
  if (!sizeStr || typeof sizeStr !== 'string') {
    throw new Error('Payload size string must be a non-empty string.')
  }

  const sizeRegex = /^(\d+(\.\d+)?)([BKMG])?B?$/i // Allow B, KB, MB, GB and optional B at the end, case insensitive. Allows decimal for base number. Unit is optional.
  const match = sizeStr.match(sizeRegex)

  if (!match) {
    throw new Error(`Invalid size format: "${sizeStr}". Use formats like 1024B, 1KB, 2.5MB.`)
  }

  const size = parseFloat(match[1])
  const unit = match[3] ? match[3].toUpperCase() : 'B' // match[3] captures B, K, M, or G, default to B if not present

  switch (unit) {
    case 'B':
      return Math.round(size) // Round to nearest byte if decimal was used for B, though less common.
    case 'K':
      return Math.round(size * 1024)
    case 'M':
      return Math.round(size * 1024 * 1024)
    case 'G':
      return Math.round(size * 1024 * 1024 * 1024)
    default:
      // This case should ideally not be reached if regex is correct
      throw new Error(`Unknown size unit: "${unit}" in "${sizeStr}".`)
  }
}

/**
 * Generates a random Buffer of the specified size.
 * @param sizeInBytes The desired size of the payload in bytes.
 * @returns A Buffer containing random bytes.
 * @throws Error if sizeInBytes is negative.
 */
export function generateRandomPayload(sizeInBytes: number): Buffer {
  if (sizeInBytes < 0) {
    throw new Error('Payload size cannot be negative.')
  }

  if (sizeInBytes > MQTT_SINGLE_MESSAGE_BYTE_LIMIT) {
    throw new Error(`Requested payload size (${sizeInBytes} bytes) exceeds MQTT's maximum limit of 256MB.`)
  }

  if (sizeInBytes === 0) {
    return Buffer.alloc(0)
  }
  return crypto.randomBytes(sizeInBytes)
}
