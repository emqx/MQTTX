import { expect } from 'chai'
import { shallowMount, Wrapper } from '@vue/test-utils'
import ResizeHeight from '@/components/ResizeHeight.vue'
import { Vue } from 'vue-property-decorator'

describe('ResizeHeight.vue', () => {
  let wrapper: Wrapper<Vue>

  beforeEach(() => {
    wrapper = shallowMount(ResizeHeight, {
      propsData: {
        value: 100,
      },
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.find('.resize-height').exists()).to.be.true
  })

  it('emits change event on mousedown and mousemove', async () => {
    const vm = wrapper.vm as any

    // Call handleMousedown directly
    vm.handleMousedown({ y: 100 } as MouseEvent)

    // Simulate mousemove
    const mousemoveEvent = { y: 150 } as MouseEvent
    document.onmousemove!(mousemoveEvent)

    await Vue.nextTick()

    expect(wrapper.emitted('change')).to.exist
    const emittedValue = wrapper.emitted('change')![0][0]
    expect(typeof emittedValue).to.equal('number')
    expect(emittedValue).to.equal(50)
  })

  it('adds select-none class to body on mousemove', async () => {
    const vm = wrapper.vm as any
    vm.handleMousedown({ y: 100 } as MouseEvent)

    const mousemoveEvent = { y: 150 } as MouseEvent
    document.onmousemove!(mousemoveEvent)

    await Vue.nextTick()

    expect(document.body.classList.contains('select-none')).to.be.true
  })

  it('removes select-none class from body on mouseup', async () => {
    document.body.classList.add('select-none')

    const mouseupEvent = new MouseEvent('mouseup')
    document.dispatchEvent(mouseupEvent)

    await Vue.nextTick()

    expect(document.body.classList.contains('select-none')).to.be.false
  })

  it('removes mousemove event listener on mouseup', async () => {
    const vm = wrapper.vm as any
    vm.handleMousedown({ y: 100 } as MouseEvent)

    const mouseupEvent = new MouseEvent('mouseup')
    document.dispatchEvent(mouseupEvent)

    await Vue.nextTick()

    expect(document.onmousemove).to.be.null
  })
})
