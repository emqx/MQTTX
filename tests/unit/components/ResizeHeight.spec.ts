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
    document.body.classList.remove('select-none')
  })

  const startDrag = (clientY = 100) => {
    const vm = wrapper.vm as any
    vm.handleMousedown({ clientX: 0, clientY } as MouseEvent)
  }

  const moveTo = (clientY: number) => {
    document.dispatchEvent(new MouseEvent('mousemove', { clientY }))
  }

  it('renders correctly', () => {
    expect(wrapper.find('.resize-height').exists()).to.be.true
  })

  it('emits change on mousemove, measured from the drag start', async () => {
    startDrag(100)
    moveTo(150)

    await Vue.nextTick()

    const emitted = wrapper.emitted('change')
    expect(emitted).to.exist
    expect(emitted![0][0]).to.equal(50)
  })
})
