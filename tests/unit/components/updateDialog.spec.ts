import { expect } from 'chai'
import axios from 'axios'
import { Dialog } from 'element-ui'
import { Container } from 'typedi'
import { createLocalVue, mount } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import Vuex from 'vuex'
import Lang from '@/lang'
import Update from '@/views/update/index.vue'

describe('Desktop update dialog', () => {
  it('shows the available version in the title when the release notes omit it', async () => {
    const localVue = createLocalVue()
    localVue.use(VueI18n)
    localVue.use(Vuex)
    localVue.use(Dialog)

    const adapter = axios.defaults.adapter
    const getService = Container.get
    const domParser = globalThis.DOMParser
    const version = 'v99.0.0'
    globalThis.DOMParser = window.DOMParser
    axios.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { data: config.url?.includes('all_version') ? [version] : { changelog: '<h1>Release Note 🎉</h1>' } },
    })
    Container.get = () => ({ set: async () => {}, get: async () => undefined })

    try {
      const wrapper = mount(Update, {
        localVue,
        i18n: new VueI18n({ locale: 'zh', messages: Lang }),
        store: new Vuex.Store({ getters: { autoCheck: () => true } }),
        stubs: { 'el-button': true, 'el-progress': true },
      })
      try {
        await new Promise((resolve) => setTimeout(resolve, 0))
        const dialog = document.querySelector('.update-dialog')!
        expect(dialog.querySelector('.text-content h1')?.textContent).to.equal('Release Note 🎉')
        expect(dialog.querySelector('.el-dialog__title')?.textContent).to.equal(`有可用更新 ${version}`)
      } finally {
        wrapper.destroy()
      }
    } finally {
      axios.defaults.adapter = adapter
      Container.get = getService
      globalThis.DOMParser = domParser
    }
  })
})
