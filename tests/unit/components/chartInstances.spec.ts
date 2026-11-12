import { expect } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import LineChart from '@/components/charts/LineChart.vue'
import BigNumber from '@/components/charts/BigNumber.vue'
import Gauge from '@/components/charts/Gauge.vue'
import LineChartExtent from '@/components/charts/LineChartExtent.vue'
import TreeVisual from '@/components/charts/TreeVisual.vue'

echarts.use(SVGRenderer)

describe('Non-reactive ECharts instances', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  const rendererWindow = window as Window & { __ECHARTS__DEFAULT__RENDERER__?: string }
  const originalRenderer = rendererWindow.__ECHARTS__DEFAULT__RENDERER__
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
  const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
  let wrapper: Wrapper<Vue> | undefined

  beforeEach(() => {
    // Exercise the real init/update/dispose methods without a canvas implementation in jsdom.
    rendererWindow.__ECHARTS__DEFAULT__RENDERER__ = 'svg'
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof originalGetContext
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 400 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 })
  })

  afterEach(() => {
    wrapper?.destroy()
    wrapper = undefined
    if (originalRenderer === undefined) delete rendererWindow.__ECHARTS__DEFAULT__RENDERER__
    else rendererWindow.__ECHARTS__DEFAULT__RENDERER__ = originalRenderer
    HTMLCanvasElement.prototype.getContext = originalGetContext
    if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalWidth)
    else delete (HTMLElement.prototype as any).clientWidth
    if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalHeight)
    else delete (HTMLElement.prototype as any).clientHeight
  })

  const cases = [
    { name: 'LineChart', component: LineChart, field: 'myChart', prop: 'data' },
    { name: 'BigNumber', component: BigNumber, field: 'myChart', prop: 'data' },
    { name: 'Gauge', component: Gauge, field: 'myChart', prop: 'data' },
    { name: 'LineChartExtent', component: LineChartExtent, field: 'areaLineChart', prop: 'chartData' },
    { name: 'TreeVisual', component: TreeVisual, field: 'chart', prop: 'data' },
  ]

  for (const { name, component, field, prop } of cases) {
    it(`${name} keeps ${field} unobserved while updating data and disposing on destroy`, async () => {
      const series = {
        xData: ['2026-01-01T00:00:00Z'],
        seriesData: [{ name: 'value', data: [21], areaStyle: { colorFrom: '#00B572', colorTo: '#ffffff' } }],
      }
      const data = Vue.observable(
        name === 'TreeVisual'
          ? { id: 'root', name: 'root', label: 'root', messageCount: 0, subTopicCount: 0, children: [] }
          : name === 'LineChartExtent'
          ? series
          : { value: 21, chartData: series },
      )
      wrapper = shallowMount<Vue>(component, {
        localVue,
        sync: false,
        store: new Vuex.Store({ getters: { currentTheme: () => 'light' } }),
        attachToDocument: true,
        propsData: { id: `chart-instance-${name}`, [prop]: data },
        mocks: { $t: (key: string) => key },
      })
      await wrapper.vm.$nextTick()
      // LineChart debounces its initial draw and data watcher by 100 ms.
      await new Promise((resolve) => setTimeout(resolve, 150))

      const vm = wrapper.vm as any
      const chart = vm[field]
      expect(chart).to.equal(echarts.getInstanceByDom(document.getElementById(vm.id)!))
      expect(chart).not.to.have.own.property('__ob__')
      expect(vm.$data).not.to.have.own.property(field)
      expect(vm[prop]).to.have.own.property('__ob__')

      let disposals = 0
      const dispose = chart.dispose.bind(chart)
      chart.dispose = () => {
        disposals++
        return dispose()
      }

      // Mutate nested data to exercise the existing watchers, rather than calling updateChart directly.
      if (name === 'TreeVisual') vm.data.name = 'updated root'
      else if (name === 'Gauge') vm.data.value = 42
      else if (name === 'LineChartExtent') vm.chartData.seriesData[0].data.splice(0, 1, 42)
      else vm.data.chartData.seriesData[0].data.splice(0, 1, 42)
      await vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 150))

      const option = chart.getOption()
      if (name === 'TreeVisual') expect(option.series[0].data[0].name).to.equal('updated root')
      else if (name === 'Gauge') expect(option.series[1].data[0].value).to.equal(42)
      else if (name === 'LineChartExtent') expect(option.series[0].data[0]).to.equal(42)
      else expect(option.series[0].data[0][1]).to.equal(42)
      expect(chart).not.to.have.own.property('__ob__')

      wrapper.destroy()
      wrapper = undefined
      expect(disposals).to.equal(1)
      expect(chart.isDisposed()).to.equal(true)
    })
  }
})
