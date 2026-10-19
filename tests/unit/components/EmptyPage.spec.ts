import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import EmptyPage from '@/components/EmptyPage.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

const mount = (showConnectionList: boolean, clickMethod: (value: boolean) => void = () => {}) => {
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
    propsData: { btnTitle: 'New Connection', clickMethod },
    mocks: { $t: (key: string) => key },
    stubs: { 'el-tooltip': { template: '<div><slot/></div>' }, ImportData: true },
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

  it('creates a connection from the first card', async () => {
    const calls: boolean[] = []
    const { wrapper } = mount(true, (value: boolean) => calls.push(value))
    await wrapper.find('[data-test="new-connection"]').trigger('click')
    expect(calls).to.deep.equal([false])
    wrapper.destroy()
  })

  it('asks the parent to connect to the public broker from the second card', async () => {
    const { wrapper } = mount(true)
    await wrapper.find('[data-test="public-broker"]').trigger('click')
    expect(wrapper.emitted('quick-connect')).to.have.lengthOf(1)
    wrapper.destroy()
  })

  it('opens the import data dialog from the third card', async () => {
    const { wrapper } = mount(true)
    expect(wrapper.vm.$data.showImportData).to.be.false
    await wrapper.find('[data-test="import-data"]').trigger('click')
    expect(wrapper.vm.$data.showImportData).to.be.true
    wrapper.destroy()
  })

  it('renders the logo with decorative orbits only', () => {
    const { wrapper } = mount(true)
    expect(wrapper.find('.empty-page__hero .empty-page__logo').exists()).to.be.true
    expect(wrapper.findAll('svg').length).to.equal(1)
    expect(wrapper.find('svg.empty-page__orbits').attributes('aria-hidden')).to.equal('true')
    wrapper.destroy()
  })
})
