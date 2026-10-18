<template>
  <details v-if="reasoning" class="reasoning" :open="isStreaming">
    <summary>
      <i class="el-icon-arrow-right"></i>
      <span v-if="isStreaming">{{ $t('agent.thinking') }}</span>
      <span v-else-if="hasDuration">{{ $t('agent.thoughtFor', { s: durationSeconds }) }}</span>
      <span v-else>{{ $t('agent.thought') }}</span>
    </summary>
    <div ref="body" class="reasoning-body">{{ reasoning }}</div>
  </details>
  <span v-else class="thinking shimmer">{{ $t('agent.thinking') }}</span>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component
export default class AgentThinking extends Vue {
  @Prop({ default: '' }) readonly reasoning!: string
  @Prop({ default: false }) readonly isStreaming!: boolean
  // Times recorded on the reasoning part while it streamed; legacy reasoning has none
  @Prop({ default: null }) readonly startedAt!: number | null
  @Prop({ default: null }) readonly finishedAt!: number | null

  get hasDuration(): boolean {
    return typeof this.startedAt === 'number' && typeof this.finishedAt === 'number'
  }

  get durationSeconds(): number {
    if (!this.hasDuration) return 0
    return Math.max(1, Math.round((this.finishedAt! - this.startedAt!) / 1000))
  }

  @Watch('reasoning')
  onReasoningChange() {
    if (!this.isStreaming) return
    this.$nextTick(() => this.scrollToLatest())
  }

  /** Follow the latest thinking unless the user scrolled up inside the block */
  private scrollToLatest() {
    const body = this.$refs.body as HTMLElement | undefined
    if (!body) return
    if (body.scrollHeight - body.scrollTop - body.clientHeight < 24) {
      body.scrollTop = body.scrollHeight
    }
  }
}
</script>
