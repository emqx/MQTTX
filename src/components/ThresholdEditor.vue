<template>
  <div class="key-value-editor">
    <div class="editor-header">
      <span class="editor-label">{{ $t('viewer.thresholdsType') }}</span>
      <div class="editor-type-row">
        <el-select
          v-model="localThresholdsType"
          size="small"
          class="thresholds-type"
          @change="emitThresholdsTypeChange"
        >
          <el-option :label="$t('viewer.absolute')" value="Absolute" />
          <el-option :label="$t('viewer.percentage')" value="Percentage" />
        </el-select>
        <el-button icon="el-icon-plus" class="btn-props-plus" type="text" @click="addThreshold"></el-button>
      </div>
    </div>
    <div class="editor-rows">
      <div v-for="(threshold, index) in localThresholds" :key="index" class="editor-row">
        <el-input
          type="number"
          v-model.number="threshold.value"
          size="small"
          class="threshold-value"
          :placeholder="$t('viewer.thresholdValue')"
          @input="onThresholdChange"
        />
        <el-color-picker
          v-model="threshold.color"
          size="small"
          color-format="hex"
          class="threshold-color"
          @change="onThresholdChange"
        />
        <el-button icon="el-icon-delete" class="btn-delete" type="text" @click="removeThreshold(index)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class ThresholdEditor extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: Array<{ value: number; color: string }>
  @Prop({ type: String, default: 'Absolute' }) readonly thresholdsType!: 'Absolute' | 'Percentage'

  private localThresholds: Array<{ value: number; color: string }> = []
  private localThresholdsType: 'Absolute' | 'Percentage' = 'Absolute'

  @Watch('value', { deep: true, immediate: true })
  onValueChange(newValue: Array<{ value: number; color: string }>) {
    if (JSON.stringify(this.localThresholds) !== JSON.stringify(newValue)) {
      this.localThresholds = [...(newValue || [])]
    }
  }

  @Watch('thresholdsType', { immediate: true })
  onThresholdsTypeChange(newType: 'Absolute' | 'Percentage') {
    this.localThresholdsType = newType
  }

  private addThreshold() {
    this.localThresholds.push({ value: 0, color: '#FF0000' })
    this.emitChange()
  }

  private removeThreshold(index: number) {
    this.localThresholds.splice(index, 1)
    this.emitChange()
  }

  private onThresholdChange() {
    this.emitChange()
  }

  private emitThresholdsTypeChange() {
    this.$emit('update:thresholdsType', this.localThresholdsType)
  }

  private emitChange() {
    this.$emit('input', [...this.localThresholds])
  }
}
</script>

<style lang="scss" scoped>
.key-value-editor {
  // Label above the controls, like the other fields of the form
  .editor-header {
    .editor-type-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .editor-label {
      display: block;
      padding-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      color: var(--color-text-default);
    }

    .thresholds-type {
      flex: 1;
      min-width: 0;
    }
  }

  .editor-rows {
    margin-top: 12px;
  }

  .editor-row {
    display: flex;
    align-items: center;
    gap: 8px;

    &:not(:last-child) {
      margin-bottom: 8px;
    }

    .threshold-value {
      flex: 1;
      min-width: 0;
    }

    .threshold-color {
      flex-shrink: 0;
    }

    .btn-delete {
      flex-shrink: 0;
    }
  }

  .btn-props-plus {
    font-size: 12px;
  }

  .btn-delete {
    color: var(--color-text-light);
  }
}
</style>
