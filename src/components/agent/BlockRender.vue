<template>
  <agent-step-group
    v-if="block.kind === 'steps'"
    :steps="block.steps"
    :connection-names="connectionNames"
    @view="$emit('view', $event)"
  />
  <agent-approval-card
    v-else-if="block.kind === 'approval'"
    :part="block.part"
    :connection-names="connectionNames"
    @decide="$emit('approve', { toolCallId: block.part.toolCallId, decision: $event })"
  />
  <div v-else-if="block.kind === 'stepLimit'" class="notice">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </svg>
    {{ $t('agent.pausedAfterSteps', { n: block.steps }) }}
    <button class="btn" @click="$emit('continue')">{{ $t('agent.continue') }}</button>
  </div>
  <message-render
    v-else
    :content="block.content"
    :parts="null"
    :copy-text="$t('common.copy')"
    :copy-failed-text="$t('common.copyFailed')"
    :copied-text="$t('common.copied')"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import AgentStepGroup from './AgentStepGroup.vue'
import AgentApprovalCard from './AgentApprovalCard.vue'
import MessageRender from './MessageRender.vue'

@Component({ components: { AgentStepGroup, AgentApprovalCard, MessageRender } })
export default class BlockRender extends Vue {
  @Prop({ required: true }) readonly block!: any
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>
}
</script>
