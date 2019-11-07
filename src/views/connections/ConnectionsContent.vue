<template>
  <div class="connections-content">
    <div class="connections-topbar right-topbar">
      <div class="connections-info topbar">
          <div class="connection-head">
          <h2>{{ record.name }}</h2>
          <a v-if="client.connected" href="javascript:;" @click.stop="showSubs">
            {{ record.subscriptions.length }} {{ $t('connections.subscription') }}
          </a>
          <a v-else class="error" href="javascript:;">{{ $t('connections.disconnected') }}</a>
        </div>
        <div class="connection-tail">
          <a href="javascript:;" @click="searchVisible = !searchVisible">
            <i class="iconfont icon-search"></i>
          </a>
          <el-dropdown trigger="click" @command="handleCommand">
            <a href="javascript:;">
              <i class="el-icon-more"></i>
            </a>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="viewClient">
                <i class="iconfont icon-client"></i>{{ $t('connections.clientInfo') }}
              </el-dropdown-item>
              <el-dropdown-item command="clearHistory">
                <i class="iconfont icon-clear"></i>{{ $t('connections.clearHistory') }}
              </el-dropdown-item>
              <el-dropdown-item command="disconnect">
                <i class="iconfont icon-disconnect"></i>{{ $t('connections.disconnect') }}
              </el-dropdown-item>
              <el-dropdown-item command="deleteConnect">
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
          <el-radio-group :disabled="messages.length <= 0" v-model="msgType" size="mini" @change="handleMsgTypeChanged">
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
          v-if="!client.connected"
          class="connect-btn"
          type="primary"
          @click="connect">
          {{ $t('connections.connectBroker') }}
        </el-button>
        <div v-else ref="messagesInput" :class="['connections-input', isEdit ? 'message' : 'message-disabled']">
          <el-input
            :placeholder="isEdit ? 'Topic' : $t('connections.writeMsg')"
            v-model="msgRecord.topic"
            @focus="handleInputFoucs">
          </el-input>
          <div class="qos-retain" v-if="isEdit">
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
            v-if="isEdit"
            type="textarea"
            rows="4"
            placeholder="Payload"
            v-model="msgRecord.payload">
          </el-input>
          <a
            href="javascript:;"
            class="send-btn"
            @click="sendMessage">
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
import jump from 'jump.js'
import { Getter, Action } from 'vuex-class'
import { deleteConnection, updateConnection } from '@/utils/api/connection'
import time from '@/utils/time'
import clickHide from '@/utils/clickHide'
import MsgRightItem from './MsgRightItem.vue'
import MsgLeftItem from './MsgLeftItem.vue'
import { ConnectionModel, MessageModel } from './types'

type MessageType = 'all' | 'received' | 'publish'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
  },
})
export default class ConnectionsContent extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs: any
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection: any
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection: any
  @Getter('activeConnection') private activeConnection: any

  private client: $TSFixed = {}
  private subsList: SubscriptionModel[] = []
  private isEdit: boolean = false
  private connectLoading: boolean = false
  private msgType: MessageType = 'all'
  private searchVisible: boolean = false
  private messages: MessageModel[] = []
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

  get connectUrl(): string {
    const {
      host, port, path, ssl,
    } = this.record
    const protocol = ssl ? 'mqtts://' : 'mqtt://'
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

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
    this.getClientValue(val.id as string)
    this.getMessages(val)
  }

  private getMessages(connection: ConnectionModel) {
    this.msgType = 'all'
    if (connection) {
      this.messages = connection.messages
    }
  }

  private getClientValue(id: string): void {
    const $activeConnection = this.activeConnection[id]
    if ($activeConnection) {
      this.subsList = $activeConnection.subscriptions || []
      this.client = $activeConnection.client
    } else {
      if (this.record.clean) {
        this.subsList = []
        this.record.subscriptions = []
        updateConnection(this.record.id as string, this.record)
      } else {
        this.subsList = this.record.subscriptions
      }
      this.client = {}
    }
  }

  private sendMessage(): void | boolean {
    if (!this.client.connected) {
      return false
    }
    const {
      topic, qos, payload, retain,
    } = this.msgRecord
    const notSend = retain ? !topic : !topic || !payload
    if (notSend) {
      return false
    }
    this.client.publish(
      topic,
      payload,
      { qos, retain },
      (error: string) => {
        if (error) {
          this.$message.error(error)
          return false
        }
        const publishMessage: MessageModel = {
          out: true,
          createAt: time.getNowDate(),
          topic,
          payload,
          qos,
          retain,
        }
        this.messages.push({ ...publishMessage })
        this.record.messages = this.messages
        updateConnection(this.record.id as string, this.record)
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight + 190)
        }, 100)
      },
    )
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

  private handleInputFoucs(): void {
    this.isEdit = true
    jump(document.body.scrollHeight)
  }

  private handleCommand(command: string): void {
    if (command === 'disconnect') {
      this.disconnect()
    } else if (command === 'deleteConnect') {
      this.removeConnection()
    } else if (command === 'clearHistory') {
      this.messages = []
      this.record.messages = []
      updateConnection(this.record.id as string, this.record)
      this.msgType = 'all'
    }
  }

  private handleMsgTypeChanged(type: MessageType): void {
    if (type === 'received') {
      this.messages = this.record.messages.filter(($: MessageModel) => !$.out)
    } else if (type === 'publish') {
      this.messages = this.record.messages.filter(($: MessageModel) => $.out)
    } else {
      this.messages = this.record.messages
    }
  }

  private removeConnection(): void {
    const confirmDelete: string = this.$t('common.confirmDelete', { name: this.record.name }) as string
    this.$confirm(confirmDelete, this.$t('common.warning') as string, {
      type: 'warning',
    }).then(async () => {
      const res: ConnectionModel | null = await deleteConnection(this.record.id as string)
      if (res) {
        this.$emit('delete')
        this.$message({
          type: 'success',
          message: this.$t('common.deleteSuccess') as string,
        })
        this.removeActiveConnection({ id: res.id })
      }
    }).catch((error) => {
      console.error(error)
    })
  }

  private createClient(): MqttClient {
    const reconnectPeriod = 4000
    const {
      clientId, username, password, keepalive, clean, connectTimeout,
    } = this.record
    return mqtt.connect(this.connectUrl, {
      clientId,
      username,
      password,
      keepalive,
      clean,
      connectTimeout,
      reconnectPeriod,
    })
  }
  private connect(): boolean | void {
    if (this.client.connected) {
      return false
    }
    this.connectLoading = true
    this.client = this.createClient()
    const { id } = this.record
    if (id) {
      this.client.on('connect', this.onConnect)
      this.client.on('error', this.onError)
      this.client.on('reconnect', this.onReConnect)
      this.client.on('message', this.messageArrived(id))
    }
  }
  private disconnect(): boolean | void {
    if (!this.client.connected) {
      return false
    }
    if (this.record.clean) {
      this.record.subscriptions = []
      this.changeSubs({ id: this.record.id, subscription: [] })
      updateConnection(this.record.id as string, this.record)
    }
    this.client.end()
    this.changeActiveConnection({ id: this.record.id, client: this.client })
    this.$message.success(this.$t('connections.disconnected') as string)
    this.$emit('reload')
  }
  private onConnect() {
    this.connectLoading = false
    this.changeActiveConnection({ id: this.record.id, client: this.client })
    this.$message.success(this.$t('connections.connected') as string)
    this.$emit('reload')
  }
  private onError() {
    this.client.end()
    this.connectLoading = false
    this.$message.error(this.$t('connections.connectFailed') as string)
  }
  private onReConnect() {
    this.client.end()
    this.connectLoading = false
    this.$message.error(this.$t('connections.connectFailed') as string)
  }
  private messageArrived(id: string) {
    return (topic: string, payload: string, packet: SubscriptionModel) => {
      const receivedMessage: MessageModel = {
        out: false,
        createAt: time.getNowDate(),
        topic,
        payload: payload.toString(),
        qos: packet.qos,
        retain: packet.retain as boolean,
      }
      this.messages.push({ ...receivedMessage })
      this.record.messages = this.messages
      updateConnection(this.record.id as string, this.record)
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight + 190)
      }, 100)
    }
  }

  private created(): void {
    const { id } = this.$route.params
    this.getClientValue(id)
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
        .qos-retain {
          border-top: 1px solid var(--color-border-default);
          position: absolute;
          top: 1px;
          right: 35px;
          padding-left: 32px;
          text-align: right;
          line-height: 40px;
          background: var(--color-bg-normal);
          .publish-label {
            color: var(--color-text-default);
            margin-right: 16px;
          }
          .el-radio-group {
            margin-right: 32px;
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
