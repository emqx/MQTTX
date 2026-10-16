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
      <span class="ico">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <div class="text" v-html="headline"></div>
    </div>
    <div class="approval-body">
      <div v-if="meta.length" class="meta">
        <span v-for="item in meta" :key="item.label"
          >{{ item.label }} <b>{{ item.value }}</b></span
        >
      </div>
      <pre v-if="payloadPreview" class="code">{{ payloadPreview }}</pre>
    </div>
    <div class="approval-actions">
      <button class="btn primary" @click="decide('once')">
        {{ $t('agent.approval.allowOnce') }} <span class="kbd">↵</span>
      </button>
      <button class="btn" @click="decide('always')">{{ $t('agent.approval.alwaysAllow', { action: action }) }}</button>
      <button class="btn ghost-danger" @click="decide('deny')">
        {{ $t('agent.approval.deny') }} <span class="kbd">Esc</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { AgentMessagePart } from '@/types/agent'
import { ApprovalDecision } from '@/utils/ai/agent/approval'
import { MASKED } from '@/utils/ai/agent/tools/helpers'

const HEADLINE_FIELDS = new Set(['connectionId', 'topic', 'name'])
const SECRET_FIELD = /password|secret|token|apikey|^key$|^cert$|^ca$/i
const PREVIEW_LIMIT = 600

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
    return this.$t(`agent.approvalAction.${this.part.toolName}`) as string
  }

  get headline(): string {
    const params = {
      topic: this.esc(this.input.topic ?? ''),
      connection: this.esc(this.connectionName),
      name: this.esc(this.input.name ?? ''),
      server: this.esc(this.part.toolName.split('__')[0] ?? ''),
      tool: this.esc(this.part.toolName.split('__')[1] ?? this.part.toolName),
    }
    if (this.part.toolName.includes('__')) {
      return this.$t('agent.approval.mcp', params) as string
    }
    return this.$t(`agent.approval.${this.part.toolName}`, params) as string
  }

  get meta(): { label: string; value: string }[] {
    if (this.part.toolName !== 'publish') return []
    return [
      { label: this.$t('agent.approvalQos') as string, value: String(this.input.qos ?? 0) },
      { label: this.$t('agent.approvalRetain') as string, value: String(this.input.retain ?? false) },
      { label: this.$t('agent.approvalFormat') as string, value: String(this.input.payloadType ?? 'Plaintext') },
    ]
  }

  get payloadPreview(): string {
    if (this.part.toolName === 'publish') {
      const payload = this.input.payload
      return typeof payload === 'string' ? payload.slice(0, 200) : ''
    }
    // Other tools show the input the headline leaves out, with secrets masked
    const detail = Object.entries(this.input).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (HEADLINE_FIELDS.has(key) || value === undefined) return acc
      acc[key] = SECRET_FIELD.test(key) && value ? MASKED : value
      return acc
    }, {})
    if (!Object.keys(detail).length) return ''
    const text = JSON.stringify(detail, null, 2)
    return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text
  }

  private decide(decision: ApprovalDecision) {
    this.$emit('decide', decision)
  }

  private esc(value: string): string {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
</script>
