<template>
  <details v-if="reasoning" class="reasoning" :open="isStreaming">
    <summary>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
      <span v-if="isStreaming">{{ $t('agent.thinking') }}</span>
      <span v-else>{{ $t('agent.thoughtFor', { s: durationSeconds }) }}</span>
    </summary>
    <div class="reasoning-body">{{ reasoning }}</div>
  </details>
  <span v-else class="thinking shimmer">{{ $t('agent.thinking') }}</span>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class AgentThinking extends Vue {
  @Prop({ default: '' }) readonly reasoning!: string
  @Prop({ default: false }) readonly isStreaming!: boolean

  private startedAt: number | null = null
  private finishedAt: number | null = null

  get durationSeconds(): number {
    if (!this.startedAt) return 0
    const end = this.finishedAt ?? Date.now()
    return Math.max(1, Math.round((end - this.startedAt) / 1000))
  }

  @Watch('reasoning', { immediate: true })
  onReasoningChange(value: string) {
    if (value && !this.startedAt) {
      this.startedAt = Date.now()
    }
  }

  @Watch('isStreaming')
  onStreamingChange(value: boolean) {
    if (!value) {
      this.finishedAt = Date.now()
    }
  }
}
</script>
