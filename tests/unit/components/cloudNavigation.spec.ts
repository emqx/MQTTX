import '../mocks/browserStorage'
import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import { createLocalVue, mount, Wrapper } from '@vue/test-utils'
import { ipcRenderer } from 'electron'
import type { CloudState } from '@/types/cloud'
import Home from '@/views/Home.vue'
import Cloud from '@/views/cloud/index.vue'
import CloudRoute from '@/views/cloud/Route.vue'
import Lang from '@/lang'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)
localVue.use(VueI18n)
const RoutedHome = localVue.extend({ extends: Home, components: { Cloud: localVue.extend({ extends: Cloud }) } })
const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Vue.nextTick()
}
const release = { id: 'r-12345678-1234-1234-1234-123456789abc', version: '1.0.0', url: 'about:blank' }
const signedIn: CloudState = {
  revision: 1,
  removed: false,
  busy: false,
  active: release,
  candidate: null,
  error: null,
  updateError: null,
  session: { status: 'signed-in', message: null, expiresAt: Date.now() + 3600000, email: 'reader@example.com' },
}

describe('Cloud navigation persistence', () => {
  const invoke = ipcRenderer.invoke
  const on = ipcRenderer.on
  // jsdom has no canvas; navigation tests do not need the sign-in animation.
  const contextReader = HTMLCanvasElement.prototype.getContext
  let wrapper: Wrapper<Vue>
  let router: VueRouter
  let listener: (event: unknown, state: CloudState) => void
  let calls: string[]
  let originalAsync: boolean
  let bodyClass: string

  beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = () => null
    originalAsync = Vue.config.async
    bodyClass = document.body.className
    calls = []
    ipcRenderer.invoke = async (_channel, method) => {
      calls.push(method)
      return { ok: true, data: signedIn }
    }
    ipcRenderer.on = (channel, callback) => {
      if (channel === 'cloud:state') listener = callback
      return ipcRenderer
    }
    router = new VueRouter({
      mode: 'abstract',
      routes: [
        {
          path: '/',
          component: RoutedHome,
          children: [
            { path: '/cloud', name: 'Cloud', component: CloudRoute },
            {
              path: '/recent_connections/0',
              name: 'ConnectionDetails',
              component: localVue.extend({ render: (h) => h('input', { class: 'connection-draft' }) }),
            },
          ],
        },
      ],
    })
    await router.push('/recent_connections/0')
    wrapper = mount(localVue.extend({ template: '<router-view />' }), {
      localVue,
      router,
      store: new Vuex.Store({
        getters: {
          currentTheme: () => 'light',
          currentLang: () => 'en',
          syncOsTheme: () => false,
          connectDatabaseFailMessage: () => '',
          enableAgent: () => false,
        },
        actions: { TOGGLE_THEME() {}, TOGGLE_LANG() {} },
      }),
      i18n: new VueI18n({ locale: 'en', messages: Lang }),
      attachToDocument: true,
      stubs: {
        Leftbar: true,
        Ipc: true,
        Update: true,
        AgentPanel: true,
        DatabaseError: true,
        'el-button': true,
        'el-alert': true,
        'el-dropdown': true,
        'el-dropdown-menu': true,
        'el-dropdown-item': true,
      },
    })
    await settle()
  })
  afterEach(() => {
    wrapper?.destroy()
    ipcRenderer.invoke = invoke
    ipcRenderer.on = on
    HTMLCanvasElement.prototype.getContext = contextReader
    Vue.config.async = originalAsync
    document.body.className = bodyClass
  })

  it('loads Cloud lazily and keeps the same attached iframe when opening a connection and returning', async () => {
    expect(wrapper.find('.cloud-view').exists()).to.equal(false)
    expect(calls).not.to.include('enter')
    await router.push('/cloud')
    await settle()
    expect(wrapper.findAll('.cloud-view').length).to.equal(1)
    expect(wrapper.find('.cloud-route').exists()).to.equal(true)
    const frame = wrapper.find('iframe').element
    const window = (frame as HTMLIFrameElement).contentWindow
    expect(document.body.contains(frame)).to.equal(true)
    await router.push('/recent_connections/0')
    await settle()
    expect(wrapper.find('.connection-draft').isVisible()).to.equal(true)
    expect(wrapper.find('.cloud-view').isVisible()).to.equal(false)
    expect(document.body.contains(frame)).to.equal(true)
    expect(wrapper.find('iframe').element).to.equal(frame)
    expect(calls).not.to.include('leave')
    expect(calls).not.to.include('unmount')
    await router.push('/cloud')
    await settle()
    expect(wrapper.find('.cloud-view').isVisible()).to.equal(true)
    expect(wrapper.find('iframe').element).to.equal(frame)
    expect((frame as HTMLIFrameElement).contentWindow).to.equal(window)
    expect(calls.filter((method) => method === 'enter')).to.have.length(1)
    expect(calls.filter((method) => method === 'mounting')).to.have.length(1)
    wrapper.destroy()
    expect(calls).to.include('leave')
    expect(calls).to.include('unmount')
    expect(document.body.contains(frame)).to.equal(false)
  })

  for (const cause of ['logout', 'expiry', 'removal']) {
    it(`destroys the hidden plugin on ${cause} and starts a fresh iframe after signing in again`, async () => {
      await router.push('/cloud')
      await settle()
      const frame = wrapper.find('iframe').element
      await router.push('/recent_connections/0')
      await settle()
      expect(wrapper.find('iframe').element).to.equal(frame)
      listener(
        {},
        {
          ...signedIn,
          revision: 2,
          removed: cause === 'removal',
          active: cause === 'removal' ? null : release,
          session: {
            status: cause === 'expiry' ? 'expired' : 'signed-out',
            message: cause === 'expiry' ? { code: 'AUTH_EXPIRED', params: {} } : null,
            expiresAt: null,
            email: null,
          },
        },
      )
      await settle()
      expect(wrapper.find('iframe').exists()).to.equal(false)
      expect(document.body.contains(frame)).to.equal(false)
      expect(calls).to.include('unmount')
      expect(wrapper.find('.connection-draft').isVisible()).to.equal(true)
      await router.push('/cloud')
      await settle()
      expect(wrapper.find('iframe').exists()).to.equal(false)
      listener({}, { ...signedIn, revision: 3 })
      await settle()
      expect(wrapper.find('iframe').element).not.to.equal(frame)
    })
  }
})
