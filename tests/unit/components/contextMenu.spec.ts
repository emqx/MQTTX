import { expect } from 'chai'
import { shallowMount, Wrapper } from '@vue/test-utils'
import Contextmenu from '@/components/Contextmenu.vue'
import { Vue } from 'vue-property-decorator'

describe('Contextmenu.vue', () => {
  let wrapper: Wrapper<Vue>

  beforeEach(() => {
    wrapper = shallowMount(Contextmenu, {
      propsData: {
        top: 100,
        left: 200,
        visible: true,
      },
      stubs: ['el-card'],
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders when visible', () => {
    expect(wrapper.find('.contextmenu').exists()).to.be.true
  })

  it('does not render when not visible', async () => {
    await wrapper.setProps({ visible: false })
    expect(wrapper.find('.contextmenu').exists()).to.be.false
  })

  it('positions correctly based on props', () => {
    const card = wrapper.find('.contextmenu')
    expect(card.attributes('style')).to.include('top: 100px')
    expect(card.attributes('style')).to.include('left: 200px')
  })

  it('emits update:visible event when clicked outside', async () => {
    const vm = wrapper.vm as any
    vm.handleClickoutside()
    await Vue.nextTick()
    expect(wrapper.emitted('update:visible')).to.deep.equal([[false]])
  })

  it('does not emit update:visible event when not visible', async () => {
    await wrapper.setProps({ visible: false })
    const vm = wrapper.vm as any
    vm.handleClickoutside()
    await Vue.nextTick()
    expect(wrapper.emitted('update:visible')).to.be.undefined
  })
})
