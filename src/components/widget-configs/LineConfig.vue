<template>
  <div class="widget-config-section">
    <el-card shadow="never" class="widget-section-body item-card">
      <el-row :gutter="10">
        <el-col :span="22">
          <el-form-item label-width="120px" :label="$t('viewer.color')" class="color-picker-item">
            <el-color-picker v-model="localColor" size="mini" color-format="hex" :predefine="predefineColors" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="120px" :label="$t('viewer.smoothLines')">
            <el-switch v-model="localSmooth" />
          </el-form-item>
        </el-col>
        <el-col :span="2"></el-col>
        <el-col :span="22">
          <el-form-item label-width="120px" :label="$t('viewer.areaFill')">
            <el-switch v-model="localArea" />
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

@Component({})
export default class LineConfig extends Vue {
  @Prop({ type: Object, required: true }) readonly options!: LineWidgetOptions

  private localColor: string = '#00B572'
  private localSmooth: boolean = true
  private localArea: boolean = true

  // Add this flag to prevent circular updates
  private isUpdatingFromProps: boolean = false

  mounted() {
    this.syncFromProps()
  }
  @Watch('options', { deep: true }) onOptionsChange() {
    this.syncFromProps()
  }

  private syncFromProps() {
    // Set flag to prevent watchers from emitting during sync
    this.isUpdatingFromProps = true

    const o = this.options || {}
    this.localColor = o.color || '#00B572'
    this.localSmooth = o.smooth !== undefined ? o.smooth : true
    this.localArea = o.area !== undefined ? o.area : true

    // Reset flag after Vue's next tick to allow normal updates
    this.$nextTick(() => {
      this.isUpdatingFromProps = false
    })
  }

  @Watch('localColor') onLocalColor() {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localSmooth') onLocalSmooth() {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }
  @Watch('localArea') onLocalArea() {
    if (!this.isUpdatingFromProps) this.emitOptions()
  }

  get predefineColors(): string[] {
    return defineColors
  }

  private emitOptions() {
    const next: LineWidgetOptions = {
      ...this.options,
      color: this.localColor || '#00B572',
      smooth: this.localSmooth,
      area: this.localArea,
    }
    this.$emit('update:options', next)
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/scss/mixins';

@include color-picker-item;
</style>
