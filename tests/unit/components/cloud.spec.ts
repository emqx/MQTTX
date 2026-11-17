import { expect } from 'chai'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import type { CloudState } from '@/types/cloud'
import VueI18n from 'vue-i18n'
import { createLocalVue, mount, Wrapper } from '@vue/test-utils'
import { ipcRenderer } from 'electron'
import Cloud from '@/views/cloud/index.vue'
import Lang from '@/lang'
import { Dropdown, DropdownMenu, DropdownItem } from 'element-ui'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueI18n)
localVue.component('el-dropdown', Dropdown)
localVue.component('el-dropdown-menu', DropdownMenu)
localVue.component('el-dropdown-item', DropdownItem)
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const removed: CloudState = {
  revision: 0,
  session: { status: 'signed-out', message: null, expiresAt: null, email: null },
  removed: true,
  busy: false,
  active: null,
  candidate: null,
  error: null,
  updateError: null,
}

describe('Cloud host appearance and interaction', () => {
  let wrapper: Wrapper<Vue>
  let vm: any
  let store: Store<{ theme: Theme }>
  let i18n: VueI18n
  let colors: Record<string, string>
  let originalAsync: boolean
  const styleReader = global.getComputedStyle
  let listener: (event: unknown, state: CloudState) => void
  let calls = 0
  const on = ipcRenderer.on
  const invoke = ipcRenderer.invoke

  beforeEach(async () => {
    originalAsync = Vue.config.async
    colors = {
      '--color-text-default': '#123456',
      '--color-text-light': '#abcdef',
      '--color-bg-primary': '#101010',
      '--color-bg-normal': '#202020',
      '--color-bg-item': '#282828',
      '--color-bg-card-gradient': 'linear-gradient(#111, #222)',
      '--color-bg-btn-gradient': 'linear-gradient(#333, #444)',
      '--color-bg-skeleton': '#303030',
      '--color-bg-skeleton_transition': '#383838',
      '--color-shadow-card': '#0000001a',
      '--color-text-title': '#ffffff',
      '--color-main-green': '#34c388',
      '--color-border-default': '#383838',
      '--color-minor-red': '#f56c6c',
    }
    // The project's jsdom version does not implement CSS custom properties.
    global.getComputedStyle = (element: Element) =>
      element === document.body
        ? ({ getPropertyValue: (name: string) => colors[name] || '' } as CSSStyleDeclaration)
        : styleReader(element)
    calls = 0
    ipcRenderer.invoke = async () => {
      calls++
      return { ok: true, data: { ...removed } }
    }
    ipcRenderer.on = (channel, callback) => {
      if (channel === 'cloud:state') listener = callback
      return ipcRenderer
    }
    store = new Vuex.Store({
      state: { theme: 'light' as Theme },
      getters: { currentTheme: (state) => state.theme },
      mutations: {
        theme: (state, theme: Theme) => {
          state.theme = theme
        },
      },
    })
    i18n = new VueI18n({ locale: 'en', messages: Lang })
    wrapper = mount(Cloud, {
      localVue,
      store,
      i18n,
      sync: false,
      stubs: ['el-button', 'el-alert'],
    })
    vm = wrapper.vm
    await settle()
  })
  afterEach(() => {
    wrapper?.destroy()
    Vue.config.async = originalAsync
    ipcRenderer.invoke = invoke
    ipcRenderer.on = on
    global.getComputedStyle = styleReader
  })

  it('reads theme colors defined on the body', () => {
    expect(vm.theme().tokens).to.deep.equal({
      '--color-text-default': '#123456',
      '--color-text-light': '#abcdef',
      '--color-bg-primary': '#101010',
      '--color-bg-normal': '#202020',
      '--color-bg-item': '#282828',
      '--color-bg-card-gradient': 'linear-gradient(#111, #222)',
      '--color-bg-btn-gradient': 'linear-gradient(#333, #444)',
      '--color-bg-skeleton': '#303030',
      '--color-bg-skeleton_transition': '#383838',
      '--color-shadow-card': '#0000001a',
      '--color-text-title': '#ffffff',
      '--color-main-green': '#34c388',
      '--color-border-default': '#383838',
      '--color-minor-red': '#f56c6c',
    })
  })
  it('sends theme and language changes to ready frames', async () => {
    const messages: any[] = []
    vm.frameManager.syncTheme = () => messages.push({ data: vm.theme() })
    colors['--color-bg-primary'] = '#303030'
    store.commit('theme', 'night')
    await settle()
    expect(messages).to.have.length(1)
    expect(messages[0].data.tokens['--color-bg-primary']).to.equal('#303030')
    i18n.locale = 'ja'
    await settle()
    expect(messages).to.have.length(2)
    expect(messages[1].data.lang).to.equal('ja')
  })
  it('uses pushed snapshots, rejects stale revisions and performs no idle status polling', async () => {
    listener({}, { ...removed, revision: 2, error: { code: 'DOWNLOAD_FAILED', params: {} } })
    await settle()
    listener({}, { ...removed, revision: 1 })
    await settle()
    expect(vm.state.revision).to.equal(2)
    expect(vm.state.error.code).to.equal('DOWNLOAD_FAILED')
    const before = calls
    await new Promise((resolve) => setTimeout(resolve, 650))
    expect(calls).to.equal(before)
  })
  it('clears an overlapping login error when the pending login succeeds', async () => {
    let complete!: (response: unknown) => void
    let requests = 0
    vm.frameManager.sync = async () => {}
    ipcRenderer.invoke = () => {
      if (++requests === 1)
        return new Promise((resolve) => {
          complete = resolve
        })
      return Promise.resolve({ ok: false, error: { code: 'AUTH_PENDING', params: {} } })
    }
    const pending = vm.authenticate('login')
    await vm.authenticate('login')
    expect(vm.failure.code).to.equal('AUTH_PENDING')
    expect(wrapper.find('el-alert-stub[type="error"]').exists()).to.equal(true)
    const success = {
      ...removed,
      removed: false,
      revision: 1,
      session: { status: 'signed-in' as const, message: null, expiresAt: Date.now() + 60000, email: null },
    }
    listener({}, success)
    await settle()
    expect(vm.failure).to.equal(null)
    expect(wrapper.find('el-alert-stub[type="error"]').exists()).to.equal(false)
    complete({ ok: true, data: success })
    await pending
  })
  it('preserves current errors on stale snapshots and clears them on successful state recovery', async () => {
    ipcRenderer.invoke = async () => ({ ok: false, error: { code: 'OPERATION_FAILED', params: {} } })
    await vm.prepare('retry')
    listener({}, { ...removed })
    await settle()
    expect(vm.failure.code).to.equal('OPERATION_FAILED')
    vm.frameManager.sync = async () => {
      throw new Error('Cannot mount')
    }
    listener({}, { ...removed, revision: 1 })
    await settle()
    expect(vm.failure).not.to.equal(null)
    vm.frameManager.sync = async () => {}
    listener({}, { ...removed, revision: 2 })
    await settle()
    expect(vm.failure).to.equal(null)
  })
  it('offers explicit retry when an update fails while the active extension remains available', async () => {
    vm.frameManager.sync = async () => {}
    const state = {
      ...removed,
      removed: false,
      revision: 1,
      active: { id: 'r-12345678-1234-1234-1234-123456789abc', version: '1.0.0', url: 'https://example.com' },
      updateError: { code: 'PAGE_START_TIMEOUT', params: {} },
      session: { status: 'signed-in' as const, message: null, expiresAt: Date.now() + 60000, email: null },
    }
    listener({}, state)
    await settle()
    const retry = wrapper.find('el-alert-stub[type="info"] el-button-stub')
    expect(retry.text()).to.equal('Retry')
    let operation: string | undefined
    ipcRenderer.invoke = async (_channel, method) => {
      operation = method
      return { ok: true, data: { ...state, revision: 2, updateError: null } }
    }
    retry.vm.$emit('click')
    await settle()
    expect(operation).to.equal('retry')
  })
  it('shows an email avatar and signs out through the account dropdown', async () => {
    expect(wrapper.find('.cloud-account').exists()).to.equal(false)
    listener(
      {},
      {
        ...removed,
        removed: false,
        revision: 1,
        session: { status: 'signed-in', message: null, expiresAt: Date.now() + 60000, email: 'reader@example.com' },
      },
    )
    await settle()
    const account = wrapper.find('.cloud-actions .cloud-account')
    expect(account.find('.cloud-account-avatar').text()).to.equal('R')
    expect(account.find('.cloud-account-email').text()).to.equal('reader@example.com')
    expect(account.attributes('title')).to.equal('reader@example.com')
    expect(wrapper.find('.cloud-actions > el-button-stub[type="text"]').exists()).to.equal(false)
    expect(wrapper.find(DropdownMenu).isVisible()).to.equal(false)
    await account.trigger('click')
    await settle()
    expect(wrapper.find(DropdownMenu).isVisible()).to.equal(true)
    let operation: string | undefined
    ipcRenderer.invoke = async (_channel, method) => {
      operation = method
      return { ok: true, data: { ...removed, revision: 2 } }
    }
    const logout = wrapper.find(DropdownItem)
    expect(logout.text()).to.equal('Sign out')
    await logout.trigger('click')
    await settle()
    expect(operation).to.equal('logout')
    expect(wrapper.find('.cloud-account-menu').exists()).to.equal(false)
  })
  it('keeps the account menu available when an existing session has no email', async () => {
    listener(
      {},
      {
        ...removed,
        removed: false,
        revision: 1,
        session: { status: 'signed-in', message: null, expiresAt: Date.now() + 60000, email: null },
      },
    )
    await settle()
    const account = wrapper.find('.cloud-account')
    expect(account.attributes('aria-label')).to.equal('Account menu')
    expect(account.find('.el-icon-user').exists()).to.equal(true)
    expect(account.find('.cloud-account-email').exists()).to.equal(false)
    await account.trigger('click')
    await settle()
    expect(wrapper.find(DropdownItem).text()).to.equal('Sign out')
  })
  it('owns login and cancellation UI without loading an extension while signed out', async () => {
    listener({}, { ...removed, removed: false, revision: 1 })
    await settle()
    expect(wrapper.find('.cloud-login').exists()).to.equal(true)
    expect(wrapper.find('.cloud-login-site').exists()).to.equal(false)
    expect(wrapper.find('.cloud-site-dialog').exists()).to.equal(false)
    expect(wrapper.find('iframe').exists()).to.equal(false)
    const operations: Array<{ method: string; args: unknown }> = []
    ipcRenderer.invoke = async (_channel, method, args) => {
      operations.push({ method, args })
      return {
        ok: true,
        data: {
          ...removed,
          removed: false,
          revision: 2,
          session: { status: 'authorizing', message: null, expiresAt: null, email: null },
        },
      }
    }
    await vm.authenticate('login')
    expect(operations[0]).to.deep.equal({ method: 'login', args: { locale: 'en' } })
    expect(wrapper.find('.cloud-login h2').text()).to.equal('Complete browser authorization')
    ipcRenderer.invoke = async (_channel, method, args) => {
      operations.push({ method, args })
      return { ok: true, data: { ...removed, removed: false, revision: 3 } }
    }
    await vm.authenticate('cancel')
    expect(operations[1].method).to.equal('cancel')
    expect(wrapper.find('.cloud-login h2').text()).to.equal('Connect your EMQX Cloud')
  })
})
