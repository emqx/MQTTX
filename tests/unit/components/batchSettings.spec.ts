import '../mocks/browserStorage'
import { expect } from 'chai'
import VueI18n from 'vue-i18n'
import { createLocalVue } from '@vue/test-utils'
import messages from '@/lang'
import app from '@/store/modules/app'

if (typeof document.queryCommandSupported !== 'function') (document as any).queryCommandSupported = () => false
const Settings = require('@/views/settings/index.vue').default
// Test the startup hook without bundling the app's global styles.
const App = require('@/App.vue?vue&type=script&lang=ts').default
const Store = require('electron-store')
const methods = Settings.options.methods
createLocalVue().use(VueI18n)
const i18n = new VueI18n({ locale: 'en', messages: messages })
const translate = (key: string, values = {}) => String(i18n.t(key, values))
const context = () => {
  const saved: any[] = []
  const prompts: string[] = []
  const warnings: string[] = []
  return {
    saved,
    prompts,
    warnings,
    ctx: {
      batchStorageMode: 'full',
      $t: translate,
      $tc: (key: string) => key,
      $message: { warning: (message: string) => warnings.push(message) },
      $confirm: (message: string) => {
        prompts.push(message)
        return Promise.resolve()
      },
      actionBatchStorageMode: (value: unknown) => saved.push(value),
      actionBatchMaxItems: (value: unknown) => saved.push(value),
      actionBatchMaxBytes: (value: unknown) => saved.push(value),
    },
  }
}

describe('Batch settings notices', () => {
  it('saves the Batch publishing switch', () => {
    const state = { ...app.state, allConnections: [] }
    const writes: unknown[][] = []
    const originalSet = Store.prototype.set
    Store.prototype.set = (...args: unknown[]) => writes.push(args)
    try {
      const ctx = {
        actionBatchPublishEnabled: (payload: App) =>
          app.actions.SET_BATCH_PUBLISH_ENABLED(
            {
              commit: (name: 'SET_BATCH_PUBLISH_ENABLED', value: boolean) => app.mutations[name](state, value),
            },
            payload,
          ),
      }
      for (const enabled of [true, false]) {
        methods.handleBatchPublishEnabledChange.call(ctx, enabled)
        expect(state.batchPublishEnabled).to.equal(enabled)
      }
      expect(writes).to.deep.equal([
        ['settings.batchPublishEnabled', true],
        ['settings.batchPublishEnabled', false],
      ])
    } finally {
      Store.prototype.set = originalSet
    }
  })

  it('confirms summary limits before changing storage mode', async () => {
    const { ctx, saved, prompts } = context()
    await methods.handleBatchStorageModeChange.call(ctx, 'summary')
    expect(prompts).to.deep.equal([
      'A summary keeps the first 20 items, up to the first 32 B each. Full data cannot be recovered.',
    ])
    expect(saved).to.deep.equal([{ batchStorageMode: 'summary' }])
  })

  it('does not change storage mode when summary confirmation is canceled', async () => {
    const { ctx, saved } = context()
    ctx.$confirm = () => Promise.reject('cancel')
    await methods.handleBatchStorageModeChange.call(ctx, 'summary')
    expect(saved).to.deep.equal([])
  })

  it('warns when a typed Batch limit is clamped', () => {
    const { ctx, warnings } = context()
    methods.handleBatchLimitInput.call(ctx, { target: { value: '70000' } }, 'items')
    expect(warnings).to.deep.equal(['Batch limit adjusted to 65535'])
  })

  it('warns when fractional or missing limits are rejected', () => {
    const { ctx, warnings, saved } = context()
    methods.handleBatchLimitChange.call(ctx, 1.5, 'items')
    methods.handleBatchLimitChange.call(ctx, undefined, 'bytes')
    expect(warnings).to.deep.equal([
      'Batch setting is invalid, so it was not saved',
      'Batch setting is invalid, so it was not saved',
    ])
    expect(saved).to.deep.equal([])
  })

  it('warns at startup when a saved Batch setting is adjusted', () => {
    const originalGet = Store.prototype.get
    const { warnings, ctx } = context()
    Store.prototype.get = (key: string) => (key === 'settings.batchMaxItems' ? 0 : undefined)
    try {
      App.options.created[0].call({
        ...ctx,
        $log: { info: () => undefined },
        $store: { getters: { batchStorageMode: 'full', batchMaxItems: 1, batchMaxBytes: 65536 } },
      })
      expect(warnings).to.deep.equal(['Invalid Batch settings adjusted: Batch max items'])
    } finally {
      Store.prototype.get = originalGet
    }
  })
})
