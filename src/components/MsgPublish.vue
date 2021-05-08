<template>
  <div class="msg-publish message">
    <div class="publish-header">
      <div class="qos-retain">
        <span class="publish-label">Payload: </span>
        <el-select class="payload-select" size="mini" v-model="payloadType">
          <el-option v-for="(type, index) in payloadOptions" :key="index" :value="type"> </el-option>
        </el-select>
        <span class="publish-label">QoS: </span>
        <el-select class="qos-select" size="mini" v-model="msgRecord.qos">
          <el-option :value="0"></el-option>
          <el-option :value="1"></el-option>
          <el-option :value="2"></el-option>
        </el-select>
        <div class="retain-block">
          <span class="publish-label">Retain: </span>
          <el-checkbox v-model="msgRecord.retain"></el-checkbox>
        </div>
      </div>
      <el-input
        class="topic-input"
        placeholder="Topic"
        v-model="msgRecord.topic"
        @focus="handleInputFoucs"
        @blur="handleInputBlur"
      >
      </el-input>
      <el-select class="header-select" v-model="headerValue" placeholder="" size="mini" @change="handleHeaderChange">
        <el-option
          class="header-option"
          v-for="item in headersHistory"
          :key="item.id"
          :label="item.label"
          :value="item"
        >
          <span style="float: left; width: 160px; overflow: hidden; text-overflow: ellipsis">{{ item.topic }}</span>
          <span style="color: #8492a6; font-size: 12px; margin-left: 4px">QOS:{{ item.qos }}</span>
          <span style="float: right; color: #8492a6; font-size: 13px; font-weight: 400; margin-left: 4px"
            >retain:{{ item.retain ? '1' : '0' }}</span
          >
        </el-option>
      </el-select>
    </div>
    <div class="editor-container">
      <div
        class="publish-footer"
        :style="{
          height: `${editorHeight}px`,
        }"
      >
        <Editor ref="payloadEditor" id="payload" :lang="payloadLang" v-model="msgRecord.payload" @enter-event="send" />
      </div>
      <div class="publish-right-bar">
        <div class="history-icon">
          <el-button
            :disabled="historyIndex === 0"
            circle
            size="mini"
            icon="el-icon-back"
            @click="decrease"
          ></el-button>
          <el-button
            circle
            :disabled="historyIndex === payloadsHistory.length - 1"
            size="mini"
            icon="el-icon-minus"
            @click="back"
          ></el-button>
          <el-button
            :disabled="historyIndex === payloadsHistory.length - 1"
            circle
            size="mini"
            icon="el-icon-right"
            @click="increase"
          ></el-button>
        </div>
      </div>
      <a href="javascript:;" class="send-btn" @click="send">
        <i class="iconfont icon-send"></i>
      </a>
    </div>
    <div v-if="disabled" class="disabled-mask" @click.stop></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import Editor from '@/components/Editor.vue'
import { MessageModel, HistoryMessageHeaderModel, HistoryMessagePayloadModel } from '../views/connections/types'
import convertPayload from '@/utils/convertPayload'
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import {
  createHistoryMessagePayload,
  createHistoryMessageHeader,
  loadHistoryMessageHeaders,
  loadHistoryMessagePayloads,
} from '@/api/connection'
import { hasMessagePayload, hasMessageHeader } from '@/utils/mqttUtils'

@Component({
  components: {
    Editor,
  },
})
export default class MsgPublish extends Vue {
  @Prop({ required: true }) public editorHeight!: number
  @Prop({ required: true }) public subsVisible!: boolean
  @Prop({ default: false }) public disabled!: boolean

  private headersHistory: HistoryMessageHeaderModel[] | [] = []
  private payloadsHistory: HistoryMessagePayloadModel[] | [] = []
  private historyIndex: number = -1
  private defaultMsgRecord: MessageModel = {
    mid: '',
    createAt: '',
    out: true,
    qos: 0,
    retain: false,
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
  }
  private msgRecord: MessageModel = _.cloneDeep(this.defaultMsgRecord)
  private headerValue: HistoryMessageHeaderModel = {
    qos: this.msgRecord.qos,
    retain: this.msgRecord.retain,
    topic: this.msgRecord.topic,
  }
  private payloadLang = 'json'
  private payloadType: PayloadType = 'JSON'
  private payloadOptions: PayloadType[] = ['Plaintext', 'Base64', 'JSON', 'Hex']

  @Watch('editorHeight')
  private handleHeightChanged() {
    this.handleLayout()
  }
  @Watch('subsVisible')
  private handleSubsChanged(val: boolean) {
    setTimeout(() => {
      this.handleLayout()
    }, 500)
  }
  @Watch('payloadType')
  private handleTypeChange(val: PayloadType, oldVal: PayloadType) {
    const { payload } = this.msgRecord
    convertPayload(payload, val, oldVal)
      .then((res) => {
        this.msgRecord.payload = res
        if (val === 'JSON') {
          this.payloadLang = 'json'
        } else {
          this.payloadLang = 'plaintext'
        }
      })
      .catch((error: Error) => {
        const errorMsg = error.toString()
        this.$message.error(errorMsg)
        this.payloadType = oldVal
      })
  }
  @Watch('disabled', { immediate: true, deep: true })
  private handleDisabledChange(val: boolean) {
    if (val) {
      ipcRenderer.removeAllListeners('sendPayload')
    }
  }
  @Watch('historyIndex', { immediate: true, deep: true })
  private handleHistoryIndexChange(val: number, lastval: number) {
    if (lastval !== val && val >= 0 && val < this.payloadsHistory.length) {
      this.msgRecord = Object.assign(this.msgRecord, this.payloadsHistory[val])
    }
  }

  /**
   * Notice:
   * when we jump order by`creation page` <-> `connection page`,
   * the monaco will not init or destroy, because we use the v-show to hidden Msgpublish componment.
   * So we need to operate editor creation and destroy manually by listening on route.
   * relative PR: https://github.com/emqx/MQTTX/pull/518 https://github.com/emqx/MQTTX/pull/446
   */
  @Watch('$route.params.id', { immediate: true, deep: true })
  private handleIdChanged(to: string, from: string) {
    const editorRef = this.$refs.payloadEditor as Editor
    if (to && from === '0' && to !== '0') {
      // Init the editor when rout jump from creation page
      editorRef.initEditor()
    } else if (from && from !== '0' && to === '0') {
      // destroy the editor when rout jump to creation page
      editorRef.destroyEditor()
    }
  }

  private handleHeaderChange(val: HistoryMessageHeaderModel) {
    if (val) {
      const { retain, topic, qos } = val
      Object.assign(this.msgRecord, { retain, topic, qos })
    }
  }

  // Notice: add editor creation and destroy manually export for it's father componment.
  public editorDestory() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.destroyEditor()
  }
  public editorInit() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.initEditor()
  }

  private async send() {
    this.msgRecord.mid = uuidv4()
    this.$emit('handleSend', this.msgRecord, this.payloadType, this.loadHistoryData)
  }

  private handleInputFoucs() {
    ipcRenderer.on('sendPayload', () => {
      this.send()
    })
    this.$emit('foucs')
  }

  private handleInputBlur() {
    ipcRenderer.removeAllListeners('sendPayload')
  }

  private handleLayout() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.editorLayout()
  }

  private beforeDestroy() {
    ipcRenderer.removeAllListeners('sendPayload')
  }

  private async loadHistoryData() {
    this.headersHistory = await loadHistoryMessageHeaders()
    this.payloadsHistory = await loadHistoryMessagePayloads()
    this.historyIndex = this.payloadsHistory.length - 1
  }

  private async loadData() {
    await this.loadHistoryData()
    Object.assign(
      this.msgRecord,
      this.defaultMsgRecord,
      this.headersHistory[this.headersHistory.length - 1],
      this.payloadsHistory[this.payloadsHistory.length - 1],
    )
  }

  private created() {
    this.loadData()
  }

  private decrease() {
    this.historyIndex = this.historyIndex - 1 >= 0 ? this.historyIndex - 1 : 0
  }

  private back() {
    this.historyIndex = this.payloadsHistory.length - 1
  }

  private increase() {
    this.historyIndex =
      this.historyIndex + 1 <= this.payloadsHistory.length - 1 ? this.historyIndex + 1 : this.payloadsHistory.length - 1
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.msg-publish {
  position: relative;
  background: var(--color-bg-normal);
  transition: 0.3s height;
  border-top: 1px solid var(--color-border-default);
  .publish-header {
    padding: 0 16px;
    margin-bottom: 4px;
  }
  .topic-input.el-input {
    width: calc(100% - 20px);
    vertical-align: top;

    display: inline-block;
    .el-input__inner {
      border: 0px;
      border-radius: 0px;
      padding: 0px;
      height: 36px;
      line-height: 36px;
      border-bottom: 1px solid var(--color-border-default);
    }
  }
  .header-select.el-select {
    vertical-align: top;
    width: 20px;
    display: inline-block;
    .el-input {
      .el-input__inner {
        border: 0px;
        border-radius: 0px;
        padding: 0px;
        height: 36px;
        line-height: 36px;
        border-bottom: 1px solid var(--color-border-default);
      }
      &.is-focus {
        .el-input__inner {
          border: 0px;
          border-radius: 0px;
          padding: 0px;
          height: 36px;
          line-height: 36px;
          border-bottom: 1px solid var(--color-border-default);
        }
      }
    }
  }
  .editor-container {
    padding: 0 6px;
    display: flex;
    justify-content: space-around;
    .publish-footer {
      flex: 1 1 auto;
    }
    .publish-right-bar {
      width: 85px;
      .history-icon {
        width: 70px;
        height: 10px;
        .el-button + .el-button {
          margin-left: 5px;
        }
        .el-button--mini.is-circle {
          padding: 3px;
        }
      }
    }
    .send-btn {
      position: fixed;
      right: 16px;
      bottom: 10px;
      .icon-send {
        font-size: $font-size--send;
      }
    }
  }
  .qos-retain {
    line-height: 35px;
    background: var(--color-bg-normal);
    .publish-label {
      color: var(--color-text-default);
      margin-right: 8px;
    }
    .payload-select {
      width: 95px;
      margin-right: 10px;
    }
    .qos-select {
      width: 55px;
    }
    .retain-block {
      float: right;
    }
    .el-checkbox__inner {
      border-radius: 100%;
    }
  }
  .disabled-mask {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-primary);
    opacity: 0.5;
    cursor: not-allowed;
    z-index: 9;
    top: 0;
  }
}
.el-select-dropdown.el-popper {
  width: 300px;
}
</style>
