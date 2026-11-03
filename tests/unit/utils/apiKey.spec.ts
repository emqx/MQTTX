import { expect } from 'chai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY } from '@/utils/idGenerator'
import { decryptAPIKey, encryptAPIKey, migrateAPIKey } from '@/utils/apiKey'

const electron = require('electron') as any

const reversibleStorage = {
  isEncryptionAvailable: () => true,
  getSelectedStorageBackend: () => 'gnome_libsecret',
  encryptString: (plain: string) => Buffer.from(plain, 'utf8'),
  decryptString: (encrypted: Buffer) => encrypted.toString('utf8'),
}

const legacyValue = (plain: string) => CryptoJS.AES.encrypt(plain, ENCRYPT_KEY).toString()

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')

describe('apiKey', () => {
  const originalStorage = electron.safeStorage

  beforeEach(() => {
    electron.safeStorage = { ...reversibleStorage }
  })

  afterEach(() => {
    electron.safeStorage = originalStorage
    if (originalPlatform) Object.defineProperty(process, 'platform', originalPlatform)
  })

  describe('encryptAPIKey / decryptAPIKey', () => {
    it('round-trips a key through safeStorage', () => {
      const stored = encryptAPIKey('sk-test')
      expect(stored).to.match(/^safe:/)
      expect(decryptAPIKey(stored)).to.equal('sk-test')
    })

    it('keeps the empty key empty', () => {
      expect(encryptAPIKey('')).to.equal('')
      expect(decryptAPIKey('')).to.equal('')
    })

    it('decrypts a legacy CryptoJS value', () => {
      expect(decryptAPIKey(legacyValue('sk-test'))).to.equal('sk-test')
    })

    it('falls back to the legacy format when encryption is unavailable', () => {
      electron.safeStorage.isEncryptionAvailable = () => false
      const stored = encryptAPIKey('sk-test')
      expect(stored).to.not.match(/^safe:/)
      expect(decryptAPIKey(stored)).to.equal('sk-test')
    })

    it('returns an empty key for a corrupted safe value', () => {
      electron.safeStorage.decryptString = () => {
        throw new Error('cannot decrypt')
      }
      expect(decryptAPIKey(`safe:${Buffer.from('broken').toString('base64')}`)).to.equal('')
    })
  })

  describe('migrateAPIKey', () => {
    it('migrates a legacy value to a safe value', () => {
      const migrated = migrateAPIKey(legacyValue('sk-test'))
      expect(migrated).to.match(/^safe:/)
      expect(decryptAPIKey(migrated as string)).to.equal('sk-test')
    })

    it('returns null for an empty value', () => {
      expect(migrateAPIKey('')).to.equal(null)
    })

    it('returns null for an already safe value', () => {
      expect(migrateAPIKey(encryptAPIKey('sk-test'))).to.equal(null)
    })

    it('returns null when encryption is unavailable', () => {
      electron.safeStorage.isEncryptionAvailable = () => false
      expect(migrateAPIKey(legacyValue('sk-test'))).to.equal(null)
    })

    it('returns null when the legacy value cannot be read', () => {
      expect(migrateAPIKey('not-a-ciphertext')).to.equal(null)
    })
  })

  describe('Linux storage backend', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' })
    })

    it('writes the legacy format when safeStorage falls back to basic_text', () => {
      electron.safeStorage.getSelectedStorageBackend = () => 'basic_text'
      const stored = encryptAPIKey('sk-test')
      expect(stored).to.not.match(/^safe:/)
      expect(decryptAPIKey(stored)).to.equal('sk-test')
    })

    it('still writes a safe value when a real keyring is selected', () => {
      expect(encryptAPIKey('sk-test')).to.match(/^safe:/)
    })

    it('does not migrate when safeStorage falls back to basic_text', () => {
      electron.safeStorage.getSelectedStorageBackend = () => 'basic_text'
      expect(migrateAPIKey(legacyValue('sk-test'))).to.equal(null)
    })
  })
})
