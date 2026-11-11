import '../mocks/browserStorage'
import { expect } from 'chai'
import settings from '@/lang/settings'

if (typeof document.queryCommandSupported !== 'function') (document as any).queryCommandSupported = () => false
const Settings = require('@/views/settings/index.vue').default
// Test the startup hook without bundling the app's global styles.
const App = require('@/App.vue?vue&type=script&lang=ts').default
const Store = require('electron-store')
const methods = Settings.options.methods
const translate = (key: string, values: Record<string, string> = {}) => {
  const message = settings[key.replace('settings.', '') as keyof typeof settings]?.en || key
  return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name]))
}
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
  it('confirms the item and byte truncation before enabling summary storage', async () => {
    const { ctx, saved, prompts } = context()
    await methods.handleBatchStorageModeChange.call(ctx, 'summary')
    expect(prompts).to.deep.equal([
      'Summary saves the first 20 items, up to 32 B each; full data cannot be recovered. Continue?',
    ])
    expect(saved).to.deep.equal([{ batchStorageMode: 'summary' }])
  })

  it('does not change storage mode when summary confirmation is canceled', async () => {
    const { ctx, saved } = context()
    ctx.$confirm = () => Promise.reject('cancel')
    await methods.handleBatchStorageModeChange.call(ctx, 'summary')
    expect(saved).to.deep.equal([])
  })

  it('notifies when an input-number will clamp a typed batch limit', () => {
    const { ctx, warnings } = context()
    methods.handleBatchLimitInput.call(ctx, { target: { value: '70000' } }, 'items')
    expect(warnings).to.deep.equal(['Batch limit adjusted to 65535'])
  })

  it('reports rejected fractional or missing limits instead of silently discarding them', () => {
    const { ctx, warnings, saved } = context()
    methods.handleBatchMaxItemsChange.call(ctx, 1.5)
    methods.handleBatchMaxBytesChange.call(ctx, undefined)
    expect(warnings).to.deep.equal(['Invalid Batch setting; not saved', 'Invalid Batch setting; not saved'])
    expect(saved).to.deep.equal([])
  })

  it('notifies at startup about normalized saved settings but not missing defaults', () => {
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
