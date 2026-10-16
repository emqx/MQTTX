<template>
  <header class="agent-header">
    <div class="title">
      <strong>MQTTX Agent</strong>
      <span
        v-if="mode === 'full' && conversationTitle"
        class="conv-title"
        :title="conversationTitle"
        @dblclick="$emit('rename')"
        >{{ conversationTitle }}</span
      >
    </div>
    <div class="actions">
      <button
        v-if="mode === 'side'"
        class="icon-btn"
        :data-tip="$t('agent.history')"
        :aria-label="$t('agent.history')"
        @click="$emit('history')"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        </svg>
      </button>
      <button
        v-if="mode === 'side'"
        class="icon-btn"
        :data-tip="$t('agent.newChat')"
        :aria-label="$t('agent.newChat')"
        @click="$emit('new-chat')"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </button>
      <button
        class="icon-btn"
        :data-tip="mode === 'full' ? $t('agent.exitFullScreen') : $t('agent.fullScreen')"
        :aria-label="mode === 'full' ? $t('agent.exitFullScreen') : $t('agent.fullScreen')"
        @click="$emit('toggle-full')"
      >
        <svg
          v-if="mode === 'side'"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        </svg>
      </button>
      <button class="icon-btn" :data-tip="$t('agent.close')" :aria-label="$t('agent.close')" @click="$emit('close')">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class AgentHeader extends Vue {
  @Prop({ default: 'side' }) readonly mode!: 'side' | 'full'
  @Prop({ default: '' }) readonly conversationTitle!: string
}
</script>
