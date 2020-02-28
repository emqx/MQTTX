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
    <el-input
      type="textarea"
      rows="3"
      placeholder="Payload"
      v-model="msgRecord.payload"
      @focus="handleInputFoucs"
      @blur="handleInputBlur">
    </el-input>
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
import { MessageModel } from '../views/connections/types'
import convertPayload from '@/utils/convertPayload'

@Component
export default class MsgPublish extends Vue {

  private msgRecord: MessageModel = {
    createAt: '',
    out: true,
    qos: 0,
    retain: false,
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
  }

  private payloadType: PayloadType = 'Plaintext'
  private payloadOptions: PayloadType[] = ['Plaintext', 'Base64', 'JSON', 'Hex']

  @Watch('payloadType')
  private handleTypeChange(val: PayloadType, oldVal: PayloadType) {
    const { payload } = this.msgRecord
    convertPayload(payload, val, oldVal).then((res) => {
      this.msgRecord.payload = res
    }).catch((error) => {
      const errorMsg = error.toString()
      this.$message.error(errorMsg)
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
