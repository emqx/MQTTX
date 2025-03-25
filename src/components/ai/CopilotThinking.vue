<template>
  <div v-if="reasoning" class="thinking-container">
    <div class="thinking-header" @click="toggleThinking" :class="{ 'is-updating': isUpdating }">
      <i :class="[isExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right']"></i>
      <span>{{ $t('copilot.showThinking') }}</span>
      <i v-if="isUpdating" class="el-icon-loading"></i>
    </div>
    <div v-show="isExpanded" class="thinking-content">
      <message-render :content="reasoning" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MessageRender from './MessageRender.vue'

@Component({
  components: {
    MessageRender,
  },
})
export default class CopilotThinking extends Vue {
  @Prop({ default: '' }) readonly reasoning!: string

  private isExpanded: boolean = false
  private isUpdating: boolean = false
  private updateTimeout: number | null = null
  private copyText = String(this.$t('common.copy'))
  private copyFailedText = String(this.$t('common.copyFailed'))
  private copiedText = String(this.$t('common.copied'))
  private lastReasoning = ''

  private toggleThinking(): void {
    this.isExpanded = !this.isExpanded
    this.$nextTick(() => {
      this.$emit('thinking-toggled', this.isExpanded)
    })
  }

  @Watch('reasoning')
  onReasoningChange() {
    this.isUpdating = true

    if (this.updateTimeout !== null) {
      window.clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = window.setTimeout(() => {
      if (this.reasoning === this.lastReasoning) {
        this.isUpdating = false
      }
    }, 1000)

    this.lastReasoning = this.reasoning

    if (this.isExpanded) {
      this.$nextTick(() => {
        const content = this.$el.querySelector('.thinking-content')
        if (content) {
          content.scrollTop = content.scrollHeight
        }
      })
    }
  }

  private formatReasoning(reasoning: string): string {
    if (!reasoning) return ''
    return reasoning
  }

  beforeDestroy() {
    if (this.updateTimeout !== null) {
      window.clearTimeout(this.updateTimeout)
    }
  }
}
</script>

<style lang="scss">
.thinking-container {
  margin: 12px 0;

  .thinking-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--color-text-tips);
    margin-bottom: 8px;
    font-size: 14px;
    position: relative;
    transition: color 0.3s ease;
    &.is-updating {
      i.el-icon-loading {
        margin-left: 12px;
      }
    }
    i {
      margin-right: 6px;
    }
  }

  .thinking-content {
    padding: 0 16px;
    background-color: var(--color-bg-primary);
    border-radius: 8px;
    overflow-x: scroll;
    max-height: 320px;
    overflow-y: auto;
    font-size: 12px;
    font-style: italic;
    color: var(--color-text-tips);
    line-height: 1.5;
  }
}
</style>
