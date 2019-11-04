<template>
  <div class="connections-content">
    <div class="connections-topbar right-topbar">
      <div class="connections-info topbar">
          <div class="connection-head">
          <h2>{{ record.name }}</h2>
          <a v-if="isConnected" href="javascript:;" @click.stop="showSubs">
            {{ record.subscriptions.length }} {{ $t('connections.subscription') }}
          </a>
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
          <el-radio-group :disabled="messages.length <= 0" v-model="msgType" size="mini">
            <el-radio-button label="all">{{ $t('connections.all') }}</el-radio-button>
            <el-radio-button label="received">{{ $t('connections.received') }}</el-radio-button>
            <el-radio-button label="publish">{{ $t('connections.published') }}</el-radio-button>
          </el-radio-group>
        </div>
        <div v-for="(message, index) in messages" :key="index">
          <MsgLeftItem
            v-if="!message.out"
            v-bind="message"/>
          <MsgRightItem
            v-else
            v-bind="message"/>
        </div>
      </div>
      <div class="connections-footer">
        <el-button
          :loading="connectLoading"
          v-if="!isConnected"
          class="connect-btn"
          type="primary"
          @click="connect">
          {{ $t('connections.connectBroker') }}
        </el-button>
        <div v-else ref="messagesInput" :class="['connections-input', isEdit ? 'message' : 'message-disabled']">
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
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import mqtt, { MqttClient } from 'mqtt'
import { updateConnection } from '@/utils/api/connection'
import time from '@/utils/time'
import clickHide from '@/utils/clickHide'
import MsgRightItem from './MsgRightItem.vue'
import MsgLeftItem from './MsgLeftItem.vue'
import { ConnectionModel, MessageModel } from './types'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
  },
})
export default class ConnectionsContent extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  private isEdit: boolean = false
  private connectLoading: boolean = false
  private msgType: 'all' | 'received' | 'publish' = 'all'
  private searchVisible: boolean = false
  private messages: MessageModel[] | [] = []
  private msgRecord: MessageModel = {
    createAt: '',
    out: true,
    qos: 0,
    retain: false,
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
  }
  private payload: string = JSON.stringify({
    temperature: { time: 1523523523, value: 100000000 },
  }, null, 2)

  get isConnected(): boolean {
    return this.record.client.connected
  }

  get connectUrl(): string {
    const {
      host, port, path,
    } = this.record
    const protocol = 'mqtt://'
    return `${protocol}${host}:${port}${path.startsWith('/') ? '' : '/'}${path}`
  }

  @Watch('isEdit')
  private handleEditChange(val: boolean) {
    if (val) {
      this.inputVisibleChange('open')
    } else {
      this.inputVisibleChange('close')
    }
  }

  private sendMsg(): void {
    console.log('is sended')
  }

  private getMessages() {
    this.msgType = 'all'
    if (this.record) {
      this.messages = this.record.messages
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

  private connect(): boolean | void {
    if (this.record.client.connected) {
      return false
    }
    this.connectLoading = true
    const client: MqttClient = this.createClient()
    const { id } = this.record
    this.record.client = client
    if (id) {
      this.record.client.on('connect', this.onConnect)
      this.record.client.on('error', this.onError)
      this.record.client.on('reconnect', this.onReConnect)
      this.record.client.on('message', this.messageArrived(id))
    }
  }

  private createClient(): MqttClient {
    const reconnectPeriod = 4000
    const {
      clientId, username, password, keepalive, clean, connectTimeout,
    } = this.record
    const client: MqttClient = mqtt.connect(this.connectUrl, {
      clientId,
      username,
      password,
      keepalive,
      clean,
      connectTimeout,
      reconnectPeriod,
    })
    return client
  }

  private disconnect() {
    if (this.record.client.connected) {
      this.record.subscriptions = []
      updateConnection(this.record.id as string, this.record)
      this.record.client.end()
      this.$message.success(this.$t('connections.disconnected') as string)
    }
  }
  private onConnect() {
    this.connectLoading = false
    this.$message.success(this.$t('connections.connected') as string)
    updateConnection(this.record.id as string, this.record)
  }
  private onError() {
    this.connectLoading = false
    this.$message.error(this.$t('connections.connectFailed') as string)
  }
  private onReConnect() {
    this.record.client.end()
    this.connectLoading = false
    this.$message.error(this.$t('connections.connectFailed') as string)
  }
  private messageArrived(id: string) {
    return (topic: string, payload: string, packet: SubscriptionModel) => {
      const message = {
        out: false,
        createAt: time.getNowDate(),
        topic,
        payload: payload.toString(),
        qos: packet.qos,
        retain: packet.retain,
      }
    }
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
