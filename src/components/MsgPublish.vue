<template>
  <div class="msg-publish message">
    <div class="qos-retain">
      <span class="publish-label">Payload: </span>
      <el-select
        class="payload-select"
        size="mini"
        v-model="payloadType">
        <el-option
          v-for="(type, index) in payloadOptions"
          :key="index"
          :value="type">
        </el-option>
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
      @blur="handleInputBlur">
    </el-input>
    <div
      class="editor-container"
      :style="{
        height: `${editorHeight}px`
      }">
      <Editor
        ref="payloadEditor"
        id="payload"
        :lang="payloadLang"
        v-model="msgRecord.payload"
        @enter-event="send"
        @focus="handleInputFoucs"
        @blur="handleInputBlur"/>
    </div>
    <a
      href="javascript:;"
      class="send-btn"
      @click="send">
      <i class="iconfont icon-send"></i>
    </a>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import jump from 'jump.js'
import Editor from '@/components/Editor.vue'
import { MessageModel } from '../views/connections/types'
import convertPayload from '@/utils/convertPayload'

@Component({
  components: {
    Editor,
  },
})
export default class MsgPublish extends Vue {
  @Prop({ required: true }) public editorHeight!: number
  @Prop({ required: true }) public subsVisible!: boolean

  private msgRecord: MessageModel = {
    createAt: '',
    out: true,
    qos: 0,
    retain: false,
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
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
    convertPayload(payload, val, oldVal).then((res) => {
      this.msgRecord.payload = res
      if (val === 'JSON') {
        this.payloadLang = 'json'
      } else {
        this.payloadLang = 'plaintext'
      }
    }).catch((error) => {
      const errorMsg = error.toString()
      this.$message.error(errorMsg)
      this.payloadType = oldVal
    })
  }

  private send() {
    this.$emit('handleSend', this.msgRecord)
  }

  private handleInputFoucs() {
    ipcRenderer.on('sendPayload', () => {
      this.send()
    })
    jump(document.body.scrollHeight)
  }
  private handleInputBlur() {
    ipcRenderer.removeAllListeners('sendPayload')
  }

  private beforeDestroy() {
    ipcRenderer.removeAllListeners('sendPayload')
  }

  private handleLayout() {
    const editorRef: EditorRef = this.$refs.payloadEditor as EditorRef
    editorRef.editorLayout()
  }
}
</script>


<style lang="scss">
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

.msg-publish {
  background: var(--color-bg-normal);
  padding: 0px 16px;
  transition: .3s height;
  .topic-input.el-input {
    .el-input__inner {
      border: 0px;
      border-radius: 0px;
      padding: 0px;
      height: 36px;
      line-height: 36px;
      border-bottom: 1px solid var(--color-border-default);
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
      margin-right: 10px
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
  textarea {
    resize: none;
  }
  .el-textarea {
    .el-textarea__inner {
      border: 0px;
      border-top: 1px solid var(--color-border-default);
      border-radius: 0px;
      padding: 8px 0px;
      &:focus,
      &:hover {
        border-color: var(--color-border-default);
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
</style>
