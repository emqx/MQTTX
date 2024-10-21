<template>
  <my-dialog
    :title="$t('connections.cleanHistoryData')"
    :visible.sync="showDialog"
    class="clean-data"
    width="450px"
    @confirm="cleanHistoryData"
    @close="resetData"
  >
    <i class="el-icon-warning"></i>{{ $t('settings.cleanHistoryDialogMessage') }}
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MyDialog from './MyDialog.vue'
import useServices from '@/database/useServices'

@Component({
  components: {
    MyDialog,
  },
})
export default class ClearUpHistoryData extends Vue {
  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private async cleanHistoryData() {
    const {
      connectionService,
      historyMessageHeaderService,
      historyMessagePayloadService,
      messageService,
      topicNodeService,
    } = useServices()

    await Promise.all([
      connectionService.cleanLeatest(),
      historyMessageHeaderService.clean(),
      historyMessagePayloadService.clean(),
      messageService.cleanAll(),
      topicNodeService.clearTree(),
    ])

    this.$message.success(this.$tc('connections.cleanHistorySuccess'))
    this.$log.info('History cleared successfully')
    this.resetData()
  }

  private resetData() {
    this.showDialog = false
    this.$emit('update:visible', false)
  }
}
</script>

<style lang="scss">
.clean-data {
  .el-icon-warning {
    color: var(--color-main-yellow);
    margin-right: 5px;
    font-size: 20px;
  }
  .el-dialog__body {
    padding-bottom: 0px;
    word-break: normal;
    color: var(--color-text-default);
  }
}
</style>
