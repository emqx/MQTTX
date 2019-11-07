<template>
  <div class="connections-content">
    <div class="connections-topbar right-topbar">
      <div class="connections-info">
        <div class="topbar">
          <div class="connection-head">
            <h2 :class="{ offline: !client.connected }">
              {{ record.name }}
              <a
                href="javascript:;"
                :class="['collapse-btn', showClientInfo ? 'top': 'bottom']"
                @click="handleCollapse">
                <i class="el-icon-d-arrow-left"></i>
              </a>
            </h2>
          </div>
          <div class="connection-tail">
            <a href="javascript:;" @click="searchVisible = !searchVisible">
              <i class="iconfont icon-search"></i>
            </a>
            <el-dropdown class="connection-oper" trigger="click" @command="handleCommand">
              <a href="javascript:;">
                <i class="el-icon-more"></i>
              </a>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="viewClient">
                  <i class="iconfont icon-client"></i>{{ $t('connections.brokerInfo') }}
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
        <el-collapse-transition>
          <ConnectionForm
            v-show="showClientInfo"
            class="connection-form"
            :connection="record"
            :client="client"
            :btn-loading="connectLoading"
            @handleConfirm="connect"
            @handleCancel="disconnect"/>
        </el-collapse-transition>
      </div>

      <transition name="el-zoom-in-top">
        <div v-show="searchVisible" class="connections-search topbar">
          <el-input size="small" :placeholder="$t('connections.searchByTopic')">
            <i slot="suffix" class="iconfont icon-search"></i>
          </el-input>
          <a href="javascript:;" class="close-search" @click="searchVisible = false">
            <i class="el-icon-circle-close"></i>
          </a>
        </div>
      </transition>
    </div>

    <div
      class="connections-content-main right-content"
      :style="{
        paddingTop: showClientInfo ? '286px': '88px',
      }">
      <div class="connections-body">
        <div class="filter-bar" :style="{ top: showClientInfo ? '258px': '60px' }">
          <span class="subs-title">
            {{ this.$t('connections.subscriptions') }}
            <a class="subs-btn" href="javascript:;">
              <i class="el-icon-s-unfold"></i>
            </a>
          </span>
          <div class="message-type">
            <el-radio-group
              :disabled="messages.length <= 0"
              v-model="msgType" size="mini"
              @change="handleMsgTypeChanged">
              <el-radio-button label="all">{{ $t('connections.all') }}</el-radio-button>
              <el-radio-button label="received">{{ $t('connections.received') }}</el-radio-button>
              <el-radio-button label="publish">{{ $t('connections.published') }}</el-radio-button>
            </el-radio-group>
          </div>
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
        <MsgPublish
          @handleSend="sendMessage"/>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import mqtt, { MqttClient } from 'mqtt'
import { Getter, Action } from 'vuex-class'
import { deleteConnection, updateConnection } from '@/utils/api/connection'
import time from '@/utils/time'
import MsgRightItem from './MsgRightItem.vue'
import MsgLeftItem from './MsgLeftItem.vue'
import MsgPublish from './MsgPublish.vue'
import ConnectionForm from './ConnectionForm.vue'
import { ConnectionModel, MessageModel } from './types'

type MessageType = 'all' | 'received' | 'publish'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
    ConnectionForm,
    MsgPublish,
  },
})
export default class ConnectionsContent extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs: any
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection: any
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection: any
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo: any
  @Getter('activeConnection') private activeConnection: any

  private client: $TSFixed = {}
  private subsList: SubscriptionModel[] = []
  private showClientInfo: boolean = true
  private connectLoading: boolean = false
  private msgType: MessageType = 'all'
  private searchVisible: boolean = false
  private messages: MessageModel[] = []

  get connectUrl(): string {
    const {
      host, port, path, ssl,
    } = this.record
    const protocol = ssl ? 'mqtts://' : 'mqtt://'
    return `${protocol}${host}:${port}${path.startsWith('/') ? '' : '/'}${path}`
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
      this.showClientInfo = $activeConnection.showClientInfo
    } else {
      this.subsList = []
      this.client = {}
      this.showClientInfo = true
    }
  }

  private sendMessage(message: MessageModel): void | boolean {
    if (!this.client.connected) {
      this.$notify({
        title: this.$t('connections.notConnect') as string,
        message: '',
        type: 'error',
        duration: 3000,
      })
      return false
    }
    const {
      topic, qos, payload, retain,
    } = message
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
          window.scrollTo(0, document.body.scrollHeight + 120)
        }, 100)
      },
    )
  }

  private handleCollapse(): void {
    this.showClientInfo = !this.showClientInfo
    this.changeShowClientInfo({ id: this.record.id, showClientInfo: this.showClientInfo })
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
      // ignore(error)
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
    this.$notify({
      title: this.$t('connections.disconnected') as string,
      message: '',
      type: 'success',
      duration: 3000,
    })
    this.$emit('reload')
  }
  private onConnect() {
    this.connectLoading = false
    this.changeActiveConnection({ id: this.record.id, client: this.client })
    this.$notify({
      title: this.$t('connections.connected') as string,
      message: '',
      type: 'success',
      duration: 3000,
    })
    setTimeout(() => {
      this.showClientInfo = false
      this.changeShowClientInfo({ id: this.record.id, showClientInfo: this.showClientInfo })
    }, 500)
    this.$emit('reload')
  }
  private onError() {
    this.client.end()
    this.connectLoading = false
    this.$notify({
      title: this.$t('connections.connectFailed') as string,
      message: '',
      type: 'error',
      duration: 3000,
    })
  }
  private onReConnect() {
    this.client.end()
    this.connectLoading = false
    this.$notify({
      title: this.$t('connections.connectFailed') as string,
      message: '',
      type: 'error',
      duration: 3000,
    })
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
        window.scrollTo(0, document.body.scrollHeight + 120)
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
    border-bottom: 1px solid var(--color-border-default);
    .connections-info {
      padding: 0 16px;
      background-color: var(--color-bg-normal);
      .topbar {
        border-bottom: 0px;
        min-height: 59px;
      }
      .connection-head {
        .offline {
          color: var(--color-text-light);
        }
        a.collapse-btn {
          font-size: 16px;
          float: right;
          margin-left: 18px;
          transition: all .3s;
          &.top {
            transform: rotate(90deg);
          }
          &.bottom {
            transform: rotate(-90deg);
          }
        }
      }
      .connection-tail {
        .el-dropdown.connection-oper {
          a {
            width: 24px;
            display: inline-block;
            text-align: center;
          }
        }
      }
    }
    .connections-search {
      padding: 0 16px 10px 16px;
      height: auto;
      background-color: var(--color-bg-normal);
      &.topbar {
        border-bottom: 0px;
        min-height: 0px;
      }
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
    padding: 88px 0 120px 0;
    transition: all .5s;
    .connections-body {
      padding: 16px;
      .filter-bar {
        padding: 12px 16px;
        z-index: 1;
        background: var(--color-bg-primary);
        position: fixed;
        left: 300px;
        right: 0;
        z-index: 1;
        transition: all .4s;
        .subs-title {
          color: var(--color-text-title);
          position: absolute;
          top: 11px;
        }
        .subs-btn {
          font-size: 20px;
          position: relative;
          top: 3px;
        }
        .message-type {
          text-align: center;
        }
      }
    }
    .connections-footer {
      position: fixed;
      width: inherit;
      bottom: 0;
      left: 0;
      right: 0;
      margin-left: 300px;
    }
  }
}
</style>
