import { AsyncComponent } from 'vue'

const GaugeChart = () => import('@/components/charts/Gauge.vue')
const BigNumberChart = () => import('@/components/charts/BigNumber.vue')
const LineChart = () => import('@/components/charts/LineChart.vue')

interface WidgetConfig {
  component: AsyncComponent
  defaultOptions?: any
}

class WidgetRegistry {
  private widgets = new Map<WidgetType, WidgetConfig>()

  constructor() {
    this.registerDefaults()
  }

  private registerDefaults() {
    this.register('Gauge', {
      component: GaugeChart,
      defaultOptions: {
        min: undefined,
        max: undefined,
        thresholds: [],
        thresholdsType: 'Absolute',
        decimals: 1,
        unit: '',
        color: '#00B572',
      },
    })

    this.register('Big Number', {
      component: BigNumberChart,
      defaultOptions: {
        min: undefined,
        max: undefined,
        thresholds: [],
        thresholdsType: 'Absolute',
        decimals: 1,
        unit: '',
        color: '#00B572',
      },
    })

    this.register('Line', {
      component: LineChart,
      defaultOptions: { smooth: true, area: true, color: '#00B572' },
    })
  }

  register(type: WidgetType, config: WidgetConfig) {
    this.widgets.set(type, config)
  }

  getComponent(type: WidgetType): AsyncComponent | null {
    return this.widgets.get(type)?.component || null
  }

  getAvailableTypes(): WidgetType[] {
    return Array.from(this.widgets.keys())
  }

  getDefaultOptions(type: WidgetType): any {
    return this.widgets.get(type)?.defaultOptions || {}
  }
}

export const widgetRegistry = new WidgetRegistry()
