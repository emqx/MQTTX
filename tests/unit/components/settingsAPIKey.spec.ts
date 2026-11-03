import { expect } from 'chai'
import { ipcRenderer } from 'electron'

// jsdom lacks an API Monaco calls while registering its clipboard contribution
;(document as any).queryCommandSupported = () => false
// Required lazily so the Monaco polyfill above runs first
const Settings = require('@/views/settings/index.vue').default

const methods = (Settings as any).options.methods

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
  const originalInvoke = ipcRenderer.invoke
  const requests: Array<[string, string]> = []

  beforeEach(() => {
    requests.length = 0
    ;(ipcRenderer as any).invoke = async (channel: string, value: string) => {
      requests.push([channel, value])
      if (channel === 'apiKey:decrypt') return 'sk-old'
      if (channel === 'apiKey:encrypt') return value ? 'encrypted-key' : ''
      throw new Error(`Unexpected IPC channel: ${channel}`)
    }
  })

  afterEach(() => {
    ;(ipcRenderer as any).invoke = originalInvoke
  })

  it('shows plaintext without saving or decrypting again on an unchanged blur', async () => {
    const { ctx, saved } = context('stored-key')
    await methods.getAIConfigs.call(ctx)
    expect(ctx.aiConfig.openAIAPIKey).to.equal('sk-old')
    await methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.deep.equal([])
    expect(requests).to.deep.equal([['apiKey:decrypt', 'stored-key']])
  })

  it('saves the encrypted result for a changed key', async () => {
    const { ctx, saved } = context('stored-key')
    await methods.getAIConfigs.call(ctx)
    ctx.aiConfig.openAIAPIKey = 'sk-new'
    await methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.deep.equal([{ openAIAPIKey: 'encrypted-key' }])
    expect(requests).to.deep.equal([
      ['apiKey:decrypt', 'stored-key'],
      ['apiKey:encrypt', 'sk-new'],
    ])
  })

  it('clears the stored key when the input is emptied', async () => {
    const { ctx, saved } = context('stored-key')
    await methods.getAIConfigs.call(ctx)
    ctx.aiConfig.openAIAPIKey = ''
    await methods.handleAIConfigChanged.call(ctx, 'apiKey')
    expect(saved).to.deep.equal([{ openAIAPIKey: '' }])
    expect(requests).to.deep.equal([
      ['apiKey:decrypt', 'stored-key'],
      ['apiKey:encrypt', ''],
    ])
  })
})
