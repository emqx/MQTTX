<template>
  <div class="step" :class="[part.state, { open: expanded }]">
    <button class="step-row" type="button" :aria-expanded="String(expanded)" @click="expanded = !expanded">
      <span class="st" :class="part.state">
        <i v-if="part.state === 'done'" class="el-icon-check"></i>
        <i v-else-if="part.state === 'error'" class="el-icon-close"></i>
        <i v-else-if="part.state === 'denied'" class="el-icon-circle-close"></i>
        <i v-else class="el-icon-loading"></i>
      </span>
      <span class="label" v-html="label"></span>
      <a v-if="viewConnectionId" class="view" href="javascript:;" @click.stop="$emit('view', viewConnectionId)">{{
        $t('agent.view')
      }}</a>
      <span v-if="duration" class="dur">{{ duration }}</span>
    </button>
    <div class="step-detail">
      <div class="kv">{{ $t('agent.input') }}</div>
      <pre class="code">{{ format(part.input) }}</pre>
      <template v-if="part.state === 'done'">
        <div class="kv">{{ $t('agent.result') }}</div>
        <pre class="code">{{ format(part.output) }}</pre>
      </template>
      <template v-if="part.state === 'error'">
        <div class="kv">{{ $t('agent.error') }}</div>
        <pre class="code err">{{ part.error }}</pre>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { AgentMessagePart } from '@/types/agent'
import { escapeHtml } from '@/utils/highlightSearch'

const CONNECTION_TOOLS = new Set([
  'get_connection',
  'update_connection',
  'connect',
  'disconnect',
  'open_connection',
  'subscribe',
])

@Component
export default class AgentStep extends Vue {
  @Prop({ required: true }) readonly part!: Extract<AgentMessagePart, { type: 'tool' }>
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>

  private expanded = false

  created() {
    // A failed step is expanded so the reason is visible without a click
    this.expanded = this.part.state === 'error'
  }

  get duration(): string {
    if (!this.part.finishedAt || !this.part.startedAt) return ''
    return `${((this.part.finishedAt - this.part.startedAt) / 1000).toFixed(1)}s`
  }

  get connectionName(): string {
    const id = (this.part.input as { connectionId?: string } | undefined)?.connectionId
    if (!id) return ''
    return this.connectionNames[id] || id.slice(0, 8)
  }

  get viewConnectionId(): string {
    const id = (this.part.input as { connectionId?: string } | undefined)?.connectionId
    if (!id) return ''
    return CONNECTION_TOOLS.has(this.part.toolName) ? id : ''
  }

  get label(): string {
    const input = (this.part.input ?? {}) as Record<string, string>
    const suffix = this.part.state === 'denied' ? ` — ${this.$t('agent.denied')}` : ''
    // Only a finished step reads in the past tense; running, waiting, denied and failed steps did not complete
    const tense = this.part.state === 'done' ? 'done' : 'running'
    let text: string

    if (this.part.toolName.includes('__')) {
      const [server, tool] = this.part.toolName.split('__')
      text = this.$t(`agent.tools.mcp.${tense}`, {
        server,
        tool,
      }) as string
    } else {
      const key = `agent.tools.${this.part.toolName}.${tense}`
      text = this.$t(key, {
        connection: this.connectionName,
        topic: input.topic ?? '',
        name: input.name ?? '',
        skill: input.skill ?? '',
        file: input.path ? this.baseName(input.path) : '',
        title: input.title ?? '',
      }) as string
    }

    // Escape the raw values, then render the ones the label shows as code/light text
    const escaped = escapeHtml(text)
    const withTopic = input.topic
      ? escaped.replace(escapeHtml(input.topic), `<code>${escapeHtml(input.topic)}</code>`)
      : escaped
    const withName = input.name
      ? withTopic.replace(escapeHtml(input.name), `<strong>${escapeHtml(input.name)}</strong>`)
      : withTopic
    const withTitle = input.title
      ? withName.replace(escapeHtml(input.title), `<strong>${escapeHtml(input.title)}</strong>`)
      : withName
    const showsConnectionSuffix = ['subscribe', 'unsubscribe', 'publish'].includes(this.part.toolName)
    const withConnection =
      showsConnectionSuffix && this.connectionName
        ? `${withTitle} <span class="conn">· ${escapeHtml(this.connectionName)}</span>`
        : withTitle
    return withConnection + suffix
  }

  private baseName(value: string): string {
    return value.split(/[\\/]/).pop() ?? value
  }

  private format(value: unknown): string {
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
  }
}
</script>
