<template>
  <div class="mcp-call-block">
    <div class="mcp-call-header" @click="toggleExpanded">
      <i class="el-icon-loading"></i>
      <span>{{ $t('copilot.mcpCalling') }}</span>
      <span class="server-name" v-if="serverName">{{ serverName }}</span>
      <span class="separator" v-if="serverName && toolName"> - </span>
      <span class="tool-name" v-if="toolName">{{ toolName }}</span>
      <i :class="expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="expand-icon"></i>
    </div>
    <div class="mcp-call-content" v-if="expanded">
      <pre><code>{{ content }}</code></pre>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class MCPCallCard extends Vue {
  @Prop({ required: true }) readonly content!: string

  private expanded = false

  get serverName(): string {
    try {
      const serverMatch = this.content.match(/"server"\s*:\s*"([^"]+)"/)
      return serverMatch ? serverMatch[1] : ''
    } catch (error) {
      console.error('Failed to extract server name:', error)
      return ''
    }
  }

  get toolName(): string {
    try {
      const toolMatch = this.content.match(/"tool"\s*:\s*"([^"]+)"/)
      return toolMatch ? toolMatch[1] : ''
    } catch (error) {
      console.error('Failed to extract tool name:', error)
      return ''
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded
  }
}
</script>

<style lang="scss">
.mcp-call-block {
  background-color: var(--color-bg-primary);
  border-radius: 8px;
  padding: 0;
  margin: 12px 0;
  border: 1px solid var(--color-border-default);

  .mcp-call-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    i {
      margin-right: 8px;
      color: var(--color-text-light);
      font-size: 14px;

      &.expand-icon {
        margin-right: 0;
        margin-left: auto;
      }
    }

    span {
      font-size: 14px;
      color: var(--color-text-light);

      &.server-name {
        margin-left: 5px;
      }

      &.separator {
        margin: 0 6px;
      }
    }
  }

  .mcp-call-content {
    padding: 0 16px 16px;
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      background-color: transparent;
      padding: 0 !important;
      border-radius: 0;
      font-size: 14px;
      color: var(--color-text-default);
    }
    code {
      font-family: Menlo, Monaco, 'Courier New', monospace;
      background-color: transparent;
    }
  }
}
</style>
