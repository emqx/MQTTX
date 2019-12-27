<template>
  <div class="msg-publish message">
    <el-input
      placeholder="Topic"
      v-model="msgRecord.topic"
      @focus="handleInputFoucs">
    </el-input>
    <div class="qos-retain">
      <span class="publish-label">QoS: </span>
      <el-radio-group v-model="msgRecord.qos">
        <el-radio :label="0"></el-radio>
        <el-radio :label="1"></el-radio>
        <el-radio :label="2"></el-radio>
      </el-radio-group>
      <span class="publish-label">Retain: </span>
      <el-checkbox v-model="msgRecord.retain"></el-checkbox>
    </div>
    <el-input
      type="textarea"
      rows="3"
      placeholder="Payload"
      v-model="msgRecord.payload"
      @focus="handleInputFoucs">
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
import { Component, Vue, Prop } from 'vue-property-decorator'
import jump from 'jump.js'
import { MessageModel } from '../views/connections/types'

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

  private send(): void {
    this.$emit('handleSend', this.msgRecord)
  }

  private handleInputFoucs(): void {
    jump(document.body.scrollHeight)
  }
}
</script>


<style lang="scss">
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

.msg-publish {
  background: var(--color-bg-normal);
  border-top: 1px solid var(--color-border-default);
  padding: 0px 16px;
  transition: .3s height;
  .el-input {
    .el-input__inner {
      border: 0px;
      border-radius: 0px;
      padding: 0px;
    }
  }
  .qos-retain {
    position: absolute;
    top: 1px;
    right: 35px;
    padding-left: 12px;
    text-align: right;
    line-height: 40px;
    background: var(--color-bg-normal);
    .publish-label {
      color: var(--color-text-default);
      margin-right: 8px;
    }
    .el-radio-group {
      margin-right: 8px;
      .el-radio {
        color: var(--color-text-default);
      }
    }
    .el-radio {
      margin-right: 16px;
      .el-radio__label {
        padding-left: 8px;
      }
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
  &.message {
    height: 120px;
  }
}
</style>
