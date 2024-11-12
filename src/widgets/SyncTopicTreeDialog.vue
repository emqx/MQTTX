<template>
  <my-dialog
    class="sync-connection-dialog"
    :visible="visible"
    :title="$t('viewer.syncConnectionTitle')"
    width="380px"
    :confirm-loading="syncConnectionLoading"
    @confirm="handleSyncConnection"
    @update:visible="$emit('update:visible', $event)"
    @open="autoSyncConnection"
    destroy-on-close
  >
    <div>
      <connection-select v-model="selectedConnectionId" size="small" :disabled="syncConnectionId !== ''" />
      <span class="ml-3 cursor-pointer">
        <el-tooltip
          :content="$t('viewer.syncConnectionToTopicTreeTips')"
          placement="top"
          :effect="theme !== 'light' ? 'light' : 'dark'"
        >
          <i class="iconfont icon-about"></i>
        </el-tooltip>
      </span>
    </div>
    <el-alert v-if="syncConnectionTip" type="warning" class="sync-connection-tip">{{ syncConnectionTip }}</el-alert>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import ConnectionSelect from '@/components/ConnectionSelect.vue'
import MyDialog from '@/components/MyDialog.vue'
import useServices from '@/database/useServices'
import { buildTopicTreeFromStats } from '@/utils/topicTree'

@Component({
  components: {
    ConnectionSelect,
    MyDialog,
  },
})
export default class SyncTopicTreeDialog extends Vue {
  @Prop({ type: Boolean, default: false }) private visible!: boolean
  @Prop({ type: String, default: '' }) private syncConnectionId!: string

  @Getter('currentTheme') private theme!: string

  private selectedConnectionId = ''
  private syncConnectionLoading = false
  private syncConnectionTip = ''

  private async handleSyncConnection() {
    const { messageService, topicNodeService } = useServices()
    try {
      this.syncConnectionLoading = true
      setTimeout(() => {
        if (this.syncConnectionLoading) {
          this.syncConnectionTip = this.$tc('viewer.syncTakeLongTime')
        }
      }, 3000)
      const messageTopicNodeStats = await messageService.getMessageTopicNodeStats(this.selectedConnectionId)
      if (messageTopicNodeStats === null) return
      const { connection, topicStats } = messageTopicNodeStats
      const syncedTopicTree = buildTopicTreeFromStats(connection, topicStats)
      await topicNodeService.updateTopicNodes(syncedTopicTree)
      this.$emit('success', syncedTopicTree)
      this.$message.success(
        this.$tc('viewer.syncConnectionToTopicTreeSuccess', 0, {
          connectionName: `${connection.name}@${connection.host}`,
        }),
      )
      this.$log.info(`Topic Tree: Successfully sync connection (${connection.name}@${connection.host}) to topic tree`)
    } catch (error) {
      this.$message.error(
        this.$tc('viewer.syncConnectionToTopicTreeFailed', 0, {
          connectionId: this.selectedConnectionId,
        }),
      )
      this.$log.error(
        `Topic Tree: Failed to sync connection (${this.selectedConnectionId}) to topic tree: ${(
          error as Error
        ).toString()}`,
      )
    } finally {
      this.$emit('update:visible', false)
      this.syncConnectionLoading = false
      this.syncConnectionTip = ''
    }
  }

  private async autoSyncConnection() {
    if (this.syncConnectionId) {
      this.selectedConnectionId = this.syncConnectionId
    }
  }
}
</script>

<style lang="scss">
.sync-connection-dialog {
  .sync-connection-tip {
    margin-top: 12px;
    word-break: break-word;
    &.el-alert .el-alert__description {
      margin-top: 0px;
    }
  }
}
</style>
