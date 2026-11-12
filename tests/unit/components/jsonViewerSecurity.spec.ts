import { expect } from 'chai'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import ElementUI from 'element-ui'
import JSONViewer from '@/widgets/JSONViewer.vue'

const XSS = '<img src=x onerror=window.__x2180v=1>'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(ElementUI)

const message = (payload: string): MessageModel => ({
  createAt: '2024-01-01 00:00:00',
  out: false,
  payload,
  qos: 0,
  retain: false,
  topic: 'test/topic',
})

const render = (payload: string, extraMocks: Record<string, any> = {}) =>
  mount(JSONViewer, {
    localVue,
    sync: false,
    propsData: { messages: [message(payload)] },
    store: new Vuex.Store({ getters: { currentTheme: () => 'light' } }),
    stubs: {
      MessageViewerHeader: true,
      MessageHeaderMeta: true,
      MyDialog: true,
      TreeVisual: true,
    },
    mocks: {
      $t: (key: string) => key,
      $tc: (key: string) => key,
      ...extraMocks,
    },
  })

const valueTexts = (wrapper: any): string[] =>
  wrapper.findAll('.tree-view-item-value').wrappers.map((item: any) => item.text())

const keyTexts = (wrapper: any): string[] =>
  wrapper.findAll('.tree-view-item-key').wrappers.map((item: any) => item.text())

const tree = (wrapper: any) => wrapper.find('.tree-view-wrapper')

describe('JSON viewer text tree string security', () => {
  it('renders nested object and array string values as literal text without live elements', () => {
    const payload = JSON.stringify({
      '<img src=x onerror=window.__key=1>': 'key-value',
      nested: {
        html: XSS,
        list: ['<svg onload=window.__svg=1></svg>', '<iframe src="javascript:window.__frame=1"></iframe>'],
      },
    })
    const wrapper = render(payload)

    expect(tree(wrapper).find('img').exists()).to.equal(false)
    expect(tree(wrapper).find('svg').exists()).to.equal(false)
    expect(tree(wrapper).find('iframe').exists()).to.equal(false)
    expect(valueTexts(wrapper)).to.include(`"${XSS}"`)
    expect(valueTexts(wrapper)).to.include('"<svg onload=window.__svg=1></svg>"')
    expect(valueTexts(wrapper)).to.include('"<iframe src="javascript:window.__frame=1"></iframe>"')
    expect(wrapper.text()).to.contain(XSS)
    expect(keyTexts(wrapper)).to.include('"<img src=x onerror=window.__key=1>":')
    wrapper.destroy()
  })

  it('keeps special characters and entity-looking strings as text after one DOM decode', () => {
    const value = 'A & B < C > D "quoted" &lt;script&gt;alert(1)&lt;/script&gt;'
    const wrapper = render(JSON.stringify({ text: value }))

    expect(tree(wrapper).find('script').exists()).to.equal(false)
    expect(valueTexts(wrapper)).to.include(`"${value}"`)
    wrapper.destroy()
  })

  it('escapes a top-level JSON string and a plain-text fallback payload', () => {
    const topLevel = render(JSON.stringify(XSS))

    expect(tree(topLevel).find('img').exists()).to.equal(false)
    expect(valueTexts(topLevel)).to.include(`"${XSS}"`)
    topLevel.destroy()

    const plainText = render(`${XSS} is not json`)

    expect(tree(plainText).find('img').exists()).to.equal(false)
    expect(valueTexts(plainText)).to.include(`"${XSS} is not json"`)
    plainText.destroy()
  })

  it('keeps scalar values, malformed HTML keys, the original message, copy payload and chart data unchanged', async () => {
    const html = '<b>bold</b>'
    const payload = JSON.stringify({ n: 42, b: false, z: null, s: html, '<i>key</i>': 'x' })
    let copied: string | null = null
    const wrapper = render(payload, {
      $copyText: (text: string) => {
        copied = text
        return Promise.resolve()
      },
      $message: { success: () => {}, error: () => {} },
    })

    expect(wrapper.find('.tree-view-item-value-number').text()).to.equal('42')
    expect(wrapper.find('.tree-view-item-value-boolean').text()).to.equal('false')
    expect(wrapper.find('.tree-view-item-value-null').text()).to.equal('null')
    expect(valueTexts(wrapper)).to.include(`"${html}"`)
    expect(tree(wrapper).find('b').exists()).to.equal(false)
    expect(keyTexts(wrapper)).to.include('"<i>key</i>":')
    expect(tree(wrapper).find('i').exists()).to.equal(false)

    expect((wrapper.vm as any).currentMessage.payload).to.equal(payload)
    expect(JSON.stringify((wrapper.vm as any).treeData)).to.contain(html)
    ;(wrapper.vm as any).copyPayload(payload)
    await Promise.resolve()
    expect(copied).to.equal(payload)
    wrapper.destroy()
  })
})
