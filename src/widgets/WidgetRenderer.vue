<template>
  <div class="widget-renderer">
    <!-- @ts-ignore -->
    <component :is="widgetComponent" v-bind="widgetProps" @error="onError" />
    <div v-if="!widgetComponent" class="widget-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">Unknown widget type: {{ widget.type }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import type { WidgetModel } from '@/types/widgets'
import { widgetRegistry } from '@/widgets/widgetRegistry'
import type { BigNumberWidgetOptions, GaugeWidgetOptions, LineWidgetOptions } from '@/types/widgets'

@Component
export default class WidgetRenderer extends Vue {
  @Prop({ required: true }) readonly widget!: WidgetModel
  @Prop({ default: undefined }) readonly value!: number | undefined
  @Prop({ default: undefined }) readonly chartData!: Array<{ date: string; value: number }> | undefined

  get widgetComponent() {
    return widgetRegistry.getComponent(this.widget.type)
  }

  get widgetProps(): any {
    const baseProps = {
      id: `widget-${this.widget.id}`,
      value: this.value,
      title: this.widget.title,
      chartData: this.chartData,
    }

    const options = this.widget.widgetOptions || {}

    if (this.widget.type === 'Big Number') {
      const bigOptions = options as BigNumberWidgetOptions
      return {
        ...baseProps,
        min: bigOptions.min ?? 0,
        max: bigOptions.max ?? 100,
        thresholds: bigOptions.thresholds ?? [],
        decimals: bigOptions.decimals ?? 1,
        unit: bigOptions.unit ?? '',
        color: bigOptions.color ?? '#00B572',
      }
    } else if (this.widget.type === 'Gauge') {
      const gaugeOptions = options as GaugeWidgetOptions
      return {
        ...baseProps,
        min: gaugeOptions.min ?? 0,
        max: gaugeOptions.max ?? 100,
        thresholds: gaugeOptions.thresholds ?? [],
        decimals: gaugeOptions.decimals ?? 1,
        unit: gaugeOptions.unit ?? '',
        color: gaugeOptions.color ?? '#00B572',
        chartData: this.chartData,
      }
    } else if (this.widget.type === 'Line') {
      const lineOptions = options as LineWidgetOptions
      return {
        ...baseProps,
        smooth: lineOptions.smooth ?? true,
        area: lineOptions.area ?? true,
        chartData: this.chartData,
        color: lineOptions.color ?? '#00B572',
      }
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
  display: flex;
  align-items: center;
  justify-content: center;
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

.error-icon {
  font-size: 24px;
}

.error-message {
  font-size: 14px;
  opacity: 0.7;
}
</style>
