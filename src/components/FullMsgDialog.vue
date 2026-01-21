<template>
  <my-dialog
    :title="$t('common.viewData')"
    :visible.sync="showDialog"
    class="full-msg-dialog"
    width="600px"
    :confirmBtnText="$t('common.saveToLocal')"
    @confirm="saveDataToLocal"
    @close="resetData"
  >
    <el-skeleton class="loading-full-msg" v-if="loadingMsg" :rows="6" animated />
    <template v-else>
      <div class="full-msg-size">
        <span>
          {{ $t('connections.payloadSize') }}: <strong>{{ calculateAndFormatTextSize(fullMsg) }}</strong>
        </span>
        <span>
          {{ $t('common.msgType') }}: <strong>{{ msgType }}</strong>
        </span>
      </div>
      <div class="editor-container full-msg-editor">
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

  private showDialog: boolean = this.visible

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private getFormatOrLang(type: string) {
    if (['JSON', 'CBOR'].includes(this.msgType)) {
      return type === 'lang' ? 'json' : 'json'
    }
    return type === 'lang' ? 'plaintext' : 'txt'
  }

  get lang() {
    return this.getFormatOrLang('lang')
  }

  get format() {
    return this.getFormatOrLang('format')
  }

  private fullMsg = ''
  private filename = 'payload'
  private loadingMsg = false

  private async loadMsg() {
    this.loadingMsg = true
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

  private calculateAndFormatTextSize(text: string, decimals = 2) {
    return calculateTextSize(text)
  }

  private mounted() {
    this.loadMsg()
  }
}
</script>

<style lang="scss">
.full-msg-dialog {
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
}
</style>
