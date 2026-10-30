import { expect } from 'chai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY } from '@/utils/idGenerator'
import { decryptAPIKey, encryptAPIKey, migrateAPIKey } from '@/utils/apiKey'
import type { SafeStorageLike } from '@/utils/apiKey'

const reversibleStorage: SafeStorageLike = {
  isEncryptionAvailable: () => true,
  encryptString: (plain: string) => Buffer.from(plain, 'utf8'),
  decryptString: (encrypted: Buffer) => encrypted.toString('utf8'),
}

const unavailableStorage: SafeStorageLike = {
  ...reversibleStorage,
  isEncryptionAvailable: () => false,
}

const legacyValue = (plain: string) => CryptoJS.AES.encrypt(plain, ENCRYPT_KEY).toString()

describe('apiKey', () => {
  describe('encryptAPIKey / decryptAPIKey', () => {
    it('round-trips a key through safeStorage', () => {
      const stored = encryptAPIKey('sk-test', reversibleStorage)
      expect(stored).to.match(/^safe:/)
      expect(decryptAPIKey(stored, reversibleStorage)).to.equal('sk-test')
    })

    it('keeps the empty key empty', () => {
      expect(encryptAPIKey('', reversibleStorage)).to.equal('')
      expect(decryptAPIKey('', reversibleStorage)).to.equal('')
    })

    it('decrypts a legacy CryptoJS value', () => {
      expect(decryptAPIKey(legacyValue('sk-test'), reversibleStorage)).to.equal('sk-test')
    })

    it('falls back to the legacy format when encryption is unavailable', () => {
      const stored = encryptAPIKey('sk-test', unavailableStorage)
      expect(stored).to.not.match(/^safe:/)
      expect(decryptAPIKey(stored, unavailableStorage)).to.equal('sk-test')
    })

    it('returns an empty key for a corrupted safe value', () => {
      const failingStorage: SafeStorageLike = {
        ...reversibleStorage,
        decryptString: () => {
          throw new Error('cannot decrypt')
        },
      }
      expect(decryptAPIKey(`safe:${Buffer.from('broken').toString('base64')}`, failingStorage)).to.equal('')
    })
  })

  describe('migrateAPIKey', () => {
    it('migrates a legacy value to a safe value', () => {
      const migrated = migrateAPIKey(legacyValue('sk-test'), reversibleStorage)
      expect(migrated).to.match(/^safe:/)
      expect(decryptAPIKey(migrated as string, reversibleStorage)).to.equal('sk-test')
    })

    it('returns null for an empty value', () => {
      expect(migrateAPIKey('', reversibleStorage)).to.equal(null)
    })

    it('returns null for an already safe value', () => {
      expect(migrateAPIKey(encryptAPIKey('sk-test', reversibleStorage), reversibleStorage)).to.equal(null)
    })

    it('returns null when encryption is unavailable', () => {
      expect(migrateAPIKey(legacyValue('sk-test'), unavailableStorage)).to.equal(null)
    })

    it('returns null when the legacy value cannot be read', () => {
      expect(migrateAPIKey('not-a-ciphertext', reversibleStorage)).to.equal(null)
    })
  })
})
