import { expect } from 'chai'
import CryptoJS from 'crypto-js'
import { ENCRYPT_KEY } from '@/utils/idGenerator'
import { decryptAPIKey } from '@/utils/apiKey'
import type { SafeStorageLike } from '@/utils/apiKey'

// jsdom lacks an API Monaco calls while registering its clipboard contribution
;(document as any).queryCommandSupported = () => false
// Required lazily so the Monaco polyfill above runs first
const Settings = require('@/views/settings/index.vue').default

const methods = (Settings as any).options.methods
// The component reaches the mock through @electron/remote, whose fake is a UTF-8 buffer round trip
const storage: SafeStorageLike = {
  isEncryptionAvailable: () => true,
  encryptString: (plain: string) => Buffer.from(plain, 'utf8'),
  decryptString: (encrypted: Buffer) => encrypted.toString('utf8'),
}

const legacyStoredKey = (plain: string) => CryptoJS.AES.encrypt(plain, ENCRYPT_KEY).toString()

const context = (storedKey: string) => {
  const saved: Array<{ openAIAPIKey: string }> = []
  return {
    saved,
    ctx: {
      aiConfig: {
        model: 'gpt-4o',
        openAIAPIKey: '',
        openAIAPIHost: 'https://api.openai.com/v1',
      },
      openAIAPIKey: storedKey,
      model: 'gpt-4o',
      openAIAPIHost: 'https://api.openai.com/v1',
      actionSetOpenAIAPIKey: (payload: { openAIAPIKey: string }) => saved.push(payload),
    },
  }
}

describe('Settings AI API key', () => {
  it('shows the stored key as plaintext in the input', () => {
    const { ctx } = context(legacyStoredKey('sk-old'))
    methods.getAIConfigs.call(ctx)
    expect(ctx.aiConfig.openAIAPIKey).to.equal('sk-old')
  })

  it('saves nothing when the key field is blurred unchanged', () => {
    const { ctx, saved } = context(legacyStoredKey('sk-old'))
    methods.getAIConfigs.call(ctx)
    methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.deep.equal([])
  })

  it('saves a changed key in a form that decrypts back to it', () => {
    const { ctx, saved } = context(legacyStoredKey('sk-old'))
    methods.getAIConfigs.call(ctx)
    ctx.aiConfig.openAIAPIKey = 'sk-new'
    methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.have.lengthOf(1)
    expect(saved[0].openAIAPIKey).to.match(/^safe:/)
    expect(decryptAPIKey(saved[0].openAIAPIKey, storage)).to.equal('sk-new')
  })

  it('clears the stored key when the input is emptied', () => {
    const { ctx, saved } = context(legacyStoredKey('sk-old'))
    methods.getAIConfigs.call(ctx)
    ctx.aiConfig.openAIAPIKey = ''
    methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.deep.equal([{ openAIAPIKey: '' }])
  })
})
