<template>
  <div class="payload-inspector-view">
    <div class="inspector-controls">
      <div class="view-mode-selector">
        <button
          class="view-mode-button"
          :class="{ active: activeViewMode === 'diff' }"
          @click="activeViewMode = 'diff'"
        >
          {{ $t('viewer.diffView') }}
        </button>
        <button
          class="view-mode-button"
          :class="{ active: activeViewMode === 'tree' }"
          @click="activeViewMode = 'tree'"
        >
          {{ $t('viewer.jsonTree') }}
        </button>
      </div>
      <div class="control-group">
        <ConnectionSelect v-model="selectedConnectionId" size="small" @change="onConnectionChange" />
      </div>

      <div class="control-group">
        <TopicSelect
          v-model="selectedTopic"
          :connection-id="selectedConnectionId"
          size="small"
          @change="onTopicChange"
        />
      </div>

      <div class="message-type-tabs">
        <MsgTypeTabs v-model="currentMessageType" @change="onMessageTypeChange" />
      </div>
    </div>
    <div class="diff-view-container">
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
  .inspector-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    .view-mode-selector {
      display: flex;
      gap: 10px;
      margin-bottom: 5px;
      min-width: 180px;
      .view-mode-button {
        position: relative;
        z-index: 1;
        padding: 8px 16px;
        border: none;
        background: transparent;
        border-radius: 8px;
        font-weight: 500;
        color: var(--color-text-default);
        cursor: pointer;
        white-space: nowrap;
        &.active {
          background: #34c38810;
          color: var(--color-main-green);
        }
      }
    }

    .message-type-tabs {
      display: flex;
      align-items: center;
    }

    .control-group {
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--color-text-default);
      }
    }
  }

  .diff-view-container {
    flex: 1;
    min-height: 0;
    margin-top: 12px;
    border: 1px solid var(--color-border-default);
    border-radius: 6px;
    overflow: hidden;
  }
}
</style>
