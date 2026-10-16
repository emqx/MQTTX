import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import ElementUI from 'element-ui'
import { DirectiveBinding } from 'vue/types/options'
import ResponseInformation from '@/views/connections/ResponseInformation.vue'

const originalResizeObserver = window.ResizeObserver

function render(responseInformation: string, { previewClipped = true } = {}) {
  window.ResizeObserver = class implements ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}

    observe(target: Element): void {
      Object.defineProperties(target, {
        clientWidth: { configurable: true, value: previewClipped ? 100 : 200 },
        scrollWidth: { configurable: true, value: 200 },
      })
      this.callback([], this)
    }

    unobserve(): void {}

    disconnect(): void {}
  }
  const localVue = createLocalVue()
  localVue.use(ElementUI)
  const captureClipboard = (element: HTMLElement, binding: DirectiveBinding) => {
    if (binding.arg === 'copy') element.setAttribute('data-clipboard-value', binding.value)
  }
  localVue.directive('clipboard', { bind: captureClipboard, update: captureClipboard })
  return mount(ResponseInformation, {
    localVue,
    sync: false,
    attachToDocument: true,
    propsData: { responseInformation },
    mocks: { $t: (key: string) => key, $tc: (key: string) => key },
  })
}

describe('Desktop Response Information display', () => {
  afterEach(() => {
    window.ResizeObserver = originalResizeObserver
  })

  it('preserves the full value with a single clipboard control and no repeated popover actions', () => {
    const value = 'responses/' + 'x'.repeat(5000)
    const wrapper = render(value)
    expect(wrapper.find('.response-information-preview').text()).to.equal(value)
    expect(wrapper.find('.response-information-value').text()).to.equal(value)
    expect(wrapper.findAll('.copy-response-information').length).to.equal(1)
    const copyButton = wrapper.find('.copy-response-information')
    expect(copyButton.attributes('data-clipboard-value')).to.equal(value)
    expect(copyButton.attributes('aria-label')).to.equal('common.copyTarget')
    wrapper.destroy()
  })

  it('opens full details and dismisses them with Escape, the same trigger, or an outside click', async () => {
    const wrapper = render('responses/client-1')
    await wrapper.vm.$nextTick()
    const reference = wrapper.find('.response-information-reference')
    expect(reference.attributes('aria-expanded')).to.equal('false')
    await reference.trigger('click')
    expect(reference.attributes('aria-expanded')).to.equal('true')
    const popover = document.body.querySelector('.response-information-popover') as HTMLElement
    expect(popover.style.display).not.to.equal('none')
    expect(popover.querySelector('.response-information-value')!.textContent).to.equal('responses/client-1')
    await reference.trigger('keydown', { key: 'Escape', keyCode: 27 })
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(document.activeElement).to.equal(reference.element)
    await reference.trigger('click')
    await reference.trigger('click')
    expect(reference.attributes('aria-expanded')).to.equal('false')
    await reference.trigger('click')
    const detail = popover.querySelector('.response-information-value') as HTMLElement
    detail.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(document.activeElement).to.equal(reference.element)
    await reference.trigger('click')
    document.body.click()
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    wrapper.destroy()
  })

  it('shows a complete short value without an unnecessary duplicate popover', async () => {
    const wrapper = render('responses/client-1', { previewClipped: false })
    await wrapper.vm.$nextTick()
    const reference = wrapper.find('.response-information-reference')
    ;(reference.element as HTMLButtonElement).click()
    await wrapper.vm.$nextTick()
    expect(reference.attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/client-1')
    wrapper.destroy()
  })

  it('dismisses details with Escape from the copy button or popup container', async () => {
    const wrapper = render('responses/client-1')
    try {
      await wrapper.vm.$nextTick()
      const reference = wrapper.find('.response-information-reference')
      await reference.trigger('click')
      const copy = wrapper.find('.copy-response-information').element as HTMLButtonElement
      copy.focus()
      copy.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(reference.attributes('aria-expanded')).to.equal('false')
      expect(document.activeElement).to.equal(reference.element)
      await reference.trigger('click')
      const popover = document.body.querySelector('.response-information-popover') as HTMLElement
      popover.focus()
      popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(reference.attributes('aria-expanded')).to.equal('false')
      expect(document.activeElement).to.equal(reference.element)
    } finally {
      wrapper.destroy()
    }
  })

  it('closes an open popover when the response changes and copies the new value', async () => {
    const wrapper = render('responses/A')
    await wrapper.vm.$nextTick()
    await wrapper.find('.response-information-reference').trigger('click')
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('true')
    await wrapper.setProps({ responseInformation: 'responses/B' })
    expect(wrapper.find('.response-information-reference').attributes('aria-expanded')).to.equal('false')
    expect(wrapper.find('.response-information-preview').text()).to.equal('responses/B')
    expect(wrapper.find('.copy-response-information').attributes('data-clipboard-value')).to.equal('responses/B')
    wrapper.destroy()
  })

  it('hides absent information', async () => {
    const wrapper = render('responses/A')
    expect(wrapper.find('.response-information').exists()).to.be.true
    await wrapper.setProps({ responseInformation: '' })
    expect(wrapper.find('.response-information').exists()).to.be.false
    wrapper.destroy()
  })
})
