<template>
  <div class="connections-content">
    <div class="connections-topbar right-topbar">
      <div class="connections-info topbar">
          <div class="connection-head">
          <h2>Device xxx</h2>
          <a v-if="isConnected" href="javascript:;" @click.stop="showSubs">6 {{ $t('connections.subscription') }}</a>
          <a v-else class="error" href="javascript:;">{{ $t('connections.disconnected') }}</a>
        </div>
        <div class="connection-tail">
          <a href="javascript:;" @click="searchVisible = !searchVisible">
            <i class="iconfont icon-search"></i>
          </a>
          <el-dropdown trigger="click">
            <a href="javascript:;">
              <i class="el-icon-more"></i>
            </a>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <i class="iconfont icon-client"></i>{{ $t('connections.clientInfo') }}
              </el-dropdown-item>
              <el-dropdown-item>
                <i class="iconfont icon-clear"></i>{{ $t('connections.clearHistory') }}
              </el-dropdown-item>
              <el-dropdown-item>
                <i class="iconfont icon-disconnect"></i>{{ $t('connections.disconnect') }}
              </el-dropdown-item>
              <el-dropdown-item>
                <i class="iconfont icon-delete"></i>{{ $t('connections.deleteConnect') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <transition name="el-zoom-in-top">
        <div v-if="searchVisible" class="connections-search topbar">
          <el-input size="small" :placeholder="$t('connections.searchByTopic')">
            <i slot="suffix" class="iconfont icon-search"></i>
          </el-input>
          <a href="javascript:;" class="close-search" @click="searchVisible = false">
            <i class="el-icon-circle-close"></i>
          </a>
        </div>
      </transition>
    </div>

    <div :class="['connections-content-main', 'right-content', isEdit ? 'foucs' : '']">
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
          :qos="0"
          :payload="payload"
          createAt="2019-09-32 12:32:11"/>
        <MsgRightItem
          topic="/some/topic1"
          :qos="0"
          :payload="payload"
          createAt="2019-09-32 12:32:11"/>
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
  private searchVisible: boolean = false
  private isConnected: boolean = true

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

  private showSubs(): void {
    this.$emit('click-subs')
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
  .connections-topbar {
    .connections-info {
      padding: 0 16px;
      background-color: var(--color-bg-normal);
    }
    .connections-search {
      padding: 0 16px;
      height: 64px;
      background-color: var(--color-bg-normal);
      .icon-search {
        line-height: 32px;
      }
      .el-input {
        .el-input__inner {
          background: var(--color-bg-primary);
        }
      }
      .close-search {
        font-size: 18px;
        color: var(--color-text-default);
        margin-left: 10px;
      }
    }
    .icon-search {
      margin-right: 10px;
    }
  }

  .connections-content-main {
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
}
</style>
