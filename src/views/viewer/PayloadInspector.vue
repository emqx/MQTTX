<template>
  <div class="payload-inspector-view">
    <div class="inspector-controls">
      <div class="control-group">
        <label>{{ $t('common.connection') }}</label>
        <ConnectionSelect v-model="selectedConnectionId" :width="'300px'" @change="onConnectionChange" />
      </div>

      <div class="control-group">
        <label>{{ $t('common.topic') }}</label>
        <TopicSelect
          v-model="selectedTopic"
          :connection-id="selectedConnectionId"
          :width="'300px'"
          @change="onTopicChange"
        />
      </div>
    </div>
    <div class="diff-view-container">
      <DiffView :messages="messagesData.list" :loadMore="loadMoreMessages" :hasMore="hasMore" />
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
  private connectionDisplayName = ''
  private loading = false

  private messagesData: MessagePaginationModel = {
    list: [],
    total: 0,
    publishedTotal: 0,
    receivedTotal: 0,
    limit: 20,
    page: 1,
  }

  private async onConnectionChange(connectionId: string) {
    this.selectedConnectionId = connectionId
    this.selectedTopic = ''
    this.connectionDisplayName = await this.getConnectionDisplayName(connectionId)
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

  private async getConnectionDisplayName(connectionId: string): Promise<string> {
    try {
      const { connectionService } = useServices()
      const connection = await connectionService.get(connectionId)
      if (connection) {
        return `${connection.name}@${connection.host}`
      }
    } catch (error) {
      this.$log.error(`Failed to get connection details: ${error}`)
    }
    return connectionId
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

  private async loadMessages(): Promise<void> {
    if (!this.selectedConnectionId || !this.selectedTopic) {
      return
    }

    this.loading = true
    try {
      const { messageService } = useServices()
      const result = await messageService.get(this.selectedConnectionId, {
        page: this.messagesData.page,
        limit: this.messagesData.limit,
        msgType: 'publish',
        topic: this.selectedTopic,
      })

      this.messagesData = {
        ...result,
        list: result.list.reverse(),
      }
    } catch (error) {
      this.$log.error(`Failed to load messages: ${error}`)
      this.$message.error(this.$t('viewer.failedToLoadMessages') as string)
    } finally {
      this.loading = false
    }
  }

  private async loadMoreMessages(): Promise<void> {
    if (!this.selectedConnectionId || !this.selectedTopic) {
      return
    }
    if (this.loading) return
    this.loading = true
    try {
      const nextPage = this.messagesData.page + 1
      const { messageService } = useServices()
      const result = await messageService.get(this.selectedConnectionId, {
        page: nextPage,
        limit: this.messagesData.limit,
        msgType: 'publish',
        topic: this.selectedTopic,
      })
      this.messagesData = {
        ...this.messagesData,
        list: [...this.messagesData.list, ...result.list.reverse()],
        page: nextPage,
        total: result.total,
        publishedTotal: result.publishedTotal,
        receivedTotal: result.receivedTotal,
      }
    } catch (error) {
      this.$log.error(`Failed to load more messages: ${error}`)
      this.$message.error(this.$t('viewer.failedToLoadMoreMessages') as string)
    } finally {
      this.loading = false
    }
  }

  private get hasMore(): boolean {
    return this.messagesData.list.length < this.messagesData.total
  }

  private formatTime(timeString: string): string {
    try {
      return new Date(timeString).toLocaleString()
    } catch (error) {
      return timeString
    }
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
