<template>
  <div class="payload-inspector-view">
    <!-- Toolbar -->
    <div class="inspector-toolbar">
      <div class="toolbar-left">
        <!-- Segmented Control for View Mode -->
        <div class="view-mode-control">
          <button class="segment" :class="{ active: activeViewMode === 'diff' }" @click="activeViewMode = 'diff'">
            <i class="el-icon-files"></i>
            {{ $t('viewer.diffView') }}
          </button>
          <button class="segment" :class="{ active: activeViewMode === 'tree' }" @click="activeViewMode = 'tree'">
            <i class="iconfont icon-tree-view"></i>
            {{ $t('viewer.jsonTree') }}
          </button>
          <span class="segment-slider" :class="{ 'at-right': activeViewMode === 'tree' }"></span>
        </div>
      </div>

      <div class="toolbar-right">
        <ConnectionSelect v-model="selectedConnectionId" size="small" width="200px" @change="onConnectionChange" />
        <TopicSelect
          v-model="selectedTopic"
          :connection-id="selectedConnectionId"
          size="small"
          width="200px"
          @change="onTopicChange"
        />
        <div class="type-filter">
          <span
            class="type-item"
            :class="{ active: currentMessageType === 'all' }"
            @click="onMessageTypeChange('all')"
            >{{ $t('connections.all') }}</span
          >
          <span
            class="type-item"
            :class="{ active: currentMessageType === 'received' }"
            @click="onMessageTypeChange('received')"
            >{{ $t('connections.received') }}</span
          >
          <span
            class="type-item"
            :class="{ active: currentMessageType === 'publish' }"
            @click="onMessageTypeChange('publish')"
            >{{ $t('connections.published') }}</span
          >
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="inspector-content">
      <DiffView
        v-if="activeViewMode === 'diff'"
        :key="componentKey"
        :messages="messagesData.list"
        :hasMore="hasMore"
        @request-older="loadMessages(true)"
      />
      <JsonViewer
        v-else-if="activeViewMode === 'tree'"
        :key="componentKey"
        :messages="messagesData.list"
        :hasMore="hasMore"
        @request-older="loadMessages(true)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import TopicSelect from '@/components/TopicSelect.vue'
import useServices from '@/database/useServices'
import DiffView from '@/widgets/DiffView.vue'
import JsonViewer from '@/widgets/JSONViewer.vue'
import MsgTypeTabs from '@/components/MsgTypeTabs.vue'

@Component({
  components: {
    ConnectionSelect,
    TopicSelect,
    DiffView,
    JsonViewer,
    MsgTypeTabs,
  },
})
export default class PayloadInspector extends Vue {
  @Getter('activeConnection') private activeConnection!: ActiveConnection

  private selectedConnectionId = ''
  private selectedTopic = ''
  private hasMoreMessages = true
  private messagesData: MessagePaginationModel = {
    list: [],
    total: 0,
    publishedTotal: 0,
    receivedTotal: 0,
    limit: 20,
    page: 1,
  }

  private currentMessageType: MessageType = 'all'
  private activeViewMode: 'diff' | 'tree' = 'diff'

  get componentKey(): string {
    return `${this.selectedConnectionId}-${this.selectedTopic}-${this.currentMessageType}-${this.activeViewMode}`
  }

  private async onConnectionChange(connectionId: string) {
    this.selectedConnectionId = connectionId
    this.selectedTopic = this.getRecentTopic()
    this.resetMessagesData()
  }

  private getRecentTopic(): string {
    if (!this.selectedConnectionId) return ''
    const key = `recent_topic_${this.selectedConnectionId}`
    const topic = localStorage.getItem(key)
    return topic || ''
  }

  private onTopicChange(topic: string) {
    this.selectedTopic = topic
    if (this.selectedConnectionId && topic) {
      const key = `recent_topic_${this.selectedConnectionId}`
      localStorage.setItem(key, topic)
    }
    if (topic) {
      this.loadMessages()
    } else {
      this.resetMessagesData()
    }
  }

  private resetMessagesData(): void {
    this.messagesData = {
      list: [],
      total: 0,
      publishedTotal: 0,
      receivedTotal: 0,
      limit: 20,
      page: 1,
    }
  }

  private async loadMessages(append: boolean = false, msgType?: MessageType): Promise<void> {
    if (!this.selectedConnectionId || !this.selectedTopic) {
      return
    }
    const page = append ? this.messagesData.page + 1 : 1
    const typeToUse = msgType || this.currentMessageType || 'all'

    try {
      const { messageService } = useServices()
      const result = await messageService.get(this.selectedConnectionId, {
        page,
        limit: this.messagesData.limit,
        msgType: typeToUse,
        topic: this.selectedTopic,
        preserveOrder: true,
      })

      if (append) {
        this.messagesData.list = [...this.messagesData.list, ...result.list]
        this.messagesData.page = page
      } else {
        this.messagesData = {
          ...result,
          list: result.list,
          page: page,
          total: result.total,
          publishedTotal: result.publishedTotal,
          receivedTotal: result.receivedTotal,
        }
      }
      this.hasMoreMessages = result.list.length >= this.messagesData.limit
    } catch (error) {
      this.$log.error(`Failed to load messages: ${error}`)
      this.$message.error(this.$t('viewer.failedToLoadMessages') as string)
    }
  }

  private get hasMore(): boolean {
    return this.hasMoreMessages
  }

  private onMessageTypeChange(type: MessageType) {
    this.currentMessageType = type
    this.loadMessages(false, type)
  }
}
</script>

<style lang="scss" scoped>
.payload-inspector-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
  box-sizing: border-box;

  .inspector-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;

    .toolbar-left {
      display: flex;
      align-items: center;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    // Segmented Control
    .view-mode-control {
      position: relative;
      display: inline-flex;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-default);
      border-radius: 8px;
      padding: 3px;

      .segment {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-default);
        cursor: pointer;
        transition: color 0.2s ease;
        white-space: nowrap;

        i {
          font-size: 14px;
        }

        &:hover {
          color: var(--color-main-green);
        }

        &.active {
          color: var(--color-main-green);
        }
      }

      .segment-slider {
        position: absolute;
        top: 3px;
        left: 3px;
        width: calc(50% - 3px);
        height: calc(100% - 6px);
        background: var(--color-bg-normal);
        border-radius: 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;

        &.at-right {
          transform: translateX(100%);
        }
      }
    }

    // Type Filter
    .type-filter {
      display: flex;
      align-items: center;
      border-left: 1px solid var(--color-border-default);
      padding-left: 12px;
      margin-left: 4px;

      .type-item {
        padding: 0 10px;
        font-size: 12px;
        color: var(--color-text-default);
        cursor: pointer;
        border-right: 1px solid var(--color-border-default);
        transition: color 0.15s ease;

        &:last-child {
          border-right: none;
          padding-right: 0;
        }

        &:hover {
          color: var(--color-main-green);
        }

        &.active {
          color: var(--color-main-green);
          font-weight: 500;
        }
      }
    }
  }

  .inspector-content {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-bg-normal);
  }
}
</style>
