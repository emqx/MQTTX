import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import SplitView from '../common/SplitView.vue'

interface SplitViewInstance {
  panelSize: number
  isResizing: boolean
  startSize: number
  startValue: number
  resizePanel: {
    value: {
      parentElement: HTMLElement
    }
  }
  handleMouseMove: (event: MouseEvent) => void
  // Add other properties and methods as needed
}

describe('splitView', () => {
  let wrapper: ReturnType<typeof mount>
  beforeEach(() => {
    wrapper = mount(SplitView, {
      props: {
        fixedPanelSize: '260px',
        minSize: '10%',
        maxSize: '90%',
        vertical: false,
        hidePanelName: undefined,
        handleColor: '',
      },
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('handles default props correctly', () => {
    const wrapper = mount(SplitView)
    expect(wrapper.props('fixedPanelSize')).toBe('260px')
    expect(wrapper.props('minSize')).toBe('0%')
    expect(wrapper.props('maxSize')).toBe('100%')
    expect(wrapper.props('vertical')).toBe(false)
    expect(wrapper.props('hidePanelName')).toBe('')
    expect(wrapper.props('handleColor')).toBe('')
  })

  it('computes container styles correctly for horizontal orientation', () => {
    const wrapper = mount(SplitView, {
      props: {
        vertical: false,
      },
    })

    const containerElement = wrapper.find('.split-view')
    expect(containerElement.classes()).toContain('flex')
    expect(containerElement.classes()).not.toContain('flex-col')
  })

  it('computes container styles correctly for vertical orientation', () => {
    const wrapper = mount(SplitView, {
      props: {
        vertical: true,
      },
    })

    const containerElement = wrapper.find('.split-view')
    expect(containerElement.classes()).toContain('flex-col')
  })

  it('renders default slot content for panel-1', () => {
    const slotContent = 'Panel 1 Content'
    const wrapper = mount(SplitView, {
      slots: {
        'panel-1': slotContent,
      },
    })

    // Assert that the slot content is rendered
    expect(wrapper.html()).toContain(slotContent)
  })

  it('renders default slot content for panel-2', () => {
    const slotContent = 'Panel 2 Content'
    const wrapper = mount(SplitView, {
      slots: {
        'panel-2': slotContent,
      },
    })

    // Assert that the slot content is rendered
    expect(wrapper.html()).toContain(slotContent)
  })

  it('updates panelSize on horizontal mousemove within constraints', async () => {
    // Arrange
    const splitViewInstance = wrapper.vm as unknown as SplitViewInstance
    splitViewInstance.isResizing = true
    splitViewInstance.startSize = 260
    splitViewInstance.startValue = 260

    const parentElement = document.createElement('div')
    parentElement.style.width = '1000px'
    Object.assign(splitViewInstance, { parentElement })

    await wrapper.setProps({
      minSize: '100px', // Ensure this is a string if your component expects it
      maxSize: '500px', // Same here
    })

    const mouseMoveDelta = 50
    const moveEvent = new MouseEvent('mousemove', {
      clientX: splitViewInstance.startValue + mouseMoveDelta,
    })

    // Act
    splitViewInstance.handleMouseMove(moveEvent)

    // Wait for the animation frame and Vue's next tick
    await new Promise(resolve => requestAnimationFrame(resolve))
    await wrapper.vm.$nextTick()

    // Assert
    const expectedSize = 310 // 260 + 50 = 310
    const minSize = Number.parseInt(wrapper.props('minSize'), 10)
    const maxSize = Number.parseInt(wrapper.props('maxSize'), 10)

    // Check that the panel size has updated correctly within the constraints
    expect(splitViewInstance.panelSize).toBeGreaterThanOrEqual(minSize)
    expect(splitViewInstance.panelSize).toBeLessThanOrEqual(maxSize)
    // Ensure the panel size has updated to what we expect (within the constraints)
    if (expectedSize >= minSize && expectedSize <= maxSize) {
      expect(splitViewInstance.panelSize).toBe(expectedSize)
    }
    else if (expectedSize < minSize) {
      expect(splitViewInstance.panelSize).toBe(minSize)
    }
    else if (expectedSize > maxSize) {
      expect(splitViewInstance.panelSize).toBe(maxSize)
    }
  })
})
