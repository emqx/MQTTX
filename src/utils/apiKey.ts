import CryptoJS from 'crypto-js'
import type { SafeStorage } from 'electron'
import { ENCRYPT_KEY } from '@/utils/idGenerator'

/**
 * API key storage.
 *
 * New values are encrypted with Electron's `safeStorage` (OS keychain) and carry a `safe:` prefix.
 * Values written before that prefix existed are legacy AES ciphertext keyed with `ENCRYPT_KEY`;
 * they stay readable and are migrated to `safe:` on startup. Without a working keychain the
 * legacy format is still written so the app keeps working on machines with no secret store.
 */
export type SafeStorageLike = Pick<SafeStorage, 'isEncryptionAvailable' | 'encryptString' | 'decryptString'>

const SAFE_PREFIX = 'safe:'

const encryptLegacy = (plain: string): string => CryptoJS.AES.encrypt(plain, ENCRYPT_KEY).toString()

const decryptLegacy = (stored: string): string => CryptoJS.AES.decrypt(stored, ENCRYPT_KEY).toString(CryptoJS.enc.Utf8)

export const encryptAPIKey = (plain: string, storage: SafeStorageLike): string => {
  if (!plain) return ''
  if (storage.isEncryptionAvailable()) {
    return SAFE_PREFIX + storage.encryptString(plain).toString('base64')
  }
  return encryptLegacy(plain)
}

export const decryptAPIKey = (stored: string, storage: SafeStorageLike): string => {
  if (!stored) return ''
  try {
    if (stored.startsWith(SAFE_PREFIX)) {
      return storage.decryptString(Buffer.from(stored.slice(SAFE_PREFIX.length), 'base64'))
    }
    return decryptLegacy(stored)
  } catch {
    // A key that cannot be decrypted (e.g. the profile moved to another machine) is treated as missing
    return ''
  }
}

export const migrateAPIKey = (stored: string, storage: SafeStorageLike): string | null => {
  if (!stored || stored.startsWith(SAFE_PREFIX) || !storage.isEncryptionAvailable()) return null
  const plain = decryptLegacy(stored)
  if (!plain) return null
  return encryptAPIKey(plain, storage)
}
