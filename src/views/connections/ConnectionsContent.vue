<template>
  <div class="connections-content">
    <div class="connections-topbar right-topbar">
      <div class="connections-info">
        <div class="topbar">
          <div class="connection-head">
            <h2 :class="{ offline: !client.connected }">
              {{ titleName }}
              <a
                href="javascript:;"
                :class="['collapse-btn', showClientInfo ? 'top': 'bottom']"
                @click="handleCollapse($route.params.id)">
                <i class="el-icon-d-arrow-left"></i>
              </a>
            </h2>
          </div>
          <div class="connection-tail">
            <el-tooltip
              placement="bottom"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="1000"
              :content="$t('common.config')">
              <a :class="['edit-btn', { 'disabled': client.connected }]" 
              href="javascript:;" @click="handleEdit($route.params.id)">
                <i class="iconfont el-icon-edit-outline"></i>
              </a>
            </el-tooltip>
            <el-dropdown class="connection-oper" trigger="click" @command="handleCommand">
              <a href="javascript:;">
                <i class="el-icon-more"></i>
              </a>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="searchByTopic">
                  <i class="iconfont icon-search"></i>{{ $t('connections.searchByTopic') }}
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
          <ConnectionInfo
            v-show="showClientInfo"
            class="connection-info"
            :connection="record"
            :client="client"
            :btn-loading="connectLoading"
            @handleConnect="connect"
            @handleDisconnect="disconnect"
            @handleCancel="cancel"/>
        </el-collapse-transition>
      </div>

      <transition name="el-zoom-in-top">
        <div v-show="searchVisible" class="connections-search topbar">
          <el-input
            v-model="searchTopic" 
            size="small"
            :placeholder="$t('connections.searchByTopic')"
            @keyup.enter.native="searchByTopic">
            <a class="search-btn" href="javascript:;" slot="suffix" @click="searchByTopic">
              <i v-if="!searchLoading" class="iconfont icon-search"></i>
              <i v-else class="el-icon-loading"></i>
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
        paddingTop: showClientInfo ? msgTop.open: msgTop.close,
        marginLeft: showSubs ? '570px' : '341px',
      }">
      <div class="connections-body">
        <div class="filter-bar" :style="{ top: showClientInfo ? bodyTop.open: bodyTop.close }">
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
          :top="showClientInfo ? bodyTop.open: bodyTop.close"/>
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
        :style="{ marginLeft: showSubs ? '570px' : '341px' }">
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
import { getClientOptions } from '@/utils/mqttUtils'
import MsgRightItem from '@/components/MsgRightItem.vue'
import MsgLeftItem from '@/components/MsgLeftItem.vue'
import MsgPublish from '@/components/MsgPublish.vue'
import SubscriptionsList from '@/components/SubscriptionsList.vue'
import ConnectionInfo from './ConnectionInfo.vue'
import { ConnectionModel, MessageModel, SSLPath, SSLContent } from './types'

type MessageType = 'all' | 'received' | 'publish'
type CommandType = 'searchByTopic' | 'clearHistory' | 'disconnect' | 'deleteConnect'

interface Top {
  open: string,
  close: string,
}

@Component({
  components: {
    MsgRightItem,
    MsgLeftItem,
    ConnectionInfo,
    MsgPublish,
    SubscriptionsList,
  },
})
export default class ConnectionsContent extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs!: (payload: Subscriptions) => void
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('PUSH_MESSAGE') private pushMessage!: (payload: Message) => void
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection!: (payload: ActiveConnection) => void
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo!: (payload: ClientInfo) => void
  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions!: (payload: SubscriptionsVisible) => void
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: $TSFixed
  @Getter('showSubscriptions') private showSubscriptions!: boolean
  @Getter('currentTheme') private theme!: Theme
  @Getter('showClientInfo') private clientInfoVisibles!: {
    [id: string]: boolean,
  }

  private client: $TSFixed = {}
  private showSubs = true
  private showClientInfo = true
  private connectLoading = false
  private msgType: MessageType = 'all'
  private searchVisible = false
  private messages: MessageModel[] = []
  private searchTopic = ''
  private searchLoading = false
  private titleName: string = this.record.name
  private mqttVersionDict = {
    '3.1.1': 4,
    '5.0': 5,
  }

  public connect(): boolean | void {
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
      this.client.on('close', this.onClose)
      this.client.on('message', this.messageArrived(id))
    }
  }

  get bodyTop(): Top {
    return {
      open: '254px',
      close: '60px',
    }
  }

  get msgTop(): Top {
    return {
      open: '286px',
      close: '88px',
    }
  }

  get connectUrl(): string {
    const {
      host, port, ssl,
    } = this.record
    const protocol = ssl ? 'mqtts://' : 'mqtt://'
    return `${protocol}${host}:${port}`
  }

  @Watch('record')
  private handleRecordChanged() {
    const id: string = this.$route.params.id
    this.titleName = this.record.name
    this.getConnectionValue(id)
    this.getMessages(id)
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

  private handleShowSubs(): void {
    this.showSubs = !this.showSubs
    this.changeShowSubscriptions({ showSubscriptions: this.showSubs })
  }

  private handleCollapse(id: string): void {
    this.showClientInfo = !this.showClientInfo
    this.changeShowClientInfo({
      id,
      showClientInfo: this.showClientInfo,
    })
  }

  private handleCommand(command: CommandType): void {
    if (command === 'disconnect') {
      this.disconnect()
    } else if (command === 'deleteConnect') {
      this.removeConnection()
    } else if (command === 'clearHistory') {
      this.handleMsgClear()
    } else if (command === 'searchByTopic') {
      this.searchVisible = true
    }
  }

  private getMessages(id: string) {
    this.msgType = 'all'
    const $activeConnection = this.activeConnection[id]
    if ($activeConnection) {
      this.messages = $activeConnection.messages
    } else {
      this.messages = this.record.messages
    }
  }
  private handleMsgClear(): void {
    this.messages = []
    this.record.messages = []
    this.changeActiveConnection({
      id: this.$route.params.id,
      client: this.client,
      messages: this.messages,
    })
    updateConnection(this.record.id as string, this.record)
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
  private handleEdit(id: string): boolean | void {
    if (this.client.connected) {
      return false
    }
    this.$router.push({
      path: `/recent_connections/${id}`,
      query: { oper: 'edit' },
    })
  }
  private searchByTopic(): void {
    this.searchLoading = true
    setTimeout(() => {
      this.searchLoading = false
    }, 500)
    if (this.searchTopic !== '') {
      this.getMessages(this.$route.params.id)
      const $messages = [...this.messages]
      this.messages = $messages.filter(($: MessageModel) => $.topic === this.searchTopic)
    } else {
      this.getMessages(this.$route.params.id)
    }
  }
  private handleSearchClose(): void {
    this.searchVisible = false
    this.getMessages(this.$route.params.id)
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
        this.removeActiveConnection({ id: res.id as string })
      }
    }).catch((error) => {
      // ignore(error)
    })
  }

  private createClient(): MqttClient {
    const options: IClientOptions = getClientOptions(this.record)
    return mqtt.connect(this.connectUrl, options)
  }
  private cancel() {
    this.connectLoading = false
    this.client.end()
  }
  private disconnect(): boolean | void {
    if (!this.client.connected) {
      return false
    }
    const { id } = this.$route.params
    if (this.record.clean) {
      this.record.subscriptions = []
      this.changeSubs({ id, subscriptions: [] })
      updateConnection(id, this.record)
    }
    this.client.end()
    this.changeActiveConnection({
      id,
      client: this.client,
      messages: this.record.messages,
    })
    this.$notify({
      title: this.$t('connections.disconnected') as string,
      message: '',
      type: 'success',
      duration: 3000,
      offset: 20,
    })
    this.$emit('reload')
  }
  private onConnect() {
    this.connectLoading = false
    this.changeActiveConnection({
      id: this.$route.params.id,
      client: this.client,
      messages: this.record.messages,
    })
    this.$notify({
      title: this.$t('connections.connected') as string,
      message: '',
      type: 'success',
      duration: 3000,
      offset: 20,
    })
    setTimeout(() => {
      this.showClientInfo = false
      this.changeShowClientInfo({
        id: this.record.id as string,
        showClientInfo: this.showClientInfo,
      })
    }, 500)
    this.$emit('reload')
  }
  private onError(error: string) {
    let msgTitle = this.$t('connections.connectFailed') as string
    if (error) {
      msgTitle = error
    }
    this.client.end()
    this.connectLoading = false
    this.$notify({
      title: msgTitle,
      message: '',
      type: 'error',
      duration: 3000,
      offset: 20,
    })
    this.$emit('reload')
  }
  private onReConnect() {
    if (!this.record.reconnect) {
      this.client.end()
      this.connectLoading = false
      this.$notify({
        title: this.$t('connections.connectFailed') as string,
        message: '',
        type: 'error',
        duration: 3000,
        offset: 20,
      })
      this.$emit('reload')
    } else {
      this.connectLoading = true
      this.$notify({
        title: this.$t('connections.reconnect') as string,
        message: '',
        type: 'warning',
        duration: 3000,
        offset: 20,
      })
    }
  }
  private onClose() {
    this.connectLoading = false
  }
  private messageArrived(id: string) {
    return (
        topic: string,
        payload: string,
        packet: SubscriptionModel,
      ) => {
      const receivedMessage: MessageModel = {
        out: false,
        createAt: time.getNowDate(),
        topic,
        payload: payload.toString(),
        qos: packet.qos,
        retain: packet.retain as boolean,
      }
      this.pushMessage({ id, message: receivedMessage })
      this.record.messages.push({ ...receivedMessage })
      const connectionId = this.$route.params.id
      if (id === connectionId) {
        updateConnectionMessage(connectionId, { ...receivedMessage })
      } else {
        updateConnectionMessage(id, { ...receivedMessage })
        this.unreadMessageIncrement({ id })
      }
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight + 120)
      }, 100)
    }
  }

  private sendMessage(message: MessageModel): void | boolean {
    if (!this.client.connected) {
      this.$notify({
        title: this.$t('connections.notConnect') as string,
        message: '',
        type: 'error',
        duration: 3000,
        offset: 20,
      })
      return false
    }
    const {
      topic, qos, payload, retain,
    } = message
    if (!topic) {
      this.$message.warning(this.$t('connections.topicReuired') as string)
      return false
    }
    if (!payload && !retain) {
      this.$message.warning(this.$t('connections.payloadReuired') as string)
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
        this.pushMessage({
          id: this.record.id as string,
          message: publishMessage,
        })
        this.record.messages.push({ ...publishMessage })
        updateConnectionMessage(this.record.id as string, { ...publishMessage })
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight + 120)
        }, 100)
      },
    )
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
      background-color: var(--color-bg-normal);
      .topbar {
        border-bottom: 0px;
        -webkit-app-region: drag;
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
        .edit-btn {
          .el-icon-edit-outline {
            font-size: 18px;
          }
          &.disabled {
            cursor: not-allowed;
            color: var(--color-text-light);
          }
          margin-right: 6px;
        }
        .el-dropdown.connection-oper {
          a {
            width: 24px;
            display: inline-block;
            text-align: center;
            position: relative;
            top: -1px;
          }
        }
      }
      .connection-info {
        padding: 0 16px;
      }
    }
    .connections-search {
      padding: 13px 16px 13px 16px;
      height: auto;
      background-color: var(--color-bg-normal);
      &.topbar {
        border-bottom: 0px;
        min-height: 0px;
      }
      .icon-search, .el-icon-loading {
        line-height: 32px;
      }
      .el-icon-loading {
        margin-right: 10px;
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
        left: 341px;
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
