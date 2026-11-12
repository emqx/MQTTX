import { expect } from 'chai'
import { createMessageScroll } from '@/utils/messageScroll'

describe('Message scroll scheduling', () => {
  let hidden: boolean
  let following: boolean
  let calls: number
  let frameId: number
  let frames: Map<number, FrameRequestCallback>
  let scroll: ReturnType<typeof createMessageScroll>
  let originalHidden: PropertyDescriptor | undefined
  let requestFrame: typeof window.requestAnimationFrame
  let cancelFrame: typeof window.cancelAnimationFrame

  const flush = () => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach((callback) => callback(0))
  }
  const visibility = (value: boolean) => {
    hidden = value
    document.dispatchEvent(new Event('visibilitychange'))
  }

  beforeEach(() => {
    hidden = false
    following = true
    calls = frameId = 0
    frames = new Map()
    originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden')
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    requestFrame = window.requestAnimationFrame
    cancelFrame = window.cancelAnimationFrame
    window.requestAnimationFrame = (callback) => {
      frames.set(++frameId, callback)
      return frameId
    }
    window.cancelAnimationFrame = (id) => {
      frames.delete(id)
    }
    scroll = createMessageScroll(
      () => {
        calls++
      },
      () => following,
    )
  })

  afterEach(() => {
    scroll.dispose()
    window.requestAnimationFrame = requestFrame
    window.cancelAnimationFrame = cancelFrame
    if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden)
    else delete (document as any).hidden
  })

  it('coalesces repeated requests into one scroll per frame', () => {
    scroll.request()
    scroll.request()
    scroll.request()
    flush()
    expect(calls).to.equal(1)
    scroll.request()
    flush()
    expect(calls).to.equal(2)
  })

  it('waits for the window to be visible before scrolling to the bottom', () => {
    visibility(true)
    scroll.request()
    scroll.request()
    expect(frames.size).to.equal(0)
    expect(calls).to.equal(0)
    visibility(false)
    flush()
    expect(calls).to.equal(1)
  })

  it('cancels an already scheduled frame when hidden', () => {
    scroll.request()
    visibility(true)
    flush()
    expect(calls).to.equal(0)
    visibility(false)
    flush()
    expect(calls).to.equal(1)
  })

  it('keeps the reading position when the window becomes visible', () => {
    following = false
    visibility(true)
    scroll.request()
    visibility(false)
    flush()
    expect(calls).to.equal(0)
  })

  it('scrolls on request while reading older messages', () => {
    following = false
    scroll.request()
    flush()
    expect(calls).to.equal(1)
  })

  it('cancels pending scrolling and removes the visibility listener', () => {
    scroll.request()
    scroll.dispose()
    visibility(true)
    visibility(false)
    flush()
    expect(calls).to.equal(0)
  })
})
