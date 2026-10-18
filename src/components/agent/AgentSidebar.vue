<template>
  <aside class="history">
    <div class="history-topbar">
      <h1 class="history-title">{{ $t('agent.chats') }}</h1>
      <button
        class="history-new"
        type="button"
        :title="$t('agent.newChat')"
        :aria-label="$t('agent.newChat')"
        @click="$emit('new-chat')"
      >
        <i class="iconfont icon-create-new"></i>
      </button>
    </div>
    <div class="history-list">
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
            <span class="conv-name" :title="conversation.title || $t('agent.untitled')">{{
              conversation.title || $t('agent.untitled')
            }}</span>
            <span class="conv-tail">
              <i v-if="conversation.id === runningId" class="live"></i>
              <template v-else>
                <span class="conv-time">{{ formatTime(conversation.updateAt) }}</span>
                <el-dropdown
                  class="conv-actions"
                  trigger="click"
                  @command="onCommand(conversation.id, $event)"
                  @click.native.stop
                >
                  <button class="more" type="button" :aria-label="$t('agent.conversationMenu')" @click.stop>
                    <i class="iconfont icon-more"></i>
                  </button>
                  <el-dropdown-menu class="agent-conv-menu" slot="dropdown">
                    <el-dropdown-item command="rename">
                      <i class="iconfont icon-edit"></i>{{ $t('agent.rename') }}
                    </el-dropdown-item>
                    <el-dropdown-item class="delete-item" command="delete">
                      <i class="iconfont icon-delete"></i>{{ $t('agent.delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </template>
            </span>
          </div>
        </template>
      </template>
    </div>
  </aside>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { formatConversationTime } from '@/utils/ai/agent/conversationTime'

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

  private formatTime(value: string | number | Date): string {
    return formatConversationTime(this.toTime(value, Date.now()))
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

<style lang="scss">
@import '@/assets/scss/mixins.scss';

/* Same dropdown look as the connection menus (icon spacing, red delete item) */
@include el-dropdown-menu-common;
</style>
