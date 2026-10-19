import '../mocks/browserStorage'
import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import EmptyPage from '@/components/EmptyPage.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

const mount = (clickMethod: (value: boolean) => void = () => {}) => {
  const store = new Vuex.Store({
    getters: {
      currentLang: () => 'en',
    },
  })
  const wrapper = shallowMount(EmptyPage, {
    localVue,
    store,
    propsData: { btnTitle: 'New Connection', clickMethod },
    mocks: { $t: (key: string) => key },
    stubs: { ImportData: true },
  })
  return { wrapper, store }
}

describe('EmptyPage.vue', () => {
  it('creates a connection from the first card', async () => {
    const calls: boolean[] = []
    const { wrapper } = mount((value: boolean) => calls.push(value))
    await wrapper.find('[data-test="new-connection"]').trigger('click')
    expect(calls).to.deep.equal([false])
    wrapper.destroy()
  })

  it('asks the parent to connect to the public broker from the second card', async () => {
    const { wrapper } = mount()
    await wrapper.find('[data-test="public-broker"]').trigger('click')
    expect(wrapper.emitted('quick-connect')).to.have.lengthOf(1)
    wrapper.destroy()
  })

  it('opens the import data dialog from the third card', async () => {
    const { wrapper } = mount()
    expect(wrapper.vm.$data.showImportData).to.be.false
    await wrapper.find('[data-test="import-data"]').trigger('click')
    expect(wrapper.vm.$data.showImportData).to.be.true
    wrapper.destroy()
  })

  it('renders the logo with decorative orbits only', () => {
    const { wrapper } = mount()
    expect(wrapper.find('.empty-page__hero .empty-page__logo').exists()).to.be.true
    expect(wrapper.findAll('svg').length).to.equal(1)
    expect(wrapper.find('svg.empty-page__orbits').attributes('aria-hidden')).to.equal('true')
    wrapper.destroy()
  })
})
