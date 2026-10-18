<template>
  <header class="agent-header">
    <div class="title">
      <button
        v-if="mode === 'full'"
        class="icon-btn"
        :data-tip="sidebarCollapsed ? $t('agent.showSidebar') : $t('agent.hideSidebar')"
        :aria-label="sidebarCollapsed ? $t('agent.showSidebar') : $t('agent.hideSidebar')"
        @click="$emit('toggle-sidebar')"
      >
        <i :class="sidebarCollapsed ? 'iconfont icon-show-connections' : 'iconfont icon-hide-connections'"></i>
      </button>
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
        v-if="mode === 'float'"
        class="icon-btn"
        :data-tip="$t('agent.history')"
        :aria-label="$t('agent.history')"
        @click.stop="$emit('history')"
      >
        <i class="el-icon-time"></i>
      </button>
      <button
        v-if="mode === 'float' || sidebarCollapsed"
        class="icon-btn"
        :data-tip="$t('agent.newChat')"
        :aria-label="$t('agent.newChat')"
        @click="$emit('new-chat')"
      >
        <i class="el-icon-chat-dot-square"></i>
      </button>
      <button
        class="icon-btn"
        :data-tip="mode === 'full' ? $t('agent.exitFullScreen') : $t('agent.fullScreen')"
        :aria-label="mode === 'full' ? $t('agent.exitFullScreen') : $t('agent.fullScreen')"
        @click="$emit('toggle-full')"
      >
        <i class="el-icon-full-screen"></i>
      </button>
      <button class="icon-btn" :data-tip="$t('agent.close')" :aria-label="$t('agent.close')" @click="$emit('close')">
        <i class="el-icon-close"></i>
      </button>
    </div>
  </header>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class AgentHeader extends Vue {
  @Prop({ default: 'float' }) readonly mode!: 'float' | 'full'
  @Prop({ default: '' }) readonly conversationTitle!: string
  @Prop({ default: false }) readonly sidebarCollapsed!: boolean
}
</script>
