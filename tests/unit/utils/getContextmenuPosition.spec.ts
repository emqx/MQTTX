import { expect } from 'chai'
import getContextmenuPosition from '@/utils/getContextmenuPosition'

describe('getContextmenuPosition', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    // Set a fixed window size for testing
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })
  })

  afterEach(() => {
    // Restore original window size
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
  })

  it('should return correct position when menu fits within window', () => {
    const event = { clientX: 100, clientY: 100 } as MouseEvent
    const width = 200
    const height = 150

    const result = getContextmenuPosition(event, width, height)

    expect(result.x).to.equal(100)
    expect(result.y).to.equal(100)
  })

  it('should adjust x position when menu would overflow right edge', () => {
    const event = { clientX: 900, clientY: 100 } as MouseEvent
    const width = 200
    const height = 150

    const result = getContextmenuPosition(event, width, height)

    expect(result.x).to.equal(824) // 1024 - 200
    expect(result.y).to.equal(100)
  })

  it('should adjust y position when menu would overflow bottom edge', () => {
    const event = { clientX: 100, clientY: 700 } as MouseEvent
    const width = 200
    const height = 150

    const result = getContextmenuPosition(event, width, height)

    expect(result.x).to.equal(100)
    expect(result.y).to.equal(618) // 768 - 150
  })

  it('should adjust both x and y positions when menu would overflow both edges', () => {
    const event = { clientX: 900, clientY: 700 } as MouseEvent
    const width = 200
    const height = 150

    const result = getContextmenuPosition(event, width, height)

    expect(result.x).to.equal(824) // 1024 - 200
    expect(result.y).to.equal(618) // 768 - 150
  })

  it('should use document.documentElement.clientWidth/Height if innerWidth/Height are not available', () => {
    // Mock innerWidth/Height to be undefined
    Object.defineProperty(window, 'innerWidth', { value: undefined, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: undefined, writable: true })

    // Mock document.documentElement.clientWidth/Height
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, writable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 768, writable: true })

    const event = { clientX: 900, clientY: 700 } as MouseEvent
    const width = 200
    const height = 150

    const result = getContextmenuPosition(event, width, height)

    expect(result.x).to.equal(824) // 1024 - 200
    expect(result.y).to.equal(618) // 768 - 150
  })
})
