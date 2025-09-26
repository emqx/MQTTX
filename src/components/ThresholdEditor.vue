<template>
  <div class="key-value-editor">
    <div class="editor-header">
      <div class="header-left">
        <span class="editor-title">{{ title }}</span>
        <el-select
          v-model="localThresholdsType"
          size="mini"
          placeholder="Select type"
          style="margin-left: 10px"
          @change="emitThresholdsTypeChange"
        >
          <el-option label="Absolute" value="Absolute" />
          <el-option label="Percentage" value="Percentage" />
        </el-select>
        <el-button
          icon="el-icon-plus"
          class="btn-props-plus"
          type="text"
          @click="addThreshold"
          style="margin-left: 10px"
        ></el-button>
      </div>
    </div>
    <div class="editor-row">
      <el-row v-for="(threshold, index) in localThresholds" :key="index" :gutter="10" class="editor-row">
        <el-col :span="10">
          <el-input
            type="number"
            v-model.number="threshold.value"
            size="mini"
            placeholder="Value"
            @input="onThresholdChange"
          />
        </el-col>
        <el-col :span="4">
          <ColorPicker v-model="threshold.color" title="Color" @input="onThresholdChange" />
        </el-col>
        <el-col :span="4">
          <el-button icon="el-icon-delete" class="btn-delete" type="text" @click="removeThreshold(index)" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import ColorPicker from './ColorPicker.vue'

@Component({
  components: { ColorPicker },
})
export default class ThresholdEditor extends Vue {
  @Prop({ type: String, default: 'Thresholds' }) readonly title!: string
  @Prop({ type: Array, default: () => [] }) readonly value!: Array<{ value: number; color: string }>
  @Prop({ type: String, default: 'Absolute' }) readonly thresholdsType!: 'Absolute' | 'Percentage'

  private localThresholds: Array<{ value: number; color: string }> = []
  private localThresholdsType: 'Absolute' | 'Percentage' = 'Absolute'

  mounted() {
    this.initializeLocalData()
  }

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

  private initializeLocalData() {
    this.localThresholds = [...(this.value || [])]
    this.localThresholdsType = this.thresholdsType
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
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .header-left {
      display: flex;
      align-items: center;
    }
    .editor-title {
      font-weight: 600;
      color: var(--color-text-title);
    }
  }
  .editor-row {
    margin-top: 10px;
  }
  .btn-props-plus {
    font-size: 12px;
  }
  .btn-delete {
    color: var(--color-text-light);
  }
}
</style>
