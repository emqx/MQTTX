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

/** Anchor path; jsdom has no layout, so menu size and viewport are stubbed. */
describe('Contextmenu.vue anchor placement', () => {
  const MENU_WIDTH = 120
  const MENU_HEIGHT = 80
  const VIEWPORT_WIDTH = 1000
  const VIEWPORT_HEIGHT = 800

  const originalWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')
  const originalHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight')

  let wrapper: Wrapper<Vue> | undefined

  const anchorAt = (left: number, top: number): DOMRect =>
    ({ left, top, right: left + 24, bottom: top + 24, width: 24, height: 24, x: left, y: top } as DOMRect)

  const mountWith = (props: { visible?: boolean; top?: number; left?: number; anchor?: DOMRect | null }) => {
    wrapper = shallowMount(Contextmenu, {
      propsData: { visible: true, top: 0, left: 0, ...props },
      stubs: ['el-card'],
    })
    const menu = wrapper.find('.contextmenu').element as HTMLElement
    Object.defineProperty(menu, 'offsetWidth', { configurable: true, value: MENU_WIDTH })
    Object.defineProperty(menu, 'offsetHeight', { configurable: true, value: MENU_HEIGHT })
    return wrapper
  }

  const style = () => (wrapper as Wrapper<Vue>).find('.contextmenu').attributes('style') || ''

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: VIEWPORT_WIDTH })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT_HEIGHT })
  })

  afterEach(() => {
    wrapper?.destroy()
    wrapper = undefined
    if (originalWidth) Object.defineProperty(window, 'innerWidth', originalWidth)
    if (originalHeight) Object.defineProperty(window, 'innerHeight', originalHeight)
  })

  it('puts the right edge on the button and hangs 4px under it', async () => {
    mountWith({ anchor: anchorAt(200, 100) })
    await Vue.nextTick()
    await Vue.nextTick()

    expect(style()).to.include('left: 104px')
    expect(style()).to.include('top: 128px')
  })

  it('clamps the menu inside the viewport edges', async () => {
    mountWith({ anchor: anchorAt(1016, 766) })
    await Vue.nextTick()
    await Vue.nextTick()

    expect(style()).to.include('left: 880px')
    expect(style()).to.include('top: 720px')
  })

  it('keeps the top/left props without an anchor and returns to them when it is cleared', async () => {
    mountWith({ top: 10, left: 20, anchor: null })
    await Vue.nextTick()
    expect(style()).to.include('left: 20px')
    expect(style()).to.include('top: 10px')

    await wrapper!.setProps({ anchor: anchorAt(200, 100) })
    await Vue.nextTick()
    await Vue.nextTick()
    expect(style()).to.include('left: 104px')
    expect(style()).to.include('top: 128px')

    await wrapper!.setProps({ anchor: null })
    await Vue.nextTick()
    expect(style()).to.include('left: 20px')
    expect(style()).to.include('top: 10px')
  })
})
