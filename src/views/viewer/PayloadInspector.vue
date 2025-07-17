<template>
  <div class="payload-inspector-view">
    <div class="inspector-controls">
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
    </div>
    <div class="diff-view-container">
      <DiffView
        :messages="messagesData.list"
        :hasMore="hasMore"
        @request-older="loadMessages(true)"
        @message-type-change="onMessageTypeChange"
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

@Component({
  components: {
    ConnectionSelect,
    TopicSelect,
    DiffView,
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

  private async onConnectionChange(connectionId: string) {
    this.selectedConnectionId = connectionId
    this.selectedTopic = ''
    this.resetMessagesData()
  }

  private onTopicChange(topic: string) {
    this.selectedTopic = topic
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

      this.messagesData = append
        ? {
            ...this.messagesData,
            list: [...this.messagesData.list, ...result.list],
            page: page,
          }
        : {
            ...result,
            list: result.list,
            page: page,
            total: result.total,
            publishedTotal: result.publishedTotal,
            receivedTotal: result.receivedTotal,
          }
      if (result.list.length < this.messagesData.limit) {
        this.hasMoreMessages = false
        return
      }
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
  .inspector-controls {
    display: flex;
    gap: 20px;

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
    margin-top: 30px;
    height: 400px;
    border: 1px solid var(--color-border-default);
    border-radius: 6px;
    overflow: hidden;
  }
}
</style>
