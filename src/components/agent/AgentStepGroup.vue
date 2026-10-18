<template>
  <div class="steps" :class="{ collapsed }">
    <button class="steps-head" type="button" :aria-expanded="String(!collapsed)" @click="toggle">
      <span class="st" :class="headState">
        <i v-if="headState === 'error'" class="el-icon-close"></i>
        <i v-else-if="headState === 'done'" class="el-icon-check"></i>
        <i v-else class="el-icon-loading"></i>
      </span>
      <span class="count">{{ headText }}</span>
      <span class="meta">{{ metaText }}</span>
      <i class="chev el-icon-arrow-down"></i>
    </button>
    <div v-show="!collapsed" class="step-list">
      <agent-step
        v-for="step in steps"
        :key="step.toolCallId"
        :part="step"
        :connection-names="connectionNames"
        @view="$emit('view', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { AgentMessagePart } from '@/types/agent'
import AgentStep from './AgentStep.vue'

type ToolPart = Extract<AgentMessagePart, { type: 'tool' }>

@Component({ components: { AgentStep } })
export default class AgentStepGroup extends Vue {
  @Prop({ required: true }) readonly steps!: ToolPart[]
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>

  private collapsed = false
  private userToggled = false

  get running(): boolean {
    return this.steps.some((step) => step.state === 'running' || step.state === 'awaiting-approval')
  }

  get errorCount(): number {
    return this.steps.filter((step) => step.state === 'error').length
  }

  get deniedCount(): number {
    return this.steps.filter((step) => step.state === 'denied').length
  }

  get headState(): string {
    if (this.running) return 'running'
    return this.errorCount > 0 || this.deniedCount > 0 ? 'error' : 'done'
  }

  get headText(): string {
    if (this.running) return this.$tc('agent.groupRunning', this.steps.length, { n: this.steps.length }) as string
    return this.$tc('agent.groupUsed', this.steps.length, { n: this.steps.length }) as string
  }

  get metaText(): string {
    const parts: string[] = []
    if (!this.running && this.errorCount) parts.push(this.$t('agent.groupFailed', { n: this.errorCount }) as string)
    if (!this.running && this.deniedCount) parts.push(this.$t('agent.groupDenied', { n: this.deniedCount }) as string)
    const elapsed = this.elapsed
    if (elapsed) parts.push(elapsed)
    return parts.join(' · ')
  }

  get elapsed(): string {
    const starts = this.steps.map((step) => step.startedAt).filter(Boolean) as number[]
    const ends = this.steps
      .map((step) => step.finishedAt ?? (this.running ? Date.now() : undefined))
      .filter(Boolean) as number[]
    if (!starts.length || !ends.length) return ''
    const seconds = (Math.max(...ends) - Math.min(...starts)) / 1000
    return seconds >= 0.1 ? `${seconds.toFixed(1)}s` : ''
  }

  private toggle() {
    this.userToggled = true
    this.collapsed = !this.collapsed
  }

  @Watch('running', { immediate: true })
  onRunningChange(value: boolean) {
    if (this.userToggled) return
    this.collapsed = !value
  }
}
</script>
