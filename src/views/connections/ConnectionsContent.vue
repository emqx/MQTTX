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
                <el-dropdown-item command="viewBroker">
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
          <el-input
            v-model="searchTopic" 
            size="small"
            :placeholder="$t('connections.searchByTopic')">
            <a class="search-btn" href="javascript:;" slot="suffix" @click="searchByTopic">
              <i class="iconfont icon-search"></i>
            </a>
          </el-input>
          <a href="javascript:;" class="close-search" @click="handleSearchClose">
            <i class="el-icon-circle-close"></i>
          </a>
        </div>
      </transition>
    </div>

    <div
      class="connections-content-main right-content"
      :style="{
        paddingTop: showClientInfo ? '286px': '88px',
        marginLeft: showSubs ? '529px' : '280px',
      }">
      <div class="connections-body">
        <div class="filter-bar" :style="{ top: showClientInfo ? '258px': '60px' }">
          <span class="subs-title">
            {{ this.$t('connections.subscriptions') }}
            <a class="subs-btn" href="javascript:;" @click="handleShowSubs">
              <i class="iconfont icon-zhedie"></i>
            </a>
          </span>
          <div class="message-type">
            <el-radio-group
              v-model="msgType" size="mini"
              @change="handleMsgTypeChanged">
              <el-radio-button label="all">{{ $t('connections.all') }}</el-radio-button>
              <el-radio-button label="received">{{ $t('connections.received') }}</el-radio-button>
              <el-radio-button label="publish">{{ $t('connections.published') }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <SubscriptionsList
          :subsVisible.sync="showSubs"
          :connectionId="$route.params.id"
          :record="record"
          :top="showClientInfo ? '258px': '60px'"/>
        <div v-for="(message, index) in messages" :key="index">
          <MsgLeftItem
            v-if="!message.out"
            v-bind="message"/>
          <MsgRightItem
            v-else
            v-bind="message"/>
        </div>
      </div>

      <div
        class="connections-footer" 
        :style="{ marginLeft: showSubs ? '529px' : '280px' }">
        <MsgPublish
          @handleSend="sendMessage"/>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import mqtt, { MqttClient, IClientOptions } from 'mqtt'
import { Getter, Action } from 'vuex-class'
import { deleteConnection, updateConnection, updateConnectionMessage } from '@/utils/api/connection'
import time from '@/utils/time'
import MsgRightItem from './MsgRightItem.vue'
import MsgLeftItem from './MsgLeftItem.vue'
import MsgPublish from './MsgPublish.vue'
import ConnectionForm from './ConnectionForm.vue'
import SubscriptionsList from './SubscriptionsList.vue'
import { ConnectionModel, MessageModel } from './types'

type MessageType = 'all' | 'received' | 'publish'
type CommandType = 'viewBroker' | 'clearHistory' | 'disconnect' | 'deleteConnect'

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
    ConnectionForm,
    MsgPublish,
    SubscriptionsList,
  },
})
export default class ConnectionsContent extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs: $TSFixed
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection: $TSFixed
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection: $TSFixed
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo: $TSFixed
  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions: $TSFixed
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement: $TSFixed

  @Getter('activeConnection') private activeConnection: $TSFixed
  @Getter('showSubscriptions') private showSubscriptions!: boolean
  @Getter('showClientInfo') private clientInfoVisibles!: {
    [id: string]: boolean,
  }

  private client: $TSFixed = {}
  private showSubs: boolean = true
  private showClientInfo: boolean = true
  private connectLoading: boolean = false
  private msgType: MessageType = 'all'
  private searchVisible: boolean = false
  private messages: MessageModel[] = []
  private searchTopic: string = ''

  get connectUrl(): string {
    const {
      host, port, ssl,
    } = this.record
    const protocol = ssl ? 'mqtts://' : 'mqtt://'
    return `${protocol}${host}:${port}`
  }

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
    this.getConnectionValue(val.id as string)
    this.getMessages(val)
  }

  private getMessages(connection: ConnectionModel) {
    this.msgType = 'all'
    if (connection) {
      this.messages = connection.messages
    }
  }

  private getConnectionValue(id: string): void {
    const $activeConnection: {
      id?: string,
      client: MqttClient,
    } | undefined = this.activeConnection[id]
    const $clientInfoVisible: boolean | undefined = this.clientInfoVisibles[id]
    if ($clientInfoVisible === undefined) {
      this.showClientInfo = true
    } else {
      this.showClientInfo = $clientInfoVisible
    }
    this.showSubs = this.showSubscriptions
    if ($activeConnection) {
      this.client = $activeConnection.client
    } else {
      this.client = {}
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
        updateConnectionMessage(this.record.id as string, { ...publishMessage })
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight + 120)
        }, 100)
      },
    )
  }

  private handleShowSubs(): void {
    this.showSubs = !this.showSubs
    this.changeShowSubscriptions({ showSubscriptions: this.showSubs })
  }

  private handleCollapse(): void {
    this.showClientInfo = !this.showClientInfo
    this.changeShowClientInfo({ id: this.record.id, showClientInfo: this.showClientInfo })
  }

  private handleCommand(command: CommandType): void {
    if (command === 'disconnect') {
      this.disconnect()
    } else if (command === 'deleteConnect') {
      this.removeConnection()
    } else if (command === 'clearHistory') {
      this.messages = []
      this.record.messages = []
      updateConnection(this.record.id as string, this.record)
      this.msgType = 'all'
    } else if (command === 'viewBroker') {
      this.$router.push({ path: `/brokers/${this.record.brokeruuid}` })
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

  private searchByTopic(): void {
    this.getMessages(this.record)
    const $messages = [...this.messages]
    this.messages = $messages.filter(($: MessageModel) => $.topic === this.searchTopic)
  }

  private handleSearchClose(): void {
    this.searchVisible = false
    this.getMessages(this.record)
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
    const options: IClientOptions  = {
      clientId,
      keepalive,
      clean,
      connectTimeout,
      reconnectPeriod,
    }
    if (username !== '') {
      options.username = username
    }
    if (password !== '') {
      options.password = password
    }
    return mqtt.connect(this.connectUrl, options)
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
      if (id === this.record.id) {
        this.messages.push({ ...receivedMessage })
        this.record.messages = this.messages
        updateConnectionMessage(this.record.id as string, { ...receivedMessage })
      } else {
        updateConnectionMessage(id, { ...receivedMessage })
        this.unreadMessageIncrement({ id })
      }
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight + 120)
      }, 100)
    }
  }

  private created(): void {
    const { id } = this.$route.params
    this.getConnectionValue(id)
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
          font-size: 18px;
          float: right;
          margin-left: 12px;
          margin-top: -1px;
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
        .search-btn {
          color: var(--color-text-default); 
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
        background: var(--color-bg-primary);
        position: fixed;
        left: 280px;
        right: 0;
        z-index: 1;
        transition: all .4s;
        .subs-title {
          color: var(--color-text-title);
          position: absolute;
          top: 15px;
        }
        .subs-btn {
          position: relative;
          top: 1px;
          left: 3px;
          .icon-zhedie {
            display: inline-block;
            transform: rotate(180deg);
          }
        }
        .message-type {
          text-align: right;
        }
      }
    }
    .connections-footer {
      transition: all .4s ease;
      position: fixed;
      width: inherit;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }
}
</style>
