<template>
  <div class="widget-config-section">
    <el-card shadow="never" class="widget-section-body item-card">
      <el-row :gutter="10">
        <el-col :span="22">
          <el-form-item label-width="93px" label="Min">
            <el-input type="number" size="mini" v-model="localMin" step="1" placeholder="auto" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="93px" label="Max">
            <el-input type="number" size="mini" v-model="localMax" step="1" placeholder="auto" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="93px" label="Decimals">
            <el-input type="number" size="mini" v-model="localDecimals" :min="0" :max="6" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="93px" label="Unit">
            <el-input size="mini" v-model="localUnit" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="93px" label="Color" class="color-picker-item">
            <el-color-picker v-model="localColor" size="mini" color-format="hex" :predefine="predefineColors" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { defineColors } from '@/utils/colors'

@Component
export default class BigNumberConfig extends Vue {
  @Prop({ type: Object, required: true }) readonly options!: BigNumberWidgetOptions

  private localMin: string = ''
  private localMax: string = ''
  private localDecimals: string = '1'
  private localUnit: string = ''
  private localColor: string = '#00B572'

  private isUpdatingFromProps: boolean = false

  mounted() {
    this.syncFromProps()
  }

  @Watch('options', { deep: true })
  onOptionsChange() {
    this.syncFromProps()
  }

  private syncFromProps() {
    this.isUpdatingFromProps = true

    const o = this.options || {}
    this.localMin = o.min !== undefined ? String(o.min) : ''
    this.localMax = o.max !== undefined ? String(o.max) : ''
    this.localDecimals = o.decimals !== undefined ? String(o.decimals) : '1'
    this.localUnit = o.unit || ''
    this.localColor = o.color || '#00B572'

    this.$nextTick(() => {
      this.isUpdatingFromProps = false
    })
  }

  @Watch('localMin') onLocalMin(v: string) {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localMax') onLocalMax(v: string) {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localDecimals') onLocalDec(v: string) {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localUnit') onLocalUnit(v: string) {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localColor') onLocalColor(v: string) {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }

  get predefineColors(): string[] {
    return defineColors
  }

  private emitOptions() {
    const minNum = Number(this.localMin)
    const maxNum = Number(this.localMax)
    const decNum = Number(this.localDecimals)
    const next: BigNumberWidgetOptions = {
      ...this.options,
      min: this.localMin === '' || isNaN(minNum) ? undefined : minNum,
      max: this.localMax === '' || isNaN(maxNum) ? undefined : maxNum,
      decimals: isNaN(decNum) ? 1 : Math.min(Math.max(decNum, 0), 6),
      unit: this.localUnit || '',
      color: this.localColor || '#00B572',
    }
    this.$emit('update:options', next)
  }
}
</script>

<style scoped>
.color-picker-item {
  .el-form-item__content {
    display: flex !important;
    align-items: center !important;
    line-height: normal !important;
    height: 43px !important;
    justify-content: flex-start !important;
  }

  .el-color-picker {
    vertical-align: middle !important;
    margin: 0 !important;
    align-self: center !important;
  }
}
</style>
