<template>
  <aside class="history">
    <button class="new-chat" @click="$emit('new-chat')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {{ $t('agent.newChat') }}
    </button>
    <template v-for="group in groups">
      <template v-if="group.items.length">
        <div class="group-title" :key="group.key">{{ $t(group.labelKey) }}</div>
        <div
          v-for="conversation in group.items"
          :key="conversation.id"
          class="conv"
          :class="{ active: conversation.id === activeId }"
          @click="$emit('select', conversation.id)"
        >
          <span :title="conversation.title || $t('agent.untitled')">{{
            conversation.title || $t('agent.untitled')
          }}</span>
          <i v-if="conversation.id === runningId" class="live"></i>
          <el-dropdown v-else trigger="click" @command="onCommand(conversation.id, $event)" @click.native.stop>
            <button class="more" :aria-label="$t('agent.conversationMenu')" @click.stop>···</button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="rename">{{ $t('agent.rename') }}</el-dropdown-item>
              <el-dropdown-item command="delete">{{ $t('agent.delete') }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </template>
    </template>
  </aside>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

type ConversationLike = { id: string; title: string; updateAt: string | number | Date }

@Component
export default class AgentSidebar extends Vue {
  @Prop({ default: () => [] }) readonly conversations!: ConversationLike[]
  @Prop({ default: null }) readonly activeId!: string | null
  @Prop({ default: null }) readonly runningId!: string | null

  private onCommand(id: string, command: string) {
    if (command === 'rename') this.$emit('rename', id)
    if (command === 'delete') this.$emit('delete', id)
  }

  get groups() {
    const now = Date.now()
    const startOfToday = new Date().setHours(0, 0, 0, 0)
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
    const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000
    const buckets = [
      { key: 'today', labelKey: 'agent.today', items: [] as ConversationLike[] },
      { key: 'yesterday', labelKey: 'agent.yesterday', items: [] as ConversationLike[] },
      { key: 'week', labelKey: 'agent.previous7Days', items: [] as ConversationLike[] },
      { key: 'older', labelKey: 'agent.older', items: [] as ConversationLike[] },
    ]
    for (const conversation of this.conversations) {
      const time = this.toTime(conversation.updateAt, now)
      if (time >= startOfToday) buckets[0].items.push(conversation)
      else if (time >= startOfYesterday) buckets[1].items.push(conversation)
      else if (time >= sevenDaysAgo) buckets[2].items.push(conversation)
      else buckets[3].items.push(conversation)
    }
    return buckets
  }

  private toTime(value: string | number | Date, fallback: number): number {
    if (value instanceof Date) return value.getTime()
    if (typeof value === 'number') return value
    const parsed = new Date(String(value).replace(' ', 'T')).getTime()
    return Number.isNaN(parsed) ? fallback : parsed
  }
}
</script>
