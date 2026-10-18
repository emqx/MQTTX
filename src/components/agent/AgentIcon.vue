<template>
  <!-- A dot and a folded chevron: the Agent taking the next step. The upper arm folds over the lower one -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke-linecap="round">
    <defs v-if="colored">
      <linearGradient :id="`${uid}-upper`" x1="11.4" y1="4.1" x2="19.3" y2="12" gradientUnits="userSpaceOnUse">
        <stop stop-color="#48e190" />
        <stop offset="1" stop-color="#2ed79f" />
      </linearGradient>
      <linearGradient :id="`${uid}-lower`" x1="19.3" y1="12" x2="11.4" y2="19.9" gradientUnits="userSpaceOnUse">
        <stop stop-color="#03bba6" />
        <stop offset="1" stop-color="#02a6b6" />
      </linearGradient>
      <linearGradient :id="`${uid}-dot`" x1="5.6" y1="8.7" x2="5.6" y2="15.3" gradientUnits="userSpaceOnUse">
        <stop stop-color="#45de92" />
        <stop offset="1" stop-color="#04a99e" />
      </linearGradient>
    </defs>
    <path d="M19.3 12l-7.9 7.9" stroke-width="5.4" :stroke="paint('lower')" :stroke-opacity="colored ? 1 : 0.55" />
    <path d="M11.4 4.1l7.9 7.9" stroke-width="5.4" :stroke="paint('upper')" />
    <circle cx="5.6" cy="12" r="3.3" :fill="paint('dot')" />
  </svg>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class AgentIcon extends Vue {
  @Prop({ default: 14 }) readonly size!: number
  // Brand gradient; otherwise the icon follows currentColor like the other UI icons
  @Prop({ default: false }) readonly colored!: boolean

  // Gradient ids must be unique per instance: a url(#id) pointing into a hidden svg renders nothing
  private uid = `agent-icon-${(this as any)._uid}`

  private paint(part: 'upper' | 'lower' | 'dot'): string {
    return this.colored ? `url(#${this.uid}-${part})` : 'currentColor'
  }
}
</script>
