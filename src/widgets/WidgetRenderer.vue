<template>
  <div class="widget-renderer">
    <!-- @ts-ignore -->
    <component :is="widgetComponent" v-bind="widgetProps" />
    <div v-if="!widgetComponent" class="widget-error">
      <div class="error-message">{{ $t('viewer.unknownWidgetType') }}: {{ widget.type }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { widgetRegistry } from '@/widgets/widgetRegistry'

@Component
export default class WidgetRenderer extends Vue {
  @Prop({ required: true }) readonly widget!: WidgetModel
  @Prop({ default: undefined }) readonly data!: BigNumberData | GaugeData | LineData | undefined
  @Prop({ default: 24 * 60 }) readonly duration!: number // Duration in minutes
  @Prop({ default: 'static' }) readonly timeRangeType!: 'live' | 'static'

  get widgetComponent() {
    return widgetRegistry.getComponent(this.widget.type)
  }

  get widgetProps(): any {
    const baseProps = {
      id: `widget-${this.widget.id}`,
      title: this.widget.title,
    }

    const options = this.widget.widgetOptions || {}
    // Options shared by every widget type; each branch adds its own data +
    // extras (and the timing props only the charts that actually read them).
    const sharedOptions = {
      thresholds: options.thresholds ?? [],
      thresholdsType: options.thresholdsType ?? 'Absolute',
      color: options.color ?? '#00B572',
    }

    if (this.widget.type === 'Big Number') {
      const bigOptions = options as BigNumberWidgetOptions
      const bigNumberData = this.data as BigNumberData | undefined
      return {
        ...baseProps,
        data: bigNumberData || { value: null, chartData: { xData: [], seriesData: [{ name: 'value', data: [] }] } },
        // Without a configured range the sparkline follows the data
        min: bigOptions.min,
        max: bigOptions.max,
        decimals: bigOptions.decimals ?? 1,
        unit: bigOptions.unit ?? '',
        timeRangeType: this.timeRangeType,
        ...sharedOptions,
      }
    } else if (this.widget.type === 'Gauge') {
      const gaugeOptions = options as GaugeWidgetOptions
      const gaugeData = this.data as GaugeData | undefined
      return {
        ...baseProps,
        data: gaugeData || { value: null },
        min: gaugeOptions.min ?? 0,
        max: gaugeOptions.max ?? 100,
        decimals: gaugeOptions.decimals ?? 1,
        unit: gaugeOptions.unit ?? '',
        ...sharedOptions,
      }
    } else if (this.widget.type === 'Line') {
      const lineOptions = options as LineWidgetOptions
      const lineData = this.data as LineData | undefined
      return {
        ...baseProps,
        data: lineData || { chartData: { xData: [], seriesData: [{ name: 'value', data: [] }] } },
        // Name the series for the tooltip instead of ECharts' default "series0".
        seriesName: this.widget.title || this.widget.valueField || '',
        smooth: lineOptions.smooth ?? true,
        area: lineOptions.area ?? true,
        duration: this.duration,
        timeRangeType: this.timeRangeType,
        ...sharedOptions,
      }
    }

    return baseProps
  }
}
</script>

<style scoped>
.widget-renderer {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  text-align: center;
  padding: 16px;
  gap: 8px;
}

.error-message {
  font-size: 14px;
  opacity: 0.7;
}
</style>
