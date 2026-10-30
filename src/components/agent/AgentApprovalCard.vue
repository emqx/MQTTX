<template>
  <div
    ref="card"
    class="approval"
    role="alertdialog"
    tabindex="0"
    @keydown.enter.prevent="decide('once')"
    @keydown.esc.prevent="decide('deny')"
  >
    <div class="approval-head">
      <i class="dot"></i>
      <div class="text" v-html="headline"></div>
    </div>
    <div v-if="meta.length" class="approval-meta">
      <span v-for="item in meta" :key="item.label">{{ item.label }} {{ item.value }}</span>
    </div>
    <pre v-if="payloadPreview" class="code">{{ payloadPreview }}</pre>
    <div class="approval-actions">
      <button class="btn text" title="Esc" @click="decide('deny')">{{ $t('agent.approval.deny') }}</button>
      <button
        v-if="!isAlwaysAsk"
        class="btn"
        :title="$t('agent.approval.alwaysAllowTip', { action })"
        @click="decide('always')"
      >
        {{ $t('agent.approval.alwaysAllow') }}
      </button>
      <button class="btn primary" @click="decide('once')">
        {{ $t('agent.approval.allowOnce') }} <span class="kbd">↵</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { AgentMessagePart } from '@/types/agent'
import { ApprovalDecision } from '@/utils/ai/agent/approval'
import { MASKED } from '@/utils/ai/agent/tools/helpers'
import { escapeHtml } from '@/utils/highlightSearch'
import { AGENT_ALWAYS_ASK_TOOLS } from '@/utils/ai/agent/tools'
import { parseMCPToolName } from '@/utils/ai/mcp/MCPUtils'

const HEADLINE_FIELDS = new Set(['connectionId', 'topic', 'name'])
const SECRET_FIELD = /password|secret|token|apikey|^key$|^cert$|^ca$/i
const PREVIEW_LIMIT = 600

/** Masks secret keys at any depth, so a nested `changes.password` is hidden as well as a top-level one */
const maskSecrets = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(maskSecrets)
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nested]) => {
    acc[key] = SECRET_FIELD.test(key) && nested ? MASKED : maskSecrets(nested)
    return acc
  }, {})
}

@Component
export default class AgentApprovalCard extends Vue {
  @Prop({ required: true }) readonly part!: Extract<AgentMessagePart, { type: 'tool' }>
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>

  mounted() {
    ;(this.$refs.card as HTMLElement)?.focus()
  }

  get input(): Record<string, any> {
    return (this.part.input ?? {}) as Record<string, any>
  }

  get connectionName(): string {
    const id = this.input.connectionId as string | undefined
    if (!id) return ''
    return this.connectionNames[id] || id.slice(0, 8)
  }

  get action(): string {
    const key = `agent.approvalAction.${this.part.toolName}`
    const translated = this.$t(key) as string
    return translated === key ? (this.$t('agent.approvalAction.generic') as string) : translated
  }

  /** Tools that must never run unattended cannot be remembered, so they hide "always allow" */
  get isAlwaysAsk(): boolean {
    return AGENT_ALWAYS_ASK_TOOLS.has(this.part.toolName)
  }

  get headline(): string {
    const mcpName = parseMCPToolName(this.part.toolName)
    const params = {
      topic: escapeHtml(this.input.topic ?? ''),
      connection: escapeHtml(this.connectionName),
      name: escapeHtml(this.input.name ?? ''),
      server: escapeHtml(mcpName?.server ?? ''),
      tool: escapeHtml(mcpName?.tool ?? this.part.toolName),
    }
    if (mcpName) {
      return this.$t('agent.approval.mcp', params) as string
    }
    const key = `agent.approval.${this.part.toolName}`
    const translated = this.$t(key, params) as string
    return translated === key
      ? (this.$t('agent.approval.generic', { tool: escapeHtml(this.part.toolName) }) as string)
      : translated
  }

  get meta(): { label: string; value: string }[] {
    if (this.part.toolName !== 'publish') return []
    const items = [
      { label: this.$t('agent.approvalQos') as string, value: String(this.input.qos ?? 0) },
      { label: this.$t('agent.approvalRetain') as string, value: String(this.input.retain ?? false) },
      { label: this.$t('agent.approvalFormat') as string, value: String(this.input.payloadType ?? 'Plaintext') },
    ]
    // A publish with an interval repeats until it is stopped, which the user must see before allowing it
    if (this.input.intervalSeconds !== undefined) {
      items.push({ label: this.$t('agent.approvalInterval') as string, value: `${this.input.intervalSeconds}s` })
    }
    return items
  }

  get payloadPreview(): string {
    if (this.part.toolName === 'publish') {
      const payload = this.input.payload
      return typeof payload === 'string' ? payload.slice(0, 200) : ''
    }
    // The user must see the whole script before it runs, so it is never truncated.
    // A script tool called by id has no script to show and falls through to the generic preview.
    if (
      (this.part.toolName === 'test_script' || this.part.toolName === 'save_script') &&
      typeof this.input.script === 'string'
    ) {
      return this.input.script
    }
    // Other tools show the input the headline leaves out, with secrets masked
    const visible = Object.entries(this.input).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (!HEADLINE_FIELDS.has(key) && value !== undefined) acc[key] = value
      return acc
    }, {})
    const detail = maskSecrets(visible) as Record<string, unknown>
    if (!Object.keys(detail).length) return ''
    const text = JSON.stringify(detail, null, 2)
    return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text
  }

  private decide(decision: ApprovalDecision) {
    this.$emit('decide', decision)
  }
}
</script>
