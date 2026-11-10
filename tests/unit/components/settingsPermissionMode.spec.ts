import { expect } from 'chai'
import { isAutoConfirmedInSession, PERMISSION_MODE_CONFIRMED_KEY } from '@/utils/ai/agent/permissionMode'

// The settings view imports the code editor, and Monaco reads this DOM API while it loads in jsdom
if (typeof document !== 'undefined' && typeof document.queryCommandSupported !== 'function') {
  ;(document as any).queryCommandSupported = () => false
}
// jsdom exposes storage on window only, while the renderer reads it as a global
;(global as any).sessionStorage = window.sessionStorage
const Settings = require('@/views/settings/index.vue').default

/**
 * Mounting the settings view would build every settings section and its Electron and Vuex dependencies,
 * so the change handler is called directly with a stubbed confirm dialog, like other component specs do.
 */
const changePermissionMode = (context: any, mode: 'ask' | 'auto') =>
  (Settings as any).options.methods.handlePermissionModeChange.call(context, mode)

const makeContext = (confirm: (...args: any[]) => Promise<unknown>) => {
  const saved: any[] = []
  return {
    saved,
    context: {
      $t: (key: string) => key,
      $confirm: confirm,
      actionSetAgentPermissionMode: (payload: any) => saved.push(payload),
    },
  }
}

describe('Settings permission mode', () => {
  beforeEach(() => sessionStorage.clear())

  it('should confirm the risk before saving auto', async () => {
    const calls: any[][] = []
    const { context, saved } = makeContext((...args) => {
      calls.push(args)
      return Promise.resolve()
    })

    await changePermissionMode(context, 'auto')

    expect(calls).to.have.length(1)
    expect(saved).to.deep.equal([{ agentPermissionMode: 'auto' }])
    expect(isAutoConfirmedInSession()).to.equal(true)
  })

  it('should keep the current mode when the confirmation is cancelled', async () => {
    const { context, saved } = makeContext(() => Promise.reject(new Error('cancel')))

    await changePermissionMode(context, 'auto')

    expect(saved).to.deep.equal([])
    expect(isAutoConfirmedInSession()).to.equal(false)
  })

  it('should save ask without asking for confirmation', async () => {
    const { context, saved } = makeContext(() => {
      throw new Error('ask must not prompt')
    })

    await changePermissionMode(context, 'ask')

    expect(saved).to.deep.equal([{ agentPermissionMode: 'ask' }])
  })

  it('should not ask again after auto was confirmed in this session', async () => {
    const { context, saved } = makeContext(() => {
      throw new Error('auto was already confirmed')
    })
    sessionStorage.setItem(PERMISSION_MODE_CONFIRMED_KEY, 'true')

    await changePermissionMode(context, 'auto')

    expect(saved).to.deep.equal([{ agentPermissionMode: 'auto' }])
  })
})
