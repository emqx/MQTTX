<template>
  <my-dialog
    :title="$t('common.viewData')"
    :visible.sync="showDialog"
    class="full-msg-dialog"
    :class="{ 'batch-dialog': batchPayload !== undefined }"
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
      <div v-if="batchPayload === undefined" class="full-msg-size">
        <span>
          {{ $t('connections.payloadSize') }}:
          <strong>{{ formattedPayloadSize }}</strong>
        </span>
        <span>
          {{ $t('common.msgType') }}: <strong>{{ msgType }}</strong>
        </span>
      </div>
      <template v-if="batchPayload !== undefined">
        <div ref="batchPageRef" class="batch-page">
          <table>
            <thead>
              <tr>
                <th class="batch-index">#</th>
                <th>{{ $t('connections.batchItemContent') }}</th>
                <th class="batch-size">{{ $t('connections.batchItemSize') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in batchPageItems" :key="index">
                <td class="batch-index">{{ (batchPage - 1) * batchPageSize + index + 1 }}</td>
                <td>
                  <span class="batch-content" :title="item.title"
                    >{{ item.text
                    }}<span v-if="item.binary" class="batch-muted"> ({{ $t('connections.batchBinary') }})</span></span
                  >
                </td>
                <td class="batch-size">{{ formatBytes(item.bytes) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
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
import useServices from '@/database/useServices'
import MyDialog from './MyDialog.vue'
import Editor from './Editor.vue'
import { ipcRenderer } from 'electron'
import { formatBytes } from '@/utils/formatter'
import { BATCH_PAGE_SIZE, StoredBatchItem, getBatchItemDisplay, getPublishedBatchItems } from '@/utils/batchPayload'
import { calculateTextSize } from '@/utils/data'

@Component({
  components: {
    MyDialog,
    Editor,
  },
})
export default class FullMsgDialog extends Vue {
  @Prop({ default: false }) public visible!: boolean
  @Prop({ required: true }) public msgId!: string
  @Prop({ default: '' }) public msgType!: string
  @Prop() public batchPayload?: string
  @Prop() public payloadBytes?: number
  @Prop() public batchPayloadType?: PayloadType

  private batchPageSize = BATCH_PAGE_SIZE
  private batchPage = 1
  private formatBytes = formatBytes

  get formattedPayloadSize(): string {
    if (this.payloadBytes === undefined) return calculateTextSize(this.fullMsg)
    return formatBytes(this.payloadBytes)
  }

  get batchItems(): StoredBatchItem[] {
    if (this.batchPayload === undefined) return []
    if (this.batchPayloadType !== undefined) return getPublishedBatchItems(this.batchPayload, this.batchPayloadType)
    return JSON.parse(this.batchPayload)
  }
  get batchPageItems() {
    return this.batchItems
      .slice((this.batchPage - 1) * BATCH_PAGE_SIZE, this.batchPage * BATCH_PAGE_SIZE)
      .map(getBatchItemDisplay)
  }

  get batchPages(): number {
    return Math.ceil(this.batchItems.length / this.batchPageSize)
  }

  @Watch('batchPage')
  private onBatchPageChanged() {
    const page = this.$refs.batchPageRef as HTMLElement | undefined
    if (page) page.scrollTop = 0
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
    if (this.batchPayloadType !== undefined) return 'txt'
    return this.batchPayload !== undefined || ['JSON', 'CBOR'].includes(this.msgType) ? 'json' : 'txt'
  }

  private fullMsg = ''
  private filename = 'payload'
  private loadingMsg = false

  private async loadMsg() {
    this.loadingMsg = true
    if (this.batchPayload !== undefined) {
      this.fullMsg = this.batchPayload
      this.loadingMsg = false
      return
    }
    const { messageService } = useServices()
    const message = await messageService.getOne(this.msgId)
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
  .batch-page {
    min-height: 0;
    max-height: 400px;
    overflow: auto;
    color: var(--color-text-default);
    font-size: 13px;
    line-height: 1.6;
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    th,
    td {
      height: 32px;
      padding: 0 8px;
      border-bottom: 1px solid var(--color-border-default);
      text-align: left;
    }
    th {
      position: sticky;
      top: 0;
      color: var(--color-text-tips);
      background: var(--color-bg-normal);
      font-size: 12px;
      font-weight: 500;
    }
    .batch-index {
      width: 56px;
      white-space: nowrap;
      color: var(--color-text-tips);
      text-align: right;
      font-size: 12px;
    }
    .batch-size {
      width: 72px;
      text-align: right;
      white-space: nowrap;
    }
    .batch-content {
      display: block;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .batch-muted {
      color: var(--color-text-tips);
      font-size: 12px;
    }
  }
  .batch-pager {
    @include history-button-group;
  }
}
</style>
