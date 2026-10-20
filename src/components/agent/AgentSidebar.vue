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
            :class="{
              active: conversation.id === activeId,
              'menu-open': menuVisible && menuTargetId === conversation.id,
            }"
            @click="$emit('select', conversation.id)"
            @contextmenu.prevent="openMenuAt(conversation.id, $event)"
          >
            <span class="conv-name" :title="conversation.title || $t('agent.untitled')">{{
              conversation.title || $t('agent.untitled')
            }}</span>
            <span class="conv-tail">
              <i v-if="conversation.id === runningId" class="live el-icon-loading"></i>
              <template v-else>
                <span class="conv-time">{{ formatTime(conversation.updateAt) }}</span>
                <button
                  class="conv-actions more"
                  type="button"
                  :aria-label="$t('agent.conversationMenu')"
                  @click.stop="openMenuFromButton(conversation.id, $event)"
                >
                  <i class="iconfont icon-more"></i>
                </button>
              </template>
            </span>
          </div>
        </template>
      </template>
    </div>
    <contextmenu :visible.sync="menuVisible" v-bind="menuConfig">
      <a href="javascript:;" class="context-menu__item" @click="choose('rename')">
        <i class="iconfont icon-edit"></i>{{ $t('agent.rename') }}
      </a>
      <a href="javascript:;" class="context-menu__item danger" @click="choose('delete')">
        <i class="iconfont icon-delete"></i>{{ $t('agent.delete') }}
      </a>
    </contextmenu>
  </aside>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import Contextmenu from '@/components/Contextmenu.vue'
import getContextmenuPosition from '@/utils/getContextmenuPosition'
import { formatConversationTime } from '@/utils/ai/agent/conversationTime'

type ConversationLike = { id: string; title: string; updateAt: string | number | Date }

/**
 * Room the menu is assumed to need. Right-click uses them to place the menu, and the `⋯` entry needs them
 * for its first frame; the real width depends on the longest item and is measured right after opening.
 */
const MENU_WIDTH = 140
const MENU_HEIGHT = 90

@Component({ components: { Contextmenu } })
export default class AgentSidebar extends Vue {
  @Prop({ default: () => [] }) readonly conversations!: ConversationLike[]
  @Prop({ default: null }) readonly activeId!: string | null
  @Prop({ default: null }) readonly runningId!: string | null

  private menuVisible = false
  private menuConfig: ContextmenuModel = { top: 0, left: 0 }
  /** The conversation the open menu belongs to, so its row keeps the hover look */
  private menuTargetId: string | null = null

  @Watch('menuVisible')
  private onMenuVisibleChange(visible: boolean) {
    if (!visible) this.menuTargetId = null
  }

  /** Right click on a row opens the menu where the pointer is */
  private openMenuAt(id: string, event: MouseEvent) {
    if (this.menuVisible) {
      this.menuVisible = false
      return
    }
    const { x, y } = getContextmenuPosition(event, MENU_WIDTH, MENU_HEIGHT)
    this.menuConfig = { top: y, left: x }
    this.menuTargetId = id
    this.menuVisible = true
  }

  /** The `⋯` button opens the same menu, hanging off its right edge */
  private openMenuFromButton(id: string, event: MouseEvent) {
    if (this.menuVisible) {
      this.menuVisible = false
      return
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const top = rect.bottom + 4
    const first = getContextmenuPosition(
      { clientX: rect.right - MENU_WIDTH, clientY: top } as MouseEvent,
      MENU_WIDTH,
      MENU_HEIGHT,
    )
    this.menuConfig = { top: first.y, left: first.x }
    this.menuTargetId = id
    this.menuVisible = true

    // The menu is only as wide as its longest item, which changes with the language: measure it and put
    // its right edge on the button's right edge
    this.$nextTick(() => {
      const menu = this.$el.querySelector('.contextmenu') as HTMLElement | null
      if (!this.menuVisible || !menu) return
      const width = menu.offsetWidth
      const { x, y } = getContextmenuPosition(
        { clientX: rect.right - width, clientY: top } as MouseEvent,
        width,
        menu.offsetHeight,
      )
      this.menuConfig = { top: y, left: x }
    })
  }

  private choose(command: 'rename' | 'delete') {
    const id = this.menuTargetId
    this.menuVisible = false
    if (id) this.$emit(command, id)
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
