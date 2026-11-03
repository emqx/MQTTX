import CryptoJS from 'crypto-js'
import { safeStorage } from 'electron'
import { ENCRYPT_KEY } from '@/utils/idGenerator'

// New values use the OS keychain behind a `safe:` prefix. Legacy CryptoJS values stay readable, are
// migrated on startup, and are still written when no usable keychain exists.
const SAFE_PREFIX = 'safe:'

// Linux safeStorage falls back to `basic_text` (a hardcoded password) when no real keyring is available
const canUseSafeStorage = (): boolean =>
  safeStorage.isEncryptionAvailable() &&
  (process.platform !== 'linux' || !['basic_text', 'unknown'].includes(safeStorage.getSelectedStorageBackend()))

const decryptLegacy = (stored: string): string => CryptoJS.AES.decrypt(stored, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8)

export const encryptAPIKey = (plain: string): string => {
  if (!plain) return ''
  if (canUseSafeStorage()) {
    return SAFE_PREFIX + safeStorage.encryptString(plain).toString('base64')
  }
  return CryptoJS.AES.encrypt(plain, ENCRYPT_KEY).toString()
}

export const decryptAPIKey = (stored: string): string => {
  if (!stored) return ''
  try {
    if (stored.startsWith(SAFE_PREFIX)) {
      return safeStorage.decryptString(Buffer.from(stored.slice(SAFE_PREFIX.length), 'base64'))
    }
    return decryptLegacy(stored)
  } catch {
    // A key that cannot be decrypted (e.g. the profile moved to another machine) is treated as missing
    return ''
  }
}

export const migrateAPIKey = (stored: string): string | null => {
  if (!stored || stored.startsWith(SAFE_PREFIX) || !canUseSafeStorage()) return null
  const plain = decryptLegacy(stored)
  if (!plain) return null
  return encryptAPIKey(plain)
}
