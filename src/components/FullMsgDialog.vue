<template>
  <my-dialog
    :title="$t('common.viewData')"
    :visible.sync="showDialog"
    class="full-msg-dialog"
    :class="{ 'batch-dialog': batchItems !== undefined }"
    width="600px"
    :confirmBtnText="$t('common.saveToLocal')"
    @confirm="saveDataToLocal"
    @close="resetData"
  >
    <div v-if="batchPages > 1" slot="footer-left" class="history-button-group batch-pager">
      <el-button
        :disabled="batchPage === 1"
        size="mini"
        icon="el-icon-arrow-left"
        class="history-btn history-btn-left"
        @click="batchPage--"
      />
      <el-button size="mini" class="history-btn history-btn-center">{{ batchPage }}/{{ batchPages }}</el-button>
      <el-button
        :disabled="batchPage === batchPages"
        size="mini"
        icon="el-icon-arrow-right"
        class="history-btn history-btn-right"
        @click="batchPage++"
      />
    </div>
    <el-skeleton class="loading-full-msg" v-if="loadingMsg" :rows="6" animated />
    <template v-else>
      <div v-if="batchItems === undefined" class="full-msg-size">
        <span>
          {{ $t('connections.payloadSize') }}:
          <strong>{{ formattedPayloadSize }}</strong>
        </span>
        <span>
          {{ $t('common.msgType') }}: <strong>{{ msgType }}</strong>
        </span>
      </div>
      <el-table
        v-if="batchItems !== undefined"
        ref="batchTableRef"
        class="batch-table"
        :data="batchPageItems"
        :max-height="400"
        size="mini"
      >
        <el-table-column
          type="index"
          label="#"
          width="56"
          align="center"
          class-name="batch-index"
          :index="batchItemIndex"
        />
        <el-table-column :label="$t('connections.batchItemContent')" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="batch-content" :title="row.title"
              >{{ row.text
              }}<span v-if="row.binary" class="batch-muted"> ({{ $t('connections.batchBinary') }})</span></span
            >
          </template>
        </el-table-column>
        <el-table-column :label="$t('connections.batchItemSize')" width="80" align="right" class-name="batch-size">
          <template slot-scope="{ row }">{{ formatBytes(row.bytes) }}</template>
        </el-table-column>
      </el-table>
      <div v-else class="editor-container full-msg-editor">
        <Editor
          :key="msgId"
          ref="fullMsgEditorRef"
          id="full-msg-editor"
          :lang="lang"
          lineNumbers="on"
          wordWrap="on"
          v-model="fullMsg"
          disabled
        />
      </div>
    </template>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import type { Table } from 'element-ui'
import useServices from '@/database/useServices'
import MyDialog from './MyDialog.vue'
import Editor from './Editor.vue'
import { ipcRenderer } from 'electron'
import { formatBytes } from '@/utils/formatter'
import { BATCH_PAGE_SIZE, StoredBatchItem, getBatchItemDisplay } from '@/utils/batchPayload'
import { calculateTextSize } from '@/utils/data'

@Component({
  components: {
    MyDialog,
    Editor,
  },
})
export default class FullMsgDialog extends Vue {
  @Prop({ default: false }) public visible!: boolean
  @Prop() public msgId?: string
  @Prop({ default: '' }) public msgType!: string
  @Prop() public batchItems?: StoredBatchItem[]
  @Prop() public exportText?: string
  @Prop() public exportFormat?: string

  private batchPage = 1
  private formatBytes = formatBytes

  get formattedPayloadSize(): string {
    return calculateTextSize(this.fullMsg)
  }

  get batchPageItems() {
    return (this.batchItems || [])
      .slice((this.batchPage - 1) * BATCH_PAGE_SIZE, this.batchPage * BATCH_PAGE_SIZE)
      .map(getBatchItemDisplay)
  }

  get batchPages(): number {
    return Math.ceil((this.batchItems?.length || 0) / BATCH_PAGE_SIZE)
  }

  private batchItemIndex(index: number): number {
    return (this.batchPage - 1) * BATCH_PAGE_SIZE + index + 1
  }

  @Watch('batchPage')
  private onBatchPageChanged() {
    const table = this.$refs.batchTableRef as Table | undefined
    const body = table?.$el.querySelector<HTMLElement>('.el-table__body-wrapper')
    if (body) body.scrollTop = 0
  }

  private showDialog: boolean = this.visible

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  get lang() {
    return this.format === 'json' ? 'json' : 'plaintext'
  }

  get format() {
    return this.exportFormat ?? (['JSON', 'CBOR'].includes(this.msgType) ? 'json' : 'txt')
  }

  private fullMsg = ''
  private filename = 'payload'
  private loadingMsg = false

  private async loadMsg() {
    this.loadingMsg = true
    if (this.exportText !== undefined) {
      this.fullMsg = this.exportText
      this.loadingMsg = false
      return
    }
    const { messageService } = useServices()
    const message = await messageService.getOne(this.msgId!)
    this.fullMsg = message?.payload || ''
    this.loadingMsg = false
  }

  private async saveDataToLocal() {
    ipcRenderer.send('exportTextData', this.filename, this.fullMsg, this.format)
    ipcRenderer.on('saved', () => {
      this.$message.success(`${this.filename}.${this.format} ${this.$t('common.saveSuccess')}`)
      this.resetData()
    })
  }

  private resetData() {
    ipcRenderer.removeAllListeners('saved')
    this.fullMsg = ''
    this.showDialog = false
    this.$emit('update:visible', false)
  }

  private mounted() {
    this.loadMsg()
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.full-msg-dialog {
  .el-dialog__header {
    text-align: left;
  }
  &.batch-dialog {
    .el-dialog {
      display: flex;
      flex-direction: column;
      // MyDialog starts at 15vh; leave 24px below the footer.
      max-height: calc(85vh - 24px);
    }
    .el-dialog__header,
    .el-dialog__footer {
      flex-shrink: 0;
    }
    .el-dialog__body {
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding-top: 12px;
      overflow: hidden;
    }
  }
  .el-dialog__body {
    padding-top: 24px;
    padding-bottom: 0px;
  }
  .loading-full-msg {
    height: 400px;
  }
  .full-msg-size {
    color: var(--color-text-default);
    margin-bottom: 12px;
    display: flex;
    gap: 12px;
  }
  .editor-container.full-msg-editor {
    height: 400px;
    background: var(--color-bg-normal);
    border: 1px solid var(--color-border-default);
    padding: 10px 1px 1px 1px;
    border-radius: 8px;
  }
  .batch-table {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    min-height: 0;
    color: var(--color-text-default);
    background-color: var(--color-bg-normal);
    .el-table__header-wrapper {
      flex-shrink: 0;
    }
    .el-table__body-wrapper {
      min-height: 0;
      overflow: auto;
    }
    th,
    tr {
      background-color: var(--color-bg-normal);
    }
    th,
    td {
      border-bottom-color: var(--color-border-default);
    }
    &::before {
      background-color: var(--color-border-default);
    }
    .el-table__body tr:hover > td {
      background-color: var(--color-bg-select_lang);
    }
    th,
    .batch-muted {
      color: var(--color-text-tips);
    }
  }
  .batch-pager {
    @include history-button-group;
  }
}
</style>
