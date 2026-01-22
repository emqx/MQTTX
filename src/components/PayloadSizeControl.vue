<template>
  <div class="payload-size-control">
    <el-slider
      v-model="sliderValue"
      class="payload-size-slider"
      :min="min"
      :max="max"
      :step="step"
      :format-tooltip="formatTooltip"
      @input="handleSliderInput"
      @change="handleSliderChange"
    ></el-slider>
    <div class="payload-size-input">
      <el-select
        v-model="inputValue"
        class="payload-size-input-value"
        size="mini"
        filterable
        allow-create
        default-first-option
        @change="handleInputChange"
      >
        <el-option
          v-for="(option, index) in inputOptions"
          :key="`option-${index}`"
          :label="formatInputOptionLabel(option)"
          :value="option"
        >
        </el-option>
      </el-select>
      <el-select v-model="unit" class="payload-size-input-unit" size="mini" @change="handleUnitChange">
        <el-option v-for="option in unitOptions" :key="option" :label="option" :value="option"></el-option>
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import _ from 'lodash'
import { formatBytes } from '@/utils/formatter'

@Component
export default class PayloadSizeControl extends Vue {
  @Prop({ type: Number, required: true }) readonly value!: number
  @Prop({ type: Number, required: true }) readonly min!: number
  @Prop({ type: Number, required: true }) readonly max!: number
  @Prop({ type: Number, required: true }) readonly step!: number
  @Prop({ type: Array, default: () => [] }) readonly presets!: number[]

  private sliderValue = 0
  private inputValue: number | string = 0
  private unit: 'KB' | 'MB' = 'KB'
  private unitOptions: Array<'KB' | 'MB'> = ['KB', 'MB']

  private throttledSyncFromSlider = _.throttle((value: number) => {
    this.syncFromBytes(value)
  }, 100)

  private debouncedEmitChange = _.debounce((value: number) => {
    this.$emit('change', value)
  }, 300)

  created() {
    this.syncFromBytes(this.value)
  }

  @Watch('value')
  onValueChange(newValue: number) {
    this.syncFromBytes(newValue)
  }

  get inputOptions(): number[] {
    const presets = this.presets.length ? this.presets : [this.min, this.min * 2, this.min * 4, this.min * 8]
    const unitValue = this.getUnitValue(this.unit)
    const options = presets
      .filter((preset) => preset >= unitValue)
      .map((preset) => Number((preset / unitValue).toFixed(this.unit === 'MB' ? 2 : 0)))
      .filter((option) => option > 0 && Number.isFinite(option))
    return Array.from(new Set(options))
  }

  private formatTooltip(value: number): string {
    return formatBytes(value)
  }

  private formatInputOptionLabel(value: number): string {
    return this.unit === 'MB' ? value.toFixed(2) : Math.round(value).toString()
  }

  private getUnitValue(unit: 'KB' | 'MB'): number {
    return unit === 'MB' ? 1024 * 1024 : 1024
  }

  private getBestUnit(bytes: number): 'KB' | 'MB' {
    return bytes >= 1024 * 1024 ? 'MB' : 'KB'
  }

  private syncFromBytes(bytes: number) {
    const safeValue = Number.isFinite(bytes) ? bytes : this.min
    this.sliderValue = safeValue
    this.unit = this.getBestUnit(safeValue)
    const unitValue = this.getUnitValue(this.unit)
    const precision = this.unit === 'MB' ? 2 : 0
    this.inputValue = Number((safeValue / unitValue).toFixed(precision))
  }

  private parseInputValue(value: number | string): { value: number; unit?: 'KB' | 'MB' } | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? { value } : null
    }
    const trimmedValue = value.trim()
    if (!trimmedValue) {
      return null
    }
    const match = trimmedValue.match(/^([0-9]+(?:\.[0-9]+)?)\s*(kb|mb)?$/i)
    if (!match) {
      return null
    }
    const numericValue = Number(match[1])
    if (!Number.isFinite(numericValue)) {
      return null
    }
    const unit = match[2] ? (match[2].toUpperCase() as 'KB' | 'MB') : undefined
    return { value: numericValue, unit }
  }

  private handleSliderInput(value: number) {
    this.sliderValue = value
    this.throttledSyncFromSlider(value)
  }

  private handleSliderChange(value: number) {
    this.sliderValue = value
    this.syncFromBytes(value)
    this.debouncedEmitChange(value)
  }

  private handleInputChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return
    }
    const parsed = this.parseInputValue(value)
    if (!parsed) {
      this.syncFromBytes(this.sliderValue)
      return
    }
    if (parsed.unit) {
      this.unit = parsed.unit
    }
    const bytes = Math.round(parsed.value * this.getUnitValue(this.unit))
    this.syncFromBytes(bytes)
    this.$emit('change', bytes)
  }

  private handleUnitChange() {
    this.handleInputChange(this.inputValue)
  }
}
</script>

<style lang="scss" scoped>
.payload-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payload-size-slider {
  width: 200px;
}

.payload-size-input {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-bg-normal);
  height: 28px;
  margin-left: 8px;
}

.payload-size-input-value,
.payload-size-input-unit {
  &.el-select {
    height: 28px;
  }
}

.payload-size-input-value {
  &.el-select {
    width: 88px;
  }
}

.payload-size-input-unit {
  &.el-select {
    width: 60px;
  }
}

::v-deep .payload-size-input .el-input__inner {
  border: none;
  background: transparent;
  box-shadow: none;
  height: 28px;
  line-height: 28px;
  padding: 0 8px;
  text-align: center;
}

::v-deep .payload-size-input-unit .el-input__inner {
  border-left: 1px solid var(--color-border-default);
  border-radius: 0;
  text-transform: uppercase;
}

::v-deep .payload-size-input .el-input__suffix {
  right: 6px;
}

::v-deep .payload-size-input-value .el-input__inner {
  padding-right: 22px;
}

::v-deep .payload-size-input-unit .el-input__inner {
  padding-right: 22px;
}
</style>
