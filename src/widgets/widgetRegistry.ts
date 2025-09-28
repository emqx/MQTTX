import { AsyncComponent } from 'vue'

const GaugeChart = () => import('@/components/charts/Gauge.vue')
const BigNumberChart = () => import('@/components/charts/BigNumber.vue')
const LineChart = () => import('@/components/charts/LineChart.vue')

interface WidgetConfig {
  component: AsyncComponent
  defaultOptions?: any
  minSize?: { w: number; h: number }
  maxSize?: { w: number; h: number }
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
      minSize: { w: 2, h: 2 },
      maxSize: { w: 6, h: 6 },
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
      minSize: { w: 2, h: 1 },
      maxSize: { w: 8, h: 4 },
    })

    this.register('Line', {
      component: LineChart,
      defaultOptions: { smooth: true, area: true, color: '#00B572' },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 12, h: 8 },
    })
  }

  register(type: WidgetType, config: WidgetConfig) {
    this.widgets.set(type, config)
  }

  getComponent(type: WidgetType): AsyncComponent | null {
    return this.widgets.get(type)?.component || null
  }

  getConfig(type: WidgetType): WidgetConfig | null {
    return this.widgets.get(type) || null
  }

  getAvailableTypes(): WidgetType[] {
    return Array.from(this.widgets.keys())
  }

  getDefaultOptions(type: WidgetType): any {
    return this.widgets.get(type)?.defaultOptions || {}
  }

  getMinSize(type: WidgetType): { w: number; h: number } {
    return this.widgets.get(type)?.minSize || { w: 1, h: 1 }
  }

  getMaxSize(type: WidgetType): { w: number; h: number } {
    return this.widgets.get(type)?.maxSize || { w: 12, h: 12 }
  }
}

export const widgetRegistry = new WidgetRegistry()
