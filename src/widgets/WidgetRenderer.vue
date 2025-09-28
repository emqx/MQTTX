<template>
  <div class="widget-renderer">
    <!-- @ts-ignore -->
    <component :is="widgetComponent" v-bind="widgetProps" @error="onError" />
    <div v-if="!widgetComponent" class="widget-error">
      <div class="error-message">Unknown widget type: {{ widget.type }}</div>
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

    if (this.widget.type === 'Big Number') {
      const bigOptions = options as BigNumberWidgetOptions
      const bigNumberData = this.data as BigNumberData | undefined
      const props = {
        ...baseProps,
        data: bigNumberData || { value: null, chartData: { xData: [], seriesData: [{ name: 'value', data: [] }] } },
        min: bigOptions.min ?? 0,
        max: bigOptions.max ?? 100,
        thresholds: bigOptions.thresholds ?? [],
        decimals: bigOptions.decimals ?? 1,
        unit: bigOptions.unit ?? '',
        color: bigOptions.color ?? '#00B572',
        thresholdsType: bigOptions.thresholdsType ?? 'Absolute',
        extractedFieldName: bigNumberData?.fieldName ?? '',
        duration: this.duration,
        timeRangeType: this.timeRangeType,
      }
      return props
    } else if (this.widget.type === 'Gauge') {
      const gaugeOptions = options as GaugeWidgetOptions
      const gaugeData = this.data as GaugeData | undefined
      const props = {
        ...baseProps,
        data: gaugeData || { value: null },
        min: gaugeOptions.min ?? 0,
        max: gaugeOptions.max ?? 100,
        thresholds: gaugeOptions.thresholds ?? [],
        decimals: gaugeOptions.decimals ?? 1,
        unit: gaugeOptions.unit ?? '',
        color: gaugeOptions.color ?? '#00B572',
        thresholdsType: gaugeOptions.thresholdsType ?? 'Absolute',
        valueField: gaugeData?.fieldName ?? this.widget.valueField ?? '',
        duration: this.duration,
        timeRangeType: this.timeRangeType,
      }
      return props
    } else if (this.widget.type === 'Line') {
      const lineOptions = options as LineWidgetOptions
      const lineData = this.data as LineData | undefined
      const props = {
        ...baseProps,
        data: lineData || { chartData: { xData: [], seriesData: [{ name: 'value', data: [] }] } },
        smooth: lineOptions.smooth ?? true,
        area: lineOptions.area ?? true,
        color: lineOptions.color ?? '#00B572',
        thresholds: lineOptions.thresholds ?? [],
        thresholdsType: lineOptions.thresholdsType ?? 'Absolute',
        duration: this.duration,
        timeRangeType: this.timeRangeType,
      }
      return props
    }

    return baseProps
  }

  private onError(error: Error) {
    console.error(`Widget ${this.widget.id} error:`, error)
    this.$emit('error', error)
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
