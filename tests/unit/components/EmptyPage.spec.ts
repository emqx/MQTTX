import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import EmptyPage from '@/components/EmptyPage.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

const mount = (showConnectionList: boolean) => {
  const store = new Vuex.Store({
    state: { showConnectionList },
    getters: {
      currentLang: () => 'en',
      currentTheme: () => 'light',
      showConnectionList: (state) => state.showConnectionList,
    },
    mutations: {
      setShowConnectionList: (state, value: boolean) => (state.showConnectionList = value),
    },
    actions: {
      TOGGLE_SHOW_CONNECTION_LIST: ({ commit }, payload: { showConnectionList: boolean }) =>
        commit('setShowConnectionList', payload.showConnectionList),
    },
  })
  const wrapper = shallowMount(EmptyPage, {
    localVue,
    store,
    propsData: { btnTitle: 'New Connection', name: 'connections.svg', clickMethod: () => {} },
    mocks: { $t: (key: string) => key },
    stubs: { 'el-tooltip': { template: '<div><slot/></div>' } },
  })
  return { wrapper, store }
}

describe('EmptyPage.vue', () => {
  it('shows the hidden connection list again from the empty page', async () => {
    const { wrapper, store } = mount(false)
    const button = wrapper.find('.show-connections-button')
    expect(button.exists()).to.be.true
    await button.trigger('click')
    expect(store.state.showConnectionList).to.be.true
    expect(wrapper.find('.show-connections-button').exists()).to.be.false
    wrapper.destroy()
  })

  it('has no show button while the connection list is visible', () => {
    const { wrapper } = mount(true)
    expect(wrapper.find('.show-connections-button').exists()).to.be.false
    wrapper.destroy()
  })
})
