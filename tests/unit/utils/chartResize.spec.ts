import { expect } from 'chai'
import { attachChartResize, CHART_RESIZE_DEBOUNCE_MS } from '@/utils/chartTheme'

class FakeResizeObserver {
  public static instances: FakeResizeObserver[] = []
  public disconnected = false
  public observed: Element[] = []

  constructor(private readonly callback: () => void) {
    FakeResizeObserver.instances.push(this)
  }

  public observe(target: Element): void {
    this.observed.push(target)
  }

  public disconnect(): void {
    this.disconnected = true
  }

  public fire(): void {
    this.callback()
  }
}

const original = window.ResizeObserver

// jsdom has no ResizeObserver, and the util resolves it through `window`.
const install = (observer: unknown) => {
  const target = window as unknown as { ResizeObserver: unknown }
  target.ResizeObserver = observer
}

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('attachChartResize', () => {
  let container: HTMLElement

  beforeEach(() => {
    FakeResizeObserver.instances = []
    install(FakeResizeObserver)
    container = document.createElement('div')
  })

  afterEach(() => {
    install(original)
  })

  const observer = () => FakeResizeObserver.instances[0]

  it('observes the container and redraws once per burst', async () => {
    let redraws = 0
    attachChartResize(container, () => redraws++)

    expect(observer().observed).to.have.lengthOf(1)
    expect(observer().observed[0]).to.equal(container)

    observer().fire()
    observer().fire()
    observer().fire()
    expect(redraws).to.equal(0)

    await tick(CHART_RESIZE_DEBOUNCE_MS + 60)
    expect(redraws).to.equal(1)
  })

  it('stops observing and drops a pending redraw when detached', async () => {
    let redraws = 0
    const detach = attachChartResize(container, () => redraws++)

    observer().fire()
    detach()
    expect(observer().disconnected).to.equal(true)

    await tick(CHART_RESIZE_DEBOUNCE_MS + 60)
    expect(redraws).to.equal(0)
  })

  it('returns a safe no-op detach when it cannot observe', () => {
    install(undefined)

    const detach = attachChartResize(container, () => {
      throw new Error('must not redraw without a ResizeObserver')
    })

    expect(() => detach()).to.not.throw()
  })
})
