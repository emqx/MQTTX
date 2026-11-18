<template>
  <i v-if="iconClass" :class="iconClass" :style="{ fontSize: `${size}px`, lineHeight: 1 }" aria-hidden="true"></i>
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'layers'">
      <path
        d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
      />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </template>
    <template v-else>
      <path
        d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      />
    </template>
  </svg>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

export type CloudIconName = 'zap' | 'plus' | 'globe' | 'layers' | 'info' | 'external'

const icons: Partial<Record<CloudIconName, string>> = {
  plus: 'el-icon-plus',
  info: 'iconfont icon-about',
  globe: 'iconfont icon-language',
  external: 'el-icon-top-right',
}

@Component
export default class CloudIcon extends Vue {
  @Prop({ required: true }) readonly name!: CloudIconName
  @Prop({ default: 16 }) readonly size!: number

  private get iconClass(): string | undefined {
    return icons[this.name]
  }
}
</script>
