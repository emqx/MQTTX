<template>
  <div :class="['connections-content', 'right-content', isEdit ? 'foucs' : '']">
    <div class="connections-body">
      <div class="message-type">
        <el-radio-group v-model="msgType" size="mini">
          <el-radio-button label="all">{{ $t('connections.all') }}</el-radio-button>
          <el-radio-button label="received">{{ $t('connections.received') }}</el-radio-button>
          <el-radio-button label="publish">{{ $t('connections.published') }}</el-radio-button>
        </el-radio-group>
      </div>
      <MsgLeftItem
        topic="/some/topic1"
        :payload="payload"
        time="2019-09-32 12:32:11"/>
      <MsgRightItem
        topic="/some/topic1"
        :payload="payload"
        time="2019-09-32 12:32:11"/>
    </div>
    <div class="connections-footer">
      <!-- <el-button
        class="connect-btn"
        type="primary">
        {{ $t('connections.connectBroker') }}
      </el-button> -->
      <div ref="messagesInput" :class="['connections-input', isEdit ? 'message' : 'message-disabled']">
        <el-input
          :placeholder="isEdit ? 'Topic' : $t('connections.writeMsg')"
          v-model="msgRecord.topic"
          @focus="isEdit = true">
        </el-input>
        <el-input
          v-if="isEdit"
          type="textarea"
          rows="4"
          placeholder="Payload"
          v-model="msgRecord.payload">
        </el-input>
        <a
          href="javascript:;"
          class="send-btn"
          @click="sendMsg">
          <i class="iconfont icon-send"></i>
        </a>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import clickHide from '@/utils/clickHide'
import MsgRightItem from './MsgRightItem.vue'
import MsgLeftItem from './MsgLeftItem.vue'

interface MessageModel {
  topic: string,
  payload: string,
}

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
  },
})
export default class ConnectionsContent extends Vue {
  private isEdit: boolean = false
  private msgType: string = 'all'
  private msgRecord: MessageModel = {
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
  }

  private payload: string = JSON.stringify({
    temperature: { time: 1523523523, value: 100000000 },
  }, null, 2)

  private sendMsg(): void {
    console.log('is sended')
  }

  @Watch('isEdit')
  private handleEditChange(val: boolean) {
    if (val) {
      this.inputVisibleChange('open')
    } else {
      this.inputVisibleChange('close')
    }
  }

  private inputVisibleChange(type: 'close' | 'open'): void {
    if (type === 'open') {
      document.addEventListener('click', this.hideInput)
    } else {
      document.removeEventListener('click', this.hideInput)
    }
  }

  private hideInput(e: MouseEvent) {
    this.isEdit = clickHide('.connections-input', e)
  }
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

.connections-content {
  height: 100%;
  padding: 60px 0;
  &.foucs {
    padding-bottom: 200px;
  }
  .connections-body {
    padding: 16px;
    .message-type {
      text-align: center;
      margin-bottom: 5px;
    }
  }
  .connections-footer {
    position: fixed;
    width: inherit;
    bottom: 0;
    left: 0;
    right: 0;
    margin-left: 300px;
    .connect-btn {
      width: 100%;
      height: 60px;
      border-radius: 0px;
      font-size: $font-size--title;
    }
    .connections-input {
      background: var(--color-bg-normal);
      border-top: 2px solid var(--color-border-default);
      padding: 0px 16px;
      transition: .3s height;
      .el-input__inner {
        border: 0px;
        border-radius: 0px;
        padding: 0px;
      }
      textarea {
        resize: none;
      }
      .el-textarea__inner {
        border-color: var(--color-border-default);
        border-left: 0px;
        border-right: 0px;
        border-bottom: 0px;
        border-radius: 0px;
        padding: 8px 0px;
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
        height: 200px;
      }
      &.message-disabled {
        @include flex-space-between;
        width: 100%;
        height: 60px;
        padding-right: 16px;
        .send-btn {
          color: var(--color-text-tips);
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
