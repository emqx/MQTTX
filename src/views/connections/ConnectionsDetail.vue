<template>
  <div class="connections-detail">
    <div ref="connectionTopbar" class="connections-topbar right-topbar">
      <div class="connections-info">
        <div class="topbar">
          <div class="connection-head">
            <h2 :class="{ offline: !client.connected }">
              <span class="title-name">{{ titleName }}</span>
              <a
                href="javascript:;"
                :class="['collapse-btn', showClientInfo ? 'top' : 'bottom']"
                @click="handleCollapse($route.params.id)"
              >
                <i class="el-icon-d-arrow-left"></i>
              </a>
            </h2>
            <transition name="el-fade-in">
              <el-popover
                v-if="client.connected"
                :title="$t('connections.messageCount')"
                popper-class="message-popover"
                placement="right"
                trigger="hover"
              >
                <div class="popover-item">
                  <label>{{ $t('connections.received') }}:</label>
                  <span>{{ messagesCount.received }}</span>
                </div>
                <div class="popover-item">
                  <label>{{ $t('connections.published') }}:</label>
                  <span>{{ messagesCount.publish }}</span>
                </div>
                <el-badge slot="reference" :value="messagesCount.count" class="connection-message-count" type="primary">
                </el-badge>
              </el-popover>
            </transition>
          </div>
          <div class="connection-tail">
            <transition name="el-fade-in">
              <template v-if="!showClientInfo && client.connected">
                <el-tooltip
                  v-if="sendTimeId"
                  placement="bottom"
                  :effect="theme !== 'light' ? 'light' : 'dark'"
                  :open-delay="500"
                  :content="$t('connections.clearIntervalBtn')"
                >
                  <a class="stop-interval-btn" href="javascript:;" @click="stopTimedSend">
                    <i class="iconfont icon-a-stoptiming"></i>
                  </a>
                </el-tooltip>
                <el-tooltip
                  placement="bottom"
                  :effect="theme !== 'light' ? 'light' : 'dark'"
                  :open-delay="500"
                  :content="$t('connections.disconnectedBtn')"
                >
                  <a class="disconnect-btn" href="javascript:;" @click="disconnect">
                    <i v-if="!disconnectLoding" class="iconfont icon-disconnect"></i>
                    <i v-else class="el-icon-loading"></i>
                  </a>
                </el-tooltip>
              </template>
              <el-tooltip
                v-if="!showClientInfo && !client.connected"
                placement="bottom"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :content="$t('connections.connectBtn')"
              >
                <a class="connect-btn" href="javascript:;" @click="connect">
                  <i v-if="!connectLoading" class="el-icon-caret-right"></i>
                  <i v-else class="el-icon-loading"></i>
                </a>
              </el-tooltip>
            </transition>
            <el-tooltip
              v-if="scriptOption !== null"
              placement="bottom"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('script.removeScript')"
            >
              <a class="remove-script-btn" href="javascript:;" @click="removeScript">
                <i class="iconfont icon-a-stopscrip"></i>
              </a>
            </el-tooltip>
            <template v-if="!isNewWindow">
              <el-tooltip
                placement="bottom"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :content="$t('common.config')"
              >
                <a
                  :class="['edit-btn', { disabled: client.connected }]"
                  href="javascript:;"
                  @click="handleEdit($route.params.id)"
                >
                  <i class="iconfont icon-edit"></i>
                </a>
              </el-tooltip>
              <el-tooltip
                placement="bottom"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :content="$t('common.newWindow')"
              >
                <a class="new-window-btn" href="javascript:;" @click="handleNewWindow">
                  <i class="iconfont icon-a-newwindow"></i>
                </a>
              </el-tooltip>
              <el-dropdown class="connection-oper" trigger="click" @command="handleCommand">
                <a href="javascript:;">
                  <i class="iconfont icon-more"></i>
                </a>
                <el-dropdown-menu class="connection-oper-item" slot="dropdown">
                  <el-dropdown-item command="searchContent">
                    <i class="iconfont icon-search"></i>{{ $t('connections.searchContent') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="clearHistory">
                    <i class="iconfont icon-a-clearhistory"></i>{{ $t('connections.clearHistory') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="exportData">
                    <i class="iconfont icon-a-exportdata"></i>{{ $t('connections.exportData') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="importData">
                    <i class="iconfont icon-a-importdata"></i>{{ $t('connections.importData') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="timedMessage" :disabled="!client.connected || sendTimeId !== null">
                    <i class="iconfont icon-a-timedmessage"></i>{{ $t('connections.timedMessage') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="bytesStatistics" :disabled="!client.connected">
                    <i class="iconfont icon-a-bytesstatistics"></i>{{ $t('connections.bytesStatistics') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="useScript" :disabled="!client.connected">
                    <i class="iconfont icon-a-usescript"></i>{{ $t('script.useScript') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="disconnect" :disabled="!client.connected">
                    <i class="iconfont icon-disconnect"></i>{{ $t('connections.disconnect') }}
                  </el-dropdown-item>
                  <el-dropdown-item class="delete-item" command="deleteConnect" divided>
                    <i class="iconfont icon-delete"></i>{{ $t('connections.deleteConnect') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </div>
        </div>
        <el-collapse-transition>
          <ConnectionInfo
            v-show="showClientInfo"
            class="connection-info"
            :connection="record"
            :titleName="titleName"
            :client="client"
            :btn-loading="connectLoading"
            @handleConnect="connect"
            @handleDisconnect="disconnect"
            @handleCancel="cancel"
          />
        </el-collapse-transition>
      </div>
      <transition name="el-zoom-in-top">
        <div v-show="searchVisible" class="connections-search topbar">
          <el-input
            id="searchTopic"
            v-model="searchParams.topic"
            size="small"
            :placeholder="$t('connections.inputTopic')"
            @keyup.enter.native="searchContent"
            @keyup.esc.native="handleSearchClose"
          >
          </el-input>
          <el-input
            v-model="searchParams.payload"
            size="small"
            :placeholder="$t('connections.inputMsgContent')"
            @keyup.enter.native="searchContent"
            @keyup.esc.native="handleSearchClose"
            class="content-search"
          >
          </el-input>
          <a href="javascript:;" class="search-btn" @click="searchContent">
            <i v-if="!searchLoading" class="iconfont icon-search"></i>
            <i v-else class="el-icon-loading"></i>
          </a>
          <a href="javascript:;" class="close-search" @click="handleSearchClose">
            <i class="el-icon-circle-close"></i>
          </a>
        </div>
      </transition>
    </div>
    <div
      class="connections-detail-main right-content"
      :style="{
        paddingTop: showClientInfo ? msgTop.open : msgTop.close,
        paddingBottom: `${msgBottom}px`,
        marginLeft: showSubs ? '571px' : '341px',
      }"
    >
      <div class="connections-body">
        <div ref="filterBar" class="filter-bar" :style="{ top: showClientInfo ? bodyTop.open : bodyTop.close }">
          <span class="subs-title">
            {{ this.$t('connections.subscriptions') }}
            <a class="subs-btn" href="javascript:;" @click="handleShowSubs">
              <i class="iconfont icon-collapse"></i>
            </a>
          </span>
          <div class="message-type">
            <el-tooltip
              placement="top"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('connections.receivedPayloadDecodedBy')"
            >
              <a href="javascript:;" class="icon-tip">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
            <el-select class="received-type-select" size="small" v-model="receivedMsgType">
              <el-option v-for="type in ['Plaintext', 'Base64', 'JSON', 'Hex']" :key="type" :value="type"> </el-option>
            </el-select>
            <MsgTypeTabs v-model="msgType" @change="handleMsgTypeChanged" />
          </div>
        </div>
        <SubscriptionsList
          v-if="$route.params.id"
          ref="subList"
          :subsVisible.sync="showSubs"
          :connectionId="$route.params.id"
          :record="record"
          :top="showClientInfo ? bodyTop.open : bodyTop.close"
          @onClickTopic="handleTopicClick"
          @deleteTopic="handleTopicDelete"
        />
        <MessageList
          ref="messagesDisplay"
          :subscriptions="record.subscriptions"
          :messages="messages"
          :height="messageListHeight"
          :marginTop="messageListMarginTop"
          :addNewMsg="messagesAddedNewItem"
          @showContextMenu="handleContextMenu"
        />
        <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
          <a href="javascript:;" class="context-menu__item" @click="handleCopyMessage">
            <i class="iconfont icon-copy"></i>{{ $t('common.copy') }}
          </a>
          <a href="javascript:;" class="context-menu__item danger" @click="handleDeleteMessage">
            <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
          </a>
        </contextmenu>
      </div>

      <div ref="connectionFooter" class="connections-footer" :style="{ marginLeft: showSubs ? '571px' : '341px' }">
        <ResizeHeight v-model="inputHeight" />
        <MsgPublish
          :mqtt5PropsEnable="record.mqttVersion === '5.0'"
          ref="msgPublish"
          :editor-height="inputHeight - 75"
          :subs-visible="showSubs"
          :style="{ height: `${inputHeight}px` }"
          :disabled="sendTimeId !== null"
          @foucs="scrollToBottom"
          @handleSend="sendMessage"
        />
      </div>
    </div>
    <ExportData :visible.sync="showExportData" :connection="record" />
    <ImportData :visible.sync="showImportData" @updateData="$emit('reload')" />
    <TimedMessage ref="timedMessage" :visible.sync="showTimedMessage" @setTimerSuccess="setTimerSuccess" />
    <UseScript ref="useScript" :visible.sync="showUseScript" @setScript="handleSetScript" />
    <BytesStatistics
      ref="bytesStatistics"
      :visible.sync="showBytes"
      v-bind="chartData"
      :version="version"
      :uptime="uptime"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ipcRenderer } from 'electron'
import { MqttClient, IConnackPacket, IPublishPacket, IClientPublishOptions } from 'mqtt'
import _ from 'lodash'

import time from '@/utils/time'
import matchMultipleSearch from '@/utils/matchMultipleSearch'
import topicMatch, { matchTopicMethod } from '@/utils/topicMatch'
import { createClient } from '@/utils/mqttUtils'
import { getBytes, getUptime, getVersion } from '@/utils/SystemTopicUtils'
import validFormatJson from '@/utils/validFormatJson'

import MessageList from '@/components/MessageList.vue'
import MsgPublish from '@/components/MsgPublish.vue'
import SubscriptionsList from '@/components/SubscriptionsList.vue'
import ResizeHeight from '@/components/ResizeHeight.vue'
import ConnectionInfo from './ConnectionInfo.vue'
import Contextmenu from '@/components/Contextmenu.vue'
import ExportData from '@/components/ExportData.vue'
import ImportData from '@/components/ImportData.vue'
import TimedMessage from '@/components/TimedMessage.vue'
import BytesStatistics from '@/components/BytesStatistics.vue'
import UseScript from '@/components/UseScript.vue'
import MsgTypeTabs from '@/components/MsgTypeTabs.vue'

import sandbox from '@/utils/sandbox'
import { hasMessagePayloadID, hasMessageHeaderID } from '@/utils/historyRecordUtils'
import useServices from '@/database/useServices'
import { getMessageId, getSubscriptionId } from '@/utils/idGenerator'

type CommandType =
  | 'searchContent'
  | 'clearHistory'
  | 'disconnect'
  | 'deleteConnect'
  | 'exportData'
  | 'importData'
  | 'timedMessage'
  | 'bytesStatistics'
  | 'useScript'
type PayloadConvertType = 'base64' | 'hex'

interface TopModel {
  open: string
  close: string
}

@Component({
  components: {
    ConnectionInfo,
    MsgPublish,
    SubscriptionsList,
    ResizeHeight,
    Contextmenu,
    ExportData,
    ImportData,
    TimedMessage,
    BytesStatistics,
    MessageList,
    UseScript,
    MsgTypeTabs,
  },
})
export default class ConnectionsDetail extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection!: (payload: { readonly id: string }) => void
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo!: (payload: ClientInfo) => void
  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions!: (payload: SubscriptionsVisible) => void
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void
  @Action('SET_SCRIPT') private setScript!: (payload: { currentScript: ScriptState | null }) => void

  @Getter('activeConnection') private activeConnection!: ActiveConnection
  @Getter('showSubscriptions') private showSubscriptions!: boolean
  @Getter('autoScroll') private autoScroll!: boolean
  @Getter('maxReconnectTimes') private maxReconnectTimes!: number
  @Getter('currentTheme') private theme!: Theme
  @Getter('showClientInfo') private clientInfoVisibles!: { [id: string]: boolean }
  @Getter('currentScript') private scriptOption!: ScriptState | null

  /**
   * Notice: when we jump order by `other page` -> `creation page` -> `connection page`,
   * MsgPublish/editor twice which is not we expected, it should be init only once.
   * `other page` -> `creation page` the MsgPublish/editor will init, `creation page` -> `connection page` init editor again.
   * So when route jump order by `other page` -> `creation page`, we need to operate editor creation and destroy manually by listening on route.
   * relative PR: https://github.com/emqx/MQTTX/pull/518 https://github.com/emqx/MQTTX/pull/446
   */
  @Watch('$route.path', { immediate: true, deep: true })
  private handleIdChanged(to: string, from: string) {
    // When route jump order by `other page` -> `creation page`
    if (!from && to && to === '/recent_connections/0') {
      // Destroy the MsgPublish/editor
      setTimeout(() => {
        const thisMsgPublish: MsgPublish = this.$refs.msgPublish as MsgPublish
        thisMsgPublish.editorDestory()
      }, 100)
      // When we jump order by `other page` -> `creation page` -> `connection page`, it's should only init once.
    }
  }

  private showSubs = true
  private showClientInfo = true
  private showExportData = false
  private showImportData = false
  private showTimedMessage = false
  private showUseScript = false

  private connectLoading = false
  private disconnectLoding = false
  private isReconnect = false
  private searchVisible = false
  private searchLoading = false
  private showBytes = false

  private sendFrequency: number | undefined = undefined
  private sendTimeId: number | null = null
  private receivedMsgType: PayloadType = 'Plaintext'
  private msgType: MessageType = 'all'

  private client: Partial<MqttClient> = {
    connected: false,
    options: {},
  }
  private messages: MessageModel[] = this.record.messages
  private searchParams = {
    topic: '',
    payload: '',
  }

  private retryTimes = 0
  private inputHeight = 160
  private msgBottom = 166
  private messageListHeight: number = 284
  private messageListMarginTop: number = 19

  private activeTopic = ''
  private showContextmenu: boolean = false
  private selectedMessage: MessageModel | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private selectedInfo: string = ''
  private chartData: ChartDataModel = {
    label: '',
    recevied: 0,
    sent: 0,
  }
  private version = ''
  private uptime = ''
  private bytesTimes = 0
  private messagesAddedNewItem: boolean = false

  get titleName() {
    return this.record.name
  }

  get bodyTop(): TopModel {
    return {
      open: '249px',
      close: '60px',
    }
  }

  get msgTop(): TopModel {
    return {
      open: '277px',
      close: '86px',
    }
  }

  get isNewWindow(): boolean {
    return this.$route.name === 'newWindow'
  }

  get messagesCount(): {
    count: number
    received: number
    publish: number
  } {
    const count = this.record.messages.length
    const received = this.record.messages.filter((msg: MessageModel) => !msg.out).length
    const publish = this.record.messages.filter((msg: MessageModel) => msg.out).length
    return {
      count,
      received,
      publish,
    }
  }

  get subListRef(): SubscriptionsList {
    return this.$refs.subList as SubscriptionsList
  }

  get messageListRef(): MessageList {
    return this.$refs.messagesDisplay as MessageList
  }

  get curConnectionId(): string {
    return this.$route.params.id
  }

  @Watch('record')
  private handleRecordChanged() {
    // init Messagelist showMessages when selected connection changed
    const messageList: MessageList = this.messageListRef
    messageList.showMessages = []

    this.getConnectionValue(this.curConnectionId)
    this.getMessages()
    const timer = setTimeout(() => {
      this.scrollToBottom()
      clearTimeout(timer)
    }, 500)
  }

  @Watch('inputHeight')
  private handleInputHeight(val: number) {
    const oldInputHeight = 155
    const oldMsgBottom = 160
    const offset = val - oldInputHeight
    this.msgBottom = oldMsgBottom + offset
    const timer = setTimeout(() => {
      this.setMessageListHeight()
      clearTimeout(timer)
    }, 500)
  }

  @Watch('showClientInfo')
  private handleShowClientInfoChange() {
    const timer = setTimeout(() => {
      this.setMessageListHeight()
      clearTimeout(timer)
    }, 500)
  }

  // Connect
  public connect(): boolean | void {
    this.isReconnect = false
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.connectLoading = true
    // new client
    const { curConnectClient, connectUrl } = createClient(this.record)
    this.client = curConnectClient
    const { id } = this.record
    if (id && this.client.on) {
      this.$log.info(`MQTTX client with ID ${id} assigned`)
      this.client.on('connect', this.onConnect)
      this.client.on('error', this.onError)
      this.client.on('reconnect', this.onReConnect)
      this.client.on('close', this.onClose)
      this.client.on('message', this.onMessageArrived(id))
    }

    const protocolLogMap: ProtocolMap = {
      mqtt: 'MQTT/TCP connection',
      mqtts: 'MQTT/SSL connection',
      ws: 'MQTT/WS connection',
      wss: 'MQTT/WSS connection',
    }
    const curOptionsProtocol: Protocol = (this.client as MqttClient).options.protocol as Protocol
    let connectLog = `Connect client ${this.record.name}, ${protocolLogMap[curOptionsProtocol]}: ${connectUrl}`
    if (this.record.mqttVersion === '5.0') {
      const propertiesLog = JSON.stringify(this.record.properties)
      connectLog += ` with Properties: ${propertiesLog}`
    }
    this.$log.info(connectLog)
  }

  // Delete connection
  public removeConnection(currentConnection?: ConnectionModel) {
    let { id, name } = this.record
    if (currentConnection) {
      id = currentConnection.id
      name = currentConnection.name
    }
    const confirmDelete: string = this.$t('common.confirmDelete', { name }) as string
    this.$confirm(confirmDelete, this.$tc('common.warning'), {
      type: 'warning',
    })
      .then(async () => {
        if (id) {
          const { connectionService } = useServices()
          const res: ConnectionModel | undefined = await connectionService.delete(id)
          if (res) {
            this.$emit('delete')
            this.$message.success(this.$tc('common.deleteSuccess'))
            if (res.id) {
              this.removeActiveConnection({ id: res.id })
              this.$log.info(`MQTTX remove connection ${res.name} (clientID ${res.clientId}) success`)
            }
          }
        }
      })
      .catch((error) => {
        // ignore(error)
      })
  }

  // Clean interval
  public stopTimedSend() {
    const timedMessageRef: TimedMessage = this.$refs.timedMessage as TimedMessage
    timedMessageRef['record'] = {
      sendFrequency: undefined,
    }
    this.sendFrequency = undefined
    if (this.sendTimeId) {
      clearInterval(this.sendTimeId)
      this.sendTimeId = null
      this.$message.success(this.$tc('connections.stopTimedMessage'))
      this.$log.info(`${this.record.name} stopped sending timed messages`)
    }
  }

  // Set messages list height
  public setMessageListHeight() {
    const connectionFooter: HTMLElement = this.$refs.connectionFooter as HTMLElement
    const connectionTopbar: HTMLElement = this.$refs.connectionTopbar as HTMLElement
    const filterBar: HTMLElement = this.$refs.filterBar as HTMLElement
    const filterBarOffsetHeight = filterBar.offsetHeight

    this.messageListMarginTop = filterBarOffsetHeight > 56 ? filterBarOffsetHeight - 37 : 19

    this.messageListHeight =
      document.body.offsetHeight - connectionTopbar.offsetHeight - connectionFooter.offsetHeight - filterBarOffsetHeight
  }

  // Show context menu
  private handleContextMenu(msgItemInfo: IArguments, message: MessageModel) {
    const [payload, event] = msgItemInfo
    if (!this.showContextmenu) {
      const { clientX, clientY } = event
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
      const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      this.contextmenuConfig.left = width - clientX < 95 ? clientX - 75 : clientX
      this.contextmenuConfig.top = height - clientY < 77 ? clientY - 77 : clientY
      this.showContextmenu = true
      this.selectedMessage = message
      this.selectedInfo = payload
    } else {
      this.showContextmenu = false
    }
  }

  // Copy message
  private handleCopyMessage() {
    if (this.selectedInfo) {
      this.$copyText(this.selectedInfo).then(
        () => {
          this.$message.success(this.$tc('common.copySuccess'))
        },
        () => {
          this.$message.error(this.$tc('common.copyFailed'))
        },
      )
    }
  }

  // Delete message
  private async handleDeleteMessage() {
    let id = ''
    if (this.selectedMessage && this.selectedMessage.id) {
      id = this.selectedMessage.id.toString()
    }
    const { messageService } = useServices()
    const res: MessageModel | undefined = await messageService.delete(id)
    if (res) {
      this.showContextmenu = false
      this.$message.success(this.$tc('common.deleteSuccess'))
      this.$emit('reload')
      this.$log.info(
        `Delete message success, Name: ${this.record.name} ClientID: ${this.record.clientId}, Payload: ${JSON.stringify(
          res.payload,
        )}`,
      )
    } else {
      this.showContextmenu = false
      this.$message.error(this.$tc('common.deletefailed'))
      this.$log.info('Delete message failed')
    }
  }

  // Get current connection
  private getConnectionValue(id: string) {
    const currentActiveConnection = this.activeConnection[id]
    const $clientInfoVisible: boolean | undefined = this.clientInfoVisibles[id]
    if ($clientInfoVisible === undefined) {
      this.showClientInfo = true
    } else {
      this.showClientInfo = $clientInfoVisible
    }
    this.showSubs = this.showSubscriptions
    if (currentActiveConnection) {
      this.client = currentActiveConnection.client
      this.setClientsMessageListener()
    } else {
      this.client = {
        connected: false,
      }
    }
  }

  // Show subscription list
  private handleShowSubs() {
    this.showSubs = !this.showSubs
    this.changeShowSubscriptions({ showSubscriptions: this.showSubs })
  }

  // Collapse top client info
  private handleCollapse(id: string) {
    this.showClientInfo = !this.showClientInfo
    this.changeShowClientInfo({
      id,
      showClientInfo: this.showClientInfo,
    })
  }

  // New window
  private handleNewWindow() {
    ipcRenderer.send('newWindow', this.curConnectionId)
  }

  // Dropdown command
  private async handleCommand(command: CommandType) {
    switch (command) {
      case 'disconnect':
        this.disconnect()
        break
      case 'deleteConnect':
        this.removeConnection()
        break
      case 'clearHistory':
        await this.handleMsgClear()
        break
      case 'searchContent':
        this.handleSearchOpen()
        break
      case 'exportData':
        this.handleExportData()
        break
      case 'importData':
        this.handleImportData()
        break
      case 'timedMessage':
        this.handleTimedMessage()
        break
      case 'bytesStatistics':
        this.handleSubSystemTopic()
        break
      case 'useScript':
        this.handleUseScript()
        break
      default:
        break
    }
  }

  // Route to edit page
  private handleEdit(id: string): boolean | void {
    if (this.client.connected) {
      return false
    }
    this.$router.push({
      path: `/recent_connections/${id}`,
      query: { oper: 'edit' },
    })
  }

  // Return messages
  private getMessages() {
    this.messagesAddedNewItem = false
    this.msgType = 'all'
    this.messages = _.cloneDeep(this.record.messages)
  }

  // Clear messages
  private async handleMsgClear() {
    this.messages = []
    this.record.messages = []

    this.changeActiveConnection({
      id: this.curConnectionId,
      client: this.client,
      messages: [],
    })
    if (this.record.id) {
      const { messageService } = useServices()
      await messageService.cleanInConnection(this.record.id)
      this.$log.info(`${this.record.name} was cleaned history connection messages`)
    }
  }

  // Message type changed
  private async handleMsgTypeChanged(type: MessageType) {
    this.messagesAddedNewItem = false
    const setChangedMessages = (changedType: MessageType, msgData: MessageModel[]) => {
      if (type === 'received') {
        this.messages = msgData.filter(($: MessageModel) => !$.out)
      } else if (type === 'publish') {
        this.messages = msgData.filter(($: MessageModel) => $.out)
      } else {
        this.messages = msgData.slice()
      }
      this.scrollToBottom()
    }
    if (this.activeTopic !== '') {
      const res = await topicMatch(this.record.messages, this.activeTopic)
      if (res) {
        setChangedMessages(type, res)
      } else {
        this.messages = [].slice()
      }
    } else {
      setChangedMessages(type, this.record.messages)
    }
  }

  // Search messages
  private async searchContent() {
    this.scrollToBottom()
    const { topic, payload } = this.searchParams
    if (!topic && !payload) {
      return
    }
    this.searchLoading = true
    const timer = setTimeout(() => {
      this.searchLoading = false
      clearTimeout(timer)
    }, 500)
    this.getMessages()
    if (topic !== '' || payload !== '') {
      const $messages =
        this.activeTopic === '' ? _.cloneDeep(this.messages) : await topicMatch(this.record.messages, this.activeTopic)
      const res = await matchMultipleSearch($messages, this.searchParams)
      if (res) {
        this.messages = res.slice()
      } else {
        this.messages = [].slice()
      }
    }
  }

  // Delete topic item
  private handleTopicDelete() {
    this.getMessages()
    this.scrollToBottom()
  }

  // Click topic item
  private async handleTopicClick(sub: SubscriptionModel, reset: boolean) {
    this.getMessages()
    if (reset) {
      this.activeTopic = ''
      this.searchContent()
      return false
    }
    this.activeTopic = sub.topic
    const $messages = _.cloneDeep(this.messages)
    const res: MessageModel[] = await topicMatch($messages, sub.topic)
    if (res) {
      this.messages = res.slice()
    } else {
      this.messages = [].slice()
    }
    this.searchContent()
  }
  private handleSearchOpen() {
    this.searchVisible = true
    const $el = document.getElementById('searchTopic')
    this.$nextTick(() => {
      if ($el) {
        $el.focus()
      }
    })
  }

  // Close search bar
  private async handleSearchClose() {
    this.searchVisible = false
    this.searchParams = {
      topic: '',
      payload: '',
    }
    this.getMessages()
    if (this.activeTopic) {
      const $messages = _.cloneDeep(this.messages)
      const res = await topicMatch($messages, this.activeTopic)
      if (res) {
        this.messages = res.slice()
      } else {
        this.messages = [].slice()
      }
    }
    this.scrollToBottom()
  }

  // Cancel connect
  private cancel() {
    this.connectLoading = false
    this.client.end!(true)
    this.retryTimes = 0
    this.$log.info(`MQTTX client connection cancel, Name: ${this.record.name}`)
  }

  // Disconnect
  private disconnect(): boolean | void {
    if (!this.client.connected || this.disconnectLoding) {
      return false
    }
    this.stopTimedSend()
    this.disconnectLoding = true
    this.client.end!(false, () => {
      this.disconnectLoding = false
      this.retryTimes = 0

      this.changeActiveConnection({
        id: this.curConnectionId,
        client: this.client,
        messages: this.record.messages,
      })
      this.$notify({
        title: this.$tc('connections.disconnected'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
      if (!this.showClientInfo) {
        this.setShowClientInfo(true)
      }
      this.$emit('reload')
      this.$log.info(`MQTTX client disconnect, Name: ${this.record.name}, client ID: ${this.record.clientId}`)
    })
  }

  // Connect callback
  private onConnect(conBack: IConnackPacket) {
    this.connectLoading = false

    this.changeActiveConnection({
      id: this.curConnectionId,
      client: this.client,
      messages: this.record.messages,
    })
    this.$notify({
      title: this.$tc('connections.connected'),
      message: '',
      type: 'success',
      duration: 3000,
      offset: 30,
    })
    this.setShowClientInfo(false)
    this.$emit('reload', false, false, this.handleReSubTopics)
    this.$log.info(`${this.record.name} connect success, MQTT.js onConnect trigger`)
  }

  // Error callback
  private onError(error: Error) {
    let msgTitle = this.$tc('connections.connectFailed')
    if (error) {
      msgTitle = error.toString()
    }
    this.client.end!(true)
    this.retryTimes = 0
    this.connectLoading = false
    this.$notify({
      title: msgTitle,
      message: '',
      type: 'error',
      duration: 3000,
      offset: 30,
    })
    this.$log.error(`${this.record.name} connect fail, MQTT.js onError trigger, ${error.stack}`)
    this.$emit('reload')
  }

  // Reconnect callback
  private onReConnect() {
    this.isReconnect = true
    if (!this.record.reconnect) {
      this.client.end!(true)
      this.retryTimes = 0
      this.connectLoading = false
      this.$notify({
        title: this.$tc('connections.connectFailed'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      this.$emit('reload')
    } else {
      if (this.retryTimes > this.maxReconnectTimes) {
        this.$log.warn('Connection maxReconnectTimes limit, stop retry')
        this.client.end!(true)
        this.retryTimes = 0
        this.connectLoading = false
      } else {
        this.$log.info(`${this.record.name} reconnect: ${this.retryTimes} times retry`)
        this.retryTimes += 1
        this.connectLoading = true
        this.$notify({
          title: this.$tc('connections.reconnect'),
          message: '',
          type: 'warning',
          duration: 3000,
          offset: 30,
        })
      }
    }
  }

  // Close connection callback
  private onClose() {
    this.$log.info(`${this.record.name} connect close, MQTT.js onClose trigger`)
    this.connectLoading = false
    this.isReconnect = false
  }

  // Search message
  private async searchMessage(oneMessage: MessageModel): Promise<boolean> {
    const res = await matchMultipleSearch([oneMessage], this.searchParams)
    return res && res.length ? true : false
  }

  // Scroll to page bottom
  private scrollToBottom() {
    if (this.autoScroll === false) {
      return
    }
    const timer = setTimeout(() => {
      const messagesDisplay = this.messageListRef as Vue
      const messagesDisplayDOM = messagesDisplay.$el
      if (messagesDisplayDOM) {
        messagesDisplayDOM.scrollTo({
          top: messagesDisplayDOM.scrollHeight + 160,
          left: 0,
          behavior: 'smooth',
        })
      }
      clearTimeout(timer)
    }, 100)
  }

  // Set script
  private handleSetScript(script: ScriptModel, applyType: MessageType) {
    const currentScript: ScriptState = {
      apply: applyType,
      content: script,
    }
    this.setScript({ currentScript })
    this.$message.success(this.$tc('script.startScript'))
    this.$log.info(`${this.record.name} set script successed`)
  }

  // Remove script
  private removeScript() {
    this.setScript({ currentScript: null })
    this.$message.success(this.$tc('script.stopScirpt'))
    this.$log.info(`${this.record.name} remove script successed`)
  }

  // Recevied message
  private onMessageArrived(id: string) {
    return async (topic: string, payload: Buffer, packet: IPublishPacket) => {
      const { qos, retain, properties } = packet
      const convertPayload = this.convertPayloadByType(payload, this.receivedMsgType, 'receive') as string
      const receviedPayload = this.convertPayloadByScript(convertPayload, 'publish')
      const receivedMessage: MessageModel = {
        id: getMessageId(),
        out: false,
        createAt: time.getNowDate(),
        topic,
        payload: receviedPayload,
        qos,
        retain,
        properties,
      }
      if (topic.indexOf('$SYS') !== -1 && this.showBytes && id === this.curConnectionId) {
        const _chartData = getBytes(receivedMessage)
        if (_chartData) {
          this.chartData = _chartData
          this.bytesTimes += 1
          if (this.bytesTimes === 2) {
            const bytesStatistics = this.$refs.bytesStatistics as BytesStatistics
            this.$nextTick(() => {
              bytesStatistics.updateChart()
              this.bytesTimes = 0
            })
          }
        }
        const _version = getVersion(receivedMessage)
        if (_version) {
          this.version = _version
        }
        const _uptime = getUptime(receivedMessage)
        if (_uptime) {
          this.uptime = _uptime
        }
        return
      }
      const { messageService } = useServices()
      await messageService.pushToConnection({ ...receivedMessage }, id)
      if (id === this.curConnectionId) {
        this.record.messages.push({ ...receivedMessage })
        // Filter by conditions (topic, payload, etc)
        const filterRes = this.filterBySearchConditions(topic, receivedMessage)
        if (filterRes) {
          return
        }
        const isActiveTopicMessages = matchTopicMethod(this.activeTopic, topic)
        const isFromActiveTopic = this.msgType !== 'publish' && this.activeTopic && isActiveTopicMessages
        const isFromNotActiveTopic = this.msgType !== 'publish' && !this.activeTopic
        if (isFromActiveTopic || isFromNotActiveTopic) {
          this.$log.info(`Message Arrived with topic: ${topic}`)
          this.messages.push(receivedMessage)
          this.messagesAddedNewItem = true
          let receivedLog = `${this.record.name} message arrived: message added "${
            receivedMessage.id
          }" added to topic "${topic}", payload: ${JSON.stringify(
            receivedMessage.payload,
          )} MQTT.js onMessageArrived trigger`
          if (this.record.mqttVersion === '5.0') {
            const logProperties = JSON.stringify(receivedMessage.properties)
            receivedLog += ` with Properties: ${logProperties}`
          }
          this.$log.info(receivedLog)
        }
      } else {
        this.unreadMessageIncrement({ id })
        this.$log.info(`ID: ${id} received an unread message`)
      }
      this.scrollToBottom()
    }
  }
  // Set timed message success
  private setTimerSuccess(time: number) {
    this.sendFrequency = time
  }

  // Set timed message
  private async sendMessage(
    message: MessageModel,
    type: PayloadType,
    aftersendOneMessageCallback?: (isNewPayload: boolean) => void,
    afterCallback?: () => void,
  ): Promise<void> {
    await this.sendOneMessage(message, type, aftersendOneMessageCallback)
    if (this.sendFrequency) {
      this.$message.success(`${this.$t('connections.startTimedMessage')}${this.sendFrequency}`)
      this.$log.info(`${this.record.name} opened timed message successfully, frequency(s): ${this.sendFrequency}s`)
      this.timedSendMessage(this.sendFrequency, message, type)
    }
    afterCallback && afterCallback()
  }

  // Set timed message
  private timedSendMessage(time: number, message: MessageModel, type: PayloadType) {
    this.stopTimedSend()
    this.sendTimeId = window.setInterval(() => {
      const { ...oneMessage } = message
      let { id } = oneMessage
      id = getMessageId()
      this.sendOneMessage(Object.assign(oneMessage, { id }), type)
    }, time * 1000)
  }

  private async insertHistory(payload: HistoryMessagePayloadModel, header: HistoryMessageHeaderModel) {
    const { historyMessagePayloadService, historyMessageHeaderService } = useServices()
    const willUpdatePayloadID: string | null = await hasMessagePayloadID(payload)
    const willUpdateHeaderID: string | null = await hasMessageHeaderID(header)
    willUpdatePayloadID
      ? await historyMessagePayloadService.updateCreateAt(willUpdatePayloadID)
      : await historyMessagePayloadService.create(payload)
    willUpdateHeaderID
      ? await historyMessageHeaderService.updateCreateAt(willUpdateHeaderID)
      : await historyMessageHeaderService.create(header)
    return { isNewPayload: !willUpdatePayloadID, isNewHeader: !willUpdateHeaderID }
  }

  // Send one message
  private async sendOneMessage(
    message: MessageModel,
    type: PayloadType,
    afterSendCallback?: (isNewPayload: boolean) => void,
  ): Promise<void | boolean> {
    if (!this.client.connected) {
      this.$notify({
        title: this.$tc('connections.notConnect'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      this.stopTimedSend()
      return false
    }

    const { id, topic, qos, payload, retain, properties } = message

    if (!topic && !properties?.topicAlias) {
      this.$message.warning(this.$tc('connections.topicReuired'))
      this.stopTimedSend()
      return false
    }

    let props: PushPropertiesModel | undefined = undefined
    if (properties && Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined).length > 0) {
      const propRecords = Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined)
      props = Object.fromEntries(propRecords)
      if (props.correlationData && typeof props.correlationData === 'string') {
        props.correlationData = Buffer.from(props.correlationData)
      }
      if (props.userProperties) {
        // For convert Vue object to normal JavaScript Object: https://github.com/vuejs/Discussion/issues/292
        props.userProperties = { ...props.userProperties }
      }
    }

    const { isNewPayload } = await this.insertHistory(
      { payload, payloadType: type } as HistoryMessagePayloadModel,
      { qos, topic, retain } as HistoryMessageHeaderModel,
    ) // insert message into local storage

    const convertPayload = this.convertPayloadByScript(payload, 'received')
    const sendPayload = this.convertPayloadByType(convertPayload, type, 'publish')

    this.client.publish!(
      topic,
      sendPayload,
      { qos, retain, properties: props as IClientPublishOptions['properties'] },
      async (error: Error) => {
        if (error) {
          const errorMsg = error.toString()
          this.$message.error(errorMsg)
          this.stopTimedSend()
          this.$log.error(`${this.record.name} message publish failed, ${error.stack}`)
          return false
        }
        const properties = this.record.mqttVersion === '5.0' ? props : undefined
        const publishMessage: MessageModel = {
          id,
          out: true,
          createAt: time.getNowDate(),
          topic,
          payload: convertPayload,
          qos,
          retain,
          properties,
        }
        if (this.record.id) {
          this.record.messages.push({ ...publishMessage })
          // Filter by conditions (topic, payload, etc)
          const filterRes = this.filterBySearchConditions(topic, publishMessage)
          if (filterRes) {
            return
          }
          const isActiveTopicMessages = matchTopicMethod(this.activeTopic, topic)
          const isFromActiveTopic = this.activeTopic && isActiveTopicMessages && this.msgType !== 'received'
          const isFromNotActiveTopic = this.msgType !== 'received' && !this.activeTopic
          if (isFromActiveTopic || isFromNotActiveTopic) {
            this.messages.push(publishMessage)
            this.messagesAddedNewItem = true
          }
          const logPayload = JSON.stringify(publishMessage.payload)
          let pubLog = `${this.record.name} sucessfully published message ${logPayload} to topic "${publishMessage.topic}"`
          if (this.record.mqttVersion === '5.0') {
            const logProperties = JSON.stringify(publishMessage.properties)
            pubLog += ` with Properties: ${logProperties}`
          }
          this.$log.info(pubLog)
          const { messageService } = useServices()
          await messageService.pushToConnection({ ...publishMessage }, this.record.id)
          this.scrollToBottom()
        }
      },
    )
    afterSendCallback && afterSendCallback(isNewPayload)
  }

  // Show top connection client info
  private setShowClientInfo(show: boolean) {
    const timer = setTimeout(() => {
      this.showClientInfo = show
      if (this.record.id) {
        this.changeShowClientInfo({
          id: this.record.id.toString() as string,
          showClientInfo: this.showClientInfo,
        })
        clearTimeout(timer)
      }
    }, 500)
  }

  // Convert payload by type
  private convertPayloadByType(value: Buffer | string, type: PayloadType, way: 'publish' | 'receive'): Buffer | string {
    const genPublishPayload = (publishType: PayloadType, publishValue: string) => {
      if (['Base64', 'Hex'].includes(publishType)) {
        const $type = publishType.toLowerCase() as PayloadConvertType
        return Buffer.from(publishValue, $type)
      }
      if (publishType === 'JSON') {
        validFormatJson(publishValue, this.$t('connections.publishMsg'))
      }
      return publishValue
    }
    const genReceivePayload = (receiveType: PayloadType, receiveValue: Buffer) => {
      if (['Base64', 'Hex'].includes(receiveType)) {
        const $type = receiveType.toLowerCase() as 'base64' | 'hex'
        return receiveValue.toString($type)
      }
      if (receiveType === 'JSON') {
        const jsonValue = validFormatJson(receiveValue.toString(), this.$t('connections.receivedMsg'))
        if (jsonValue) {
          return jsonValue
        }
      }
      return receiveValue.toString()
    }
    if (way === 'publish' && typeof value === 'string') {
      return genPublishPayload(type, value)
    } else if (way === 'receive' && typeof value !== 'string') {
      return genReceivePayload(type, value)
    }
    return value
  }

  // Use script to apply to payload
  private convertPayloadByScript(payload: string, notType: MessageType): string {
    let convertPayload = payload
    if (this.scriptOption !== null && this.scriptOption.content && this.scriptOption.apply !== notType) {
      // Enable script function
      convertPayload = sandbox.executeScript(payload, this.scriptOption.content.script, this.receivedMsgType)
    }
    return convertPayload
  }

  // Conditions when searching and filtering
  private filterBySearchConditions(topic: string, message: MessageModel): boolean {
    const { topic: searchTopic, payload: searchPayload } = this.searchParams
    if (searchTopic || searchPayload) {
      this.searchMessage(message).then((res) => {
        if (res) {
          this.messages.push(message)
          this.messagesAddedNewItem = true
          this.scrollToBottom()
        }
      })
      return true
    }
    return false
  }

  // Show export data dialog
  private handleExportData() {
    this.showExportData = true
  }

  // Show import data dialog
  private handleImportData() {
    this.showImportData = true
  }

  // Show timed message dialog
  private handleTimedMessage() {
    this.showTimedMessage = true
  }

  // Auto subscribe system topic and show dialog
  private handleSubSystemTopic() {
    this.showBytes = true
    const sysTopic: SubscriptionModel = {
      topic: '$SYS/#',
      id: getSubscriptionId(),
      qos: 0,
      createAt: time.getNowDate(),
      disabled: false,
    }
    this.subListRef.subscribe(sysTopic, true)
  }

  // Re-subscribe topic
  private handleReSubTopics() {
    if (this.client.options) {
      const { clean, resubscribe } = this.client.options
      const { subscriptions } = this.record
      const needResub = resubscribe && subscriptions.length
      const cleanStatus = (clean && !this.isReconnect) || (!clean && this.isReconnect)
      if (needResub && cleanStatus) {
        this.subListRef.resubscribe()
      }
    }
  }

  // Show use script dialog
  private handleUseScript() {
    this.showUseScript = true
  }

  // Register connected clients message event listeners
  private setClientsMessageListener() {
    Object.keys(this.activeConnection).forEach((connectionID: string) => {
      const $connection = this.activeConnection[connectionID]
      const { client } = $connection
      let msgEventCount = 0
      if (client.listenerCount) {
        msgEventCount = client.listenerCount('message')
      }
      if (client.connected && client.on && msgEventCount === 0) {
        client.on('message', this.onMessageArrived(connectionID))
      }

      this.changeActiveConnection({
        id: connectionID,
        client,
        messages: this.messages,
      })
    })
  }

  // Remove connected clients message event listeners
  private removeClinetsMessageListener() {
    Object.keys(this.activeConnection).forEach((connectionID: string) => {
      const currentActiveConnection = this.activeConnection[connectionID]
      const { client } = currentActiveConnection
      if (client.removeAllListeners) {
        client.removeAllListeners('message')
      }
    })
  }

  private created() {
    this.getConnectionValue(this.curConnectionId)
    ipcRenderer.on('searchContent', () => {
      this.handleSearchOpen()
    })
  }

  private mounted() {
    this.setMessageListHeight()
    window.onresize = () => {
      this.setMessageListHeight()
    }
  }

  private beforeDestroy() {
    ipcRenderer.removeAllListeners('searchContent')
    this.removeClinetsMessageListener()
    this.stopTimedSend()
    window.onresize = null
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.connections-detail {
  .connections-topbar {
    border-bottom: 1px solid var(--color-border-default);
    .connections-info {
      background-color: var(--color-bg-normal);
      .topbar {
        border-bottom: 0px;
        -webkit-app-region: drag;
      }
      .connection-head {
        display: flex;
        .title-name {
          display: inline-block;
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .offline {
          color: var(--color-text-light);
        }
        a.collapse-btn {
          font-size: 18px;
          float: right;
          margin-left: 12px;
          margin-top: -1px;
        }
        @include collapse-btn-transform(90deg, -90deg);
        .connection-message-count {
          top: 3px;
          left: 10px;
        }
      }
      .connection-tail {
        i {
          font-size: 20px;
          color: var(--color-text-title);
        }
        .remove-script-btn,
        .disconnect-btn,
        .stop-interval-btn {
          margin-right: 12px;
          i {
            color: var(--color-minor-red);
          }
        }
        .connect-loading,
        .edit-btn,
        .connect-btn,
        .new-window-btn {
          margin-right: 12px;
        }
        .edit-btn {
          &.disabled {
            cursor: not-allowed;
            color: var(--color-text-light);
          }
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
      padding: 13px 16px 12px 16px;
      height: auto;
      background-color: var(--color-bg-normal);
      &.topbar {
        border-bottom: 0px;
        min-height: 0px;
      }
      .el-input {
        .el-input__inner {
          background: var(--color-bg-primary);
        }
      }
      .content-search {
        margin: 0 19px 0 20px;
      }
      .search-btn {
        color: var(--color-text-default);
        margin-right: 10px;
        .icon-search,
        .el-icon-loading {
          font-size: 18px;
          line-height: 32px;
        }
      }
      .el-icon-circle-close {
        font-size: 16px;
        color: var(--color-text-default);
      }
    }
  }

  .connections-detail-main {
    height: 100%;
    transition: all 0.5s;
    .connections-body {
      .filter-bar {
        padding: 6px 16px;
        background: var(--color-bg-normal);
        border-bottom: 1px solid var(--color-border-default);
        position: fixed;
        left: 341px;
        right: 0;
        z-index: 1;
        transition: all 0.4s;
        .el-input .el-input__inner {
          border: none;
          color: var(--color-main-green);
        }
        .subs-title {
          color: var(--color-text-title);
          position: absolute;
        }
        .subs-btn {
          position: relative;
          top: 2px;
          left: 3px;
          display: inline-block;
          transform: rotate(180deg);
          .icon-zhedie {
            display: inline-block;
            transform: rotate(180deg);
          }
        }
        .message-type {
          @include flex-space-between;
          .received-type-select {
            width: 95px;
            margin-left: 245px;
          }
          .icon-tip {
            position: absolute;
            left: 245px;
            font-size: 16px;
            color: var(--color-text-tips);
          }
        }
      }
    }
    .connections-footer {
      transition: all 0.4s ease;
      position: fixed;
      width: inherit;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 4;
    }
  }
}
.connection-oper-item.el-dropdown-menu {
  .iconfont {
    font-size: 18px;
  }
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    .iconfont {
      margin-right: 8px;
    }
  }
  li.delete-item {
    display: block;
    color: var(--color-minor-red);
    &:hover {
      color: var(--color-minor-red);
      background: var(--color-light-red);
    }
  }
}

.message-popover {
  .popover-item {
    margin-top: 10px;
    &:last-child {
      margin-bottom: 0px;
    }
    label,
    span {
      color: var(--color-text-default);
    }
    label {
      margin-right: 8px;
    }
  }
}
</style>
