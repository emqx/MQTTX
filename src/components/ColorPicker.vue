<template>
  <el-popover placement="bottom" width="240" trigger="click" v-model="visible" popper-class="color-picker-no-padding">
    <div class="color-picker-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Colors" name="colors" class="color-picker-tab">
          <div v-for="(palette, index) in palettes" :key="index" class="color-row">
            <span class="color-name">{{ palette.name }}</span>
            <div class="shades">
              <div
                v-for="(color, i) in palette.shades"
                :key="i"
                class="circle"
                :style="{
                  backgroundColor: color,
                  width: sizes[i] + 'px',
                  height: sizes[i] + 'px',
                  '--hover-color': color,
                }"
                @click="selectColor(color)"
              ></div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Custom" name="custom" class="color-picker-tab">
          <el-color-picker v-model="localColor" @change="selectColor"></el-color-picker>
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-button slot="reference" class="color-button" type="default" :size="size">
      <div class="color-circle" :style="{ backgroundColor: value || '#ffffff' }"></div>
      <span class="color-text">{{ title }}</span>
    </el-button>
  </el-popover>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class ColorPicker extends Vue {
  @Prop({ type: String }) readonly value!: string
  @Prop({
    type: String,
    default: 'mini',
    validator: (val: string) => ['medium', 'small', 'mini'].includes(val),
  })
  readonly size!: string
  @Prop({ type: String, default: 'Color' }) readonly title!: string

  private visible: boolean = false
  private activeTab: string = 'colors'
  private localColor: string = this.value
  private sizes: number[] = [12, 18, 24, 18, 12]

  // MQTTX color palettes, matching @base.scss and @connections.scss
  // Darker/main color is at the center
  private palettes = [
    { name: 'Red', shades: ['#FFF1F0', '#FFA39E', '#FF7875', '#FF4D4F', '#F5222D'] },
    { name: 'Orange', shades: ['#FFF7E6', '#FFD591', '#FFC069', '#FFA940', '#FA8C16'] },
    { name: 'Yellow', shades: ['#FEFFE6', '#FFFB8F', '#FFF566', '#FFEC3D', '#FADB14'] },
    { name: 'Green', shades: ['#F6FFED', '#B7EB8F', '#73D13D', '#52C41A', '#00B572'] },
    { name: 'Blue', shades: ['#E6F7FF', '#91D5FF', '#69C0FF', '#40A9FF', '#1890FF'] },
    { name: 'Purple', shades: ['#F9F0FF', '#D3ADF7', '#B37FEB', '#9254DE', '#722ED1'] },
  ]

  @Watch('value')
  private onValueChange(val: string) {
    this.localColor = val
  }

  private selectColor(color: string) {
    this.localColor = color
    this.$emit('input', color)
    this.$emit('change', color)
    this.visible = false
  }
}
</script>

<style scoped>
.color-picker-card {
  background: var(--color-bg-default);
  border-radius: 4px;
}

.color-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.color-name {
  width: 60px;
  color: var(--color-text-default);
  font-size: 14px;
}

.shades {
  display: flex;
  align-items: center;
}

.circle {
  border-radius: 50%;
  margin: 0 5px;
  cursor: pointer;

  &:hover {
    outline: 2px solid var(--hover-color);
    outline-offset: 2px;
  }
}

.el-button.color-button.el-button--default,
.el-button.color-button.el-button--default.el-button--mini,
.el-button.color-button.el-button--default.el-button--small,
.el-button.color-button.el-button--default.el-button--medium {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--color-bg-normal);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  cursor: pointer;
}

.el-button.color-button.el-button--default.el-button--mini {
  span {
    display: flex;
    align-items: center;
  }
}

.color-circle {
  border-radius: 50%;
  border: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.el-button--mini .color-circle {
  width: 12px;
  height: 12px;
  margin-right: 6px;
}

.el-button--small .color-circle {
  width: 14px;
  height: 14px;
  margin-right: 8px;
}

.el-button--medium .color-circle {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.color-text {
  color: var(--color-text-default);
  flex-shrink: 0;
}

.el-button--mini .color-text {
  font-size: 12px;
}

.el-button--small .color-text {
  font-size: 12px;
}

.el-button--medium .color-text {
  font-size: 14px;
}

:deep(.color-picker-no-padding) {
  padding: 0 0 0 0 !important;
}

.color-picker-tab {
  padding: 10px;
}
</style>
