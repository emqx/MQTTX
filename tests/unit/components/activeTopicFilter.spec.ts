import '../mocks/browserStorage'
import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import ElementUI from 'element-ui'
import VueClipboard from 'vue-clipboard2'
import SubscriptionsList from '@/components/SubscriptionsList.vue'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(ElementUI)
localVue.use(VueClipboard)
const sub = (topic: string) => ({ topic, qos: 0, color: '#34c388', createAt: '2026', disabled: false })
const a = sub('a/#'),
  b = sub('b/#')
const popover = { template: '<div><slot/><slot name="reference"/></div>' }

// Skip broker lifecycle hooks; render and events use the production component options.
const options = { ...(SubscriptionsList as any).options, mounted: [], created: [], beforeDestroy: [], watch: {} }
const mount = (activeTopic = '') =>
  shallowMount(options, {
    localVue,
    propsData: { connectionId: 'test', record: { subscriptions: [a, b], mqttVersion: '5.0' }, activeTopic },
    store: new Vuex.Store({
      getters: {
        multiTopics: () => false,
        topicWhitespaceDetection: () => false,
        autoResub: () => true,
        currentTheme: () => 'light',
        activeConnection: () => ({}),
        showConnectionList: () => true,
      },
    }),
    mocks: { $t: (key: string) => key, $tc: (key: string) => key },
    stubs: { 'el-popover': popover },
  })

describe('Subscription filter state', () => {
  it('renders the selected topic and clears its highlight when the parent clears', async () => {
    const wrapper = mount('a/#')
    await wrapper.setData({ subsList: [a, b] })
    expect(wrapper.findAll('.topics-item.active').length).to.equal(1)
    await wrapper.setProps({ activeTopic: '' })
    expect(wrapper.find('.topics-item.active').exists()).to.be.false
    wrapper.destroy()
  })

  it('keeps the selected topic highlighted when earlier subscriptions are removed', async () => {
    const wrapper = mount('b/#')
    await wrapper.setData({ subsList: [a, b] })
    await wrapper.setData({ subsList: [b] })
    expect(wrapper.find('.topics-item.active').text()).to.include('b/#')
    wrapper.destroy()
  })

  it('clicking a row selects or toggles the current filter', async () => {
    const wrapper = mount()
    await wrapper.setData({ subsList: [a, b] })
    await wrapper.find('.topics-item').trigger('click')
    expect(wrapper.emitted('onClickTopic')![0]).to.deep.equal([a, false])
    await wrapper.setProps({ activeTopic: a.topic })
    await wrapper.find('.topics-item').trigger('click')
    expect(wrapper.emitted('onClickTopic')![1]).to.deep.equal([a, true])
    wrapper.destroy()
  })

  it('clicking topic text keeps the clipboard action and does not filter', async () => {
    const wrapper = mount()
    await wrapper.setData({ subsList: [a, b] })
    await wrapper.find('.topic').trigger('click')
    expect(wrapper.emitted('onClickTopic')).to.be.undefined
    wrapper.destroy()
  })
})
