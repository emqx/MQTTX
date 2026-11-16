import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import TreeVisual from '@/components/charts/TreeVisual.vue'

const originalGetContext = HTMLCanvasElement.prototype.getContext
const originalRenderer = (window as any).__ECHARTS__DEFAULT__RENDERER__
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')

describe('Topic Tree chart', () => {
  let wrapper: Wrapper<Vue> | undefined

  afterEach(() => {
    wrapper?.destroy()
    wrapper = undefined
    HTMLCanvasElement.prototype.getContext = originalGetContext
    ;(window as any).__ECHARTS__DEFAULT__RENDERER__ = originalRenderer
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth)
    } else {
      delete (HTMLElement.prototype as any).clientWidth
    }
    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
    } else {
      delete (HTMLElement.prototype as any).clientHeight
    }
  })

  it('resizes the tree chart with the window and stops after destroy', () => {
    echarts.use(SVGRenderer)
    ;(window as any).__ECHARTS__DEFAULT__RENDERER__ = 'svg'
    HTMLCanvasElement.prototype.getContext = (() => null) as any
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 })

    const localVue = createLocalVue()
    localVue.use(Vuex)
    wrapper = shallowMount(TreeVisual, {
      localVue,
      attachToDocument: true,
      propsData: {
        id: 'tree-visual-resize',
        data: { id: 'root', name: 'root', label: 'root', children: [] },
      },
      store: new Vuex.Store({ getters: { currentTheme: () => 'light' } }),
    })

    const chart = (wrapper.vm as any).chart
    expect(chart, 'chart exists').to.not.equal(null)
    let resizeCalls = 0
    chart.resize = () => {
      resizeCalls += 1
    }

    window.dispatchEvent(new Event('resize'))
    expect(resizeCalls, 'resize calls while mounted').to.equal(1)

    wrapper.destroy()
    wrapper = undefined
    window.dispatchEvent(new Event('resize'))
    expect(resizeCalls, 'resize calls after destroy').to.equal(1)
  })
})
