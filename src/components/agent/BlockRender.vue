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
    <i class="el-icon-video-pause"></i>
    {{ $t('agent.pausedAfterSteps', { n: block.steps }) }}
    <button class="btn" @click="$emit('continue')">{{ $t('agent.continue') }}</button>
  </div>
  <agent-thinking
    v-else-if="block.kind === 'reasoning'"
    :reasoning="block.part.text"
    :is-streaming="block.streaming"
    :started-at="block.part.startedAt"
    :finished-at="block.part.finishedAt"
  />
  <agent-file-card v-else-if="block.kind === 'file'" :part="block.part" />
  <message-render
    v-else
    :content="block.content"
    :copy-text="$t('common.copy')"
    :copy-failed-text="$t('common.copyFailed')"
    :copied-text="$t('common.copied')"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import AgentStepGroup from './AgentStepGroup.vue'
import AgentApprovalCard from './AgentApprovalCard.vue'
import AgentThinking from './AgentThinking.vue'
import AgentFileCard from './AgentFileCard.vue'
import MessageRender from './MessageRender.vue'

@Component({ components: { AgentStepGroup, AgentApprovalCard, AgentThinking, AgentFileCard, MessageRender } })
export default class BlockRender extends Vue {
  @Prop({ required: true }) readonly block!: any
  @Prop({ default: () => ({}) }) readonly connectionNames!: Record<string, string>
}
</script>
