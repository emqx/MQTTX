import { expect } from 'chai'
import { createLocalVue, mount } from '@vue/test-utils'
import MessageRender from '@/components/agent/MessageRender.vue'

const render = (content: string) =>
  mount(MessageRender, { localVue: createLocalVue(), sync: false, propsData: { content } })

describe('Agent message security', () => {
  it('should display model-supplied HTML as text instead of creating active elements', () => {
    const content = '<img src="invalid" onerror="window.agentHtmlExecuted = true"><iframe src="about:blank"></iframe>'
    const wrapper = render(content)

    expect(wrapper.find('img[onerror]').exists()).to.equal(false)
    expect(wrapper.find('iframe').exists()).to.equal(false)
    expect(wrapper.text()).to.contain('<img')
    wrapper.destroy()
  })

  it('should reject executable Markdown links and preserve ordinary HTTPS links', () => {
    const content = '[unsafe](javascript:alert(1))\n\n[safe](https://mqttx.app)'
    const wrapper = render(content)

    expect(wrapper.find('a[href^="javascript:"]').exists()).to.equal(false)
    expect(wrapper.find('a[href="https://mqttx.app"]').exists()).to.equal(true)
    wrapper.destroy()
  })

  it('should preserve Markdown formatting and literal code samples', () => {
    const content = '# Result\n\n**Connected**\n\n```html\n<img onerror="example()">\n```'
    const wrapper = render(content)

    expect(wrapper.find('h1').text()).to.equal('Result')
    expect(wrapper.find('strong').text()).to.equal('Connected')
    expect(wrapper.find('pre code').text()).to.contain('<img onerror="example()">')
    expect(wrapper.find('img').exists()).to.equal(false)
    wrapper.destroy()
  })
})
