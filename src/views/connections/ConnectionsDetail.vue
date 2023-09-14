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
                  v-else
                  placement="bottom"
                  :effect="theme !== 'light' ? 'light' : 'dark'"
                  :open-delay="500"
                  :content="$t('connections.disconnectedBtn')"
                >
                  <a class="disconnect-btn" href="javascript:;" @click="disconnect">
                    <i v-if="!disconnectLoding" class="el-icon-switch-button"></i>
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
                  :class="['edit-btn', { disabled: client.connected || connectLoading }]"
                  href="javascript:;"
                  @click="handleEdit($route.params.id)"
                >
                  <i class="iconfont icon-edit"></i>
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
                  <el-dropdown-item command="newWindow">
                    <i class="iconfont icon-a-newwindow"></i>{{ $t('common.newWindow') }}
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
                    <i class="el-icon-switch-button"></i>{{ $t('connections.disconnect') }}
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
            <el-select class="received-type-select" size="mini" v-model="receivedMsgType">
              <el-option-group :label="$t('connections.receivedPayloadDecodedBy')">
                <el-option v-for="type in ['Plaintext', 'JSON', 'Base64', 'Hex']" :key="type" :value="type">
                </el-option>
              </el-option-group>
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
          ref="msgList"
          :key="$route.params.id"
          :subscriptions="record.subscriptions"
          :messages="recordMsgs.list"
          :height="messageListHeight"
          :marginTop="messageListMarginTop"
          @showContextMenu="handleContextMenu"
          @loadMoreMsg="loadMoreMessages"
          @hideNewMsgsTip="hideNewMsgsTip"
        />
        <MsgTip :count="newMsgsCount" @loadNewMsg="loadNewMsg" />
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
          :clientConnected="client.connected"
          @foucs="handleMessages"
          @handleSend="sendMessage"
        />
      </div>
    </div>
    <ExportData :visible.sync="showExportData" :connection="record" />
    <ImportData :visible.sync="showImportData" />
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
import { Subject, fromEvent } from 'rxjs'
import { bufferTime, map, filter, takeUntil } from 'rxjs/operators'

import time from '@/utils/time'
import matchMultipleSearch from '@/utils/matchMultipleSearch'
import { matchTopicMethod } from '@/utils/topicMatch'
import { createClient } from '@/utils/mqttUtils'
import { getBytes, getUptime, getVersion } from '@/utils/SystemTopicUtils'
import validFormatJson from '@/utils/validFormatJson'
import delay from '@/utils/delay'

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
import MsgTip from '@/components/MsgTip.vue'

import sandbox from '@/utils/sandbox'
import { hasMessagePayloadID, hasMessageHeaderID } from '@/utils/historyRecordUtils'
import useServices from '@/database/useServices'
import { getMessageId, getSubscriptionId } from '@/utils/idGenerator'
import getContextmenuPosition from '@/utils/getContextmenuPosition'
import { deserializeBufferToProtobuf, printObjectAsString, serializeProtobufToBuffer } from '@/utils/protobuf'

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
  | 'newWindow'

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
    MsgTip,
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
  private sendTimedMessageCount = 0
  private receivedMsgType: PayloadType = 'Plaintext'
  private msgType: MessageType = 'all'

  private client: Partial<MqttClient> = {
    connected: false,
    options: {},
  }
  private recordMsgs: MessagePaginationModel = {
    total: 0,
    publishedTotal: 0,
    receivedTotal: 0,
    limit: 20,
    page: 1,
    list: [],
  }
  private moreMsgBefore = true
  private moreMsgAfter = true
  private newMsgsCount = 0
  private searchParams = {
    topic: '',
    payload: '',
  }

  private retryTimes = 0
  private inputHeight = 180
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
      open: '282px',
      close: '91px',
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
    const count = this.recordMsgs.total
    const received = this.recordMsgs.receivedTotal
    const publish = this.recordMsgs.publishedTotal
    return {
      count,
      received,
      publish,
    }
  }

  get subListRef(): SubscriptionsList {
    return this.$refs.subList as SubscriptionsList
  }

  get curConnectionId(): string {
    return this.$route.params.id
  }

  @Watch('record')
  private async handleRecordChanged() {
    this.getConnectionValue(this.curConnectionId)
    this.handleMessages({ behavior: 'auto' })
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

  private checkScriptOption(optionName: 'function' | 'schema', optionMethod: 'received' | 'publish') {
    const applyOption: any = this.scriptOption?.apply
    const optionNameExists = Boolean(this.scriptOption?.[optionName]?.name)

    return this.scriptOption && ['all', optionMethod].includes(applyOption) && optionNameExists
  }

  private updateMeta(message: MessageModel, optionName: 'function' | 'schema', optionMethod: 'received' | 'publish') {
    if (this.checkScriptOption(optionName, optionMethod)) {
      const metaObj = JSON.parse(message.meta || '{}')
      metaObj[`${optionName}Name`] = this.scriptOption?.[optionName]?.name
      message.meta = JSON.stringify(metaObj)
    }
  }

  private updateMetaMsgType(message: MessageModel, msgType: PayloadType) {
    const metaObj = JSON.parse(message.meta || '{}')
    metaObj['msgType'] = msgType
    message.meta = JSON.stringify(metaObj)
  }

  private updateMetaError(message: MessageModel, error: string) {
    const metaObj = JSON.parse(message.meta || '{}')
    metaObj['msgError'] = error
    message.meta = JSON.stringify(metaObj)
  }

  // Connect
  public async connect(): Promise<boolean | void> {
    this.isReconnect = false
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.connectLoading = true
    // new client
    try {
      const { curConnectClient, connectUrl } = await createClient(this.record)
      this.client = curConnectClient
      const { id } = this.record
      if (id && this.client.on) {
        this.$log.info(`MQTTX client with ID ${id} assigned`)
        this.client.on('connect', this.onConnect)
        this.client.on('error', this.onError)
        this.client.on('reconnect', this.onReConnect)
        this.onMessageArrived(this.client as MqttClient, id)
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
    } catch (error) {
      const err = error as Error
      this.connectLoading = false
      this.$notify({
        title: err.toString(),
        message: '',
        type: 'error',
        duration: 4000,
        offset: 30,
      })
    }
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
        this.$log.error(error.toString())
      })
  }

  // Clean interval
  public stopTimedSend() {
    const timedMessageRef: TimedMessage = this.$refs.timedMessage as TimedMessage
    timedMessageRef['record'] = {
      sendFrequency: undefined,
    }
    this.sendFrequency = undefined
    this.sendTimedMessageCount = 0
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
    try {
      this.messageListHeight =
        document.body.offsetHeight -
        connectionTopbar.offsetHeight -
        connectionFooter.offsetHeight -
        filterBarOffsetHeight -
        8
    } catch (error) {
      // ignore(error)
    }
  }

  // Show context menu
  private handleContextMenu(msgItemInfo: IArguments, message: MessageModel) {
    const [payload, event] = msgItemInfo
    if (!this.showContextmenu) {
      const { x, y } = getContextmenuPosition(event as MouseEvent, 95, 77)
      this.contextmenuConfig.left = x
      this.contextmenuConfig.top = y
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
      this.$copyText(this.selectedInfo)
        .then(() => {
          this.$message.success(this.$tc('common.copySuccess'))
        })
        .catch(() => {
          this.$message.error(this.$tc('common.copyFail'))
        })
        .finally(() => {
          this.showContextmenu = false
        })
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
      case 'newWindow':
        this.handleNewWindow()
        break
      default:
        break
    }
  }

  // Route to edit page
  private handleEdit(id: string): boolean | void {
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.$router.push({
      path: `/recent_connections/${id}`,
      query: { oper: 'edit' },
    })
  }

  private hideNewMsgsTip() {
    if (!this.moreMsgAfter) this.newMsgsCount = 0
  }

  // Return messages
  private async getMessages(limit = 20) {
    this.newMsgsCount = 0
    const { messageService } = useServices()
    this.recordMsgs = await messageService.get(this.curConnectionId, {
      limit,
      msgType: this.msgType,
      topic: this.activeTopic,
      searchParams: this.searchParams,
    })
    this.moreMsgAfter = false
    if (this.recordMsgs.total > limit) {
      this.moreMsgBefore = true
    } else {
      this.moreMsgBefore = false
    }
  }

  private async loadMoreMessages(mode: 'before' | 'after' = 'before') {
    if ((mode === 'before' && !this.moreMsgBefore) || (mode === 'after' && !this.moreMsgAfter)) return

    if (this.recordMsgs.list.length === 0) {
      this.handleMessages()
      return
    }

    const msgListRef = this.getMsgListRef()
    mode === 'before' ? (msgListRef.showBeforeLoadingIcon = true) : (msgListRef.showAfterLoadingIcon = true)

    const { messageService } = useServices()
    let _messages = _.cloneDeep(this.recordMsgs.list)
    const currentMsg = mode === 'before' ? _messages[0] : _messages[_messages.length - 1]
    const { id, createAt } = currentMsg
    const { list, moreMsg } = await messageService.loadMore(this.curConnectionId, createAt, mode, {
      msgType: this.msgType,
      topic: this.activeTopic,
      searchParams: this.searchParams,
    })

    moreMsg === 'before' && (this.moreMsgBefore = true)
    moreMsg === 'after' && (this.moreMsgAfter = true)
    moreMsg === false && mode === 'before' && (this.moreMsgBefore = false)
    moreMsg === false && mode === 'after' && (this.moreMsgAfter = false)
    mode === 'before' && (this.moreMsgAfter = true)
    mode === 'after' && (this.moreMsgBefore = true)

    if (list.length > 0) {
      if (mode === 'before') {
        _messages.unshift(...list)
        if (_messages.length > 40) {
          _messages = _messages.slice(0, 40)
        }
      } else {
        _messages.push(...list)
        if (_messages.length > 40) {
          _messages = _messages.slice(_messages.length - 40, _messages.length)
        }
      }
      this.recordMsgs.list = _.cloneDeep(_messages)
      const timer = setTimeout(() => {
        this.$nextTick(() => {
          const idBox = document.querySelector(`#${id}`)
          idBox && idBox.scrollIntoView({ behavior: 'auto', block: mode === 'before' ? 'start' : 'end' })
        })
        clearTimeout(timer)
      }, 50)
    }
    mode === 'before' ? (msgListRef.showBeforeLoadingIcon = false) : (msgListRef.showAfterLoadingIcon = false)
  }

  private async handleMessages(opts: { limit?: number; behavior?: ScrollBehavior } = {}) {
    const defaultOpts: { limit?: number; behavior?: ScrollBehavior } = { limit: 20, behavior: 'smooth' }
    const { limit, behavior } = { ...defaultOpts, ...opts }
    await this.getMessages(limit)
    this.scrollToBottom(behavior)
  }

  private loadNewMsg() {
    this.msgType = 'all'
    this.handleMessages({ behavior: 'auto' })
  }

  // Clear messages
  private async handleMsgClear() {
    this.recordMsgs.list = []
    this.recordMsgs.total = 0
    this.recordMsgs.publishedTotal = 0
    this.recordMsgs.receivedTotal = 0
    this.recordMsgs.page = 1
    this.changeActiveConnection({
      id: this.curConnectionId,
      client: this.client,
    })
    if (this.record.id) {
      const { messageService } = useServices()
      await messageService.cleanInConnection(this.record.id)
      this.$log.info(`${this.record.name} was cleaned history connection messages`)
    }
  }

  // Message type changed
  private handleMsgTypeChanged(type: MessageType) {
    this.msgType = type
    this.handleMessages()
  }

  // Search messages
  private async searchContent() {
    this.searchLoading = true
    await this.handleMessages()
    this.searchLoading = false
  }

  // Delete topic item
  private handleTopicDelete(topic: string) {
    if (this.activeTopic === topic) this.activeTopic = ''
    this.handleMessages()
  }

  // Click topic item
  private handleTopicClick(sub: SubscriptionModel, reset: boolean) {
    reset ? (this.activeTopic = '') : (this.activeTopic = sub.topic)
    this.handleMessages()
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
  private handleSearchClose() {
    this.searchVisible = false
    this.searchParams = {
      topic: '',
      payload: '',
    }
    this.handleMessages()
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
      duration: 4000,
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

  private scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    this.$nextTick(async () => {
      const msgListRef = this.getMsgListRef()
      const msgListDOM = msgListRef?.$el
      if (msgListDOM) {
        msgListRef.loadSwitch = false
        msgListDOM.scrollTo({
          top: msgListDOM.scrollHeight + 160,
          left: 0,
          behavior,
        })
        await delay(1000)
        msgListRef.loadSwitch = true
      }
    })
  }

  // Set script
  private handleSetScript(func: ScriptModel, schema: ScriptModel, config: any, applyType: MessageType) {
    const currentScript: ScriptState = {
      apply: applyType,
      function: func,
      schema: schema,
      config: config,
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

  /*
   * Handles the processing of received MQTT messages
   * according to the specified schema, type, and user-defined function
   */
  private processReceivedMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
    const { qos, retain, properties } = packet
    let receivedPayload
    let jsonMsgError = ''
    /*
     * Payload processing pipeline for receiving a message:
     *      1. Raw Payload
     *           ⬇️
     *      2. [Schema | Type]: Decoding via custom schema (if defined) or default payload type conversion
     *           ⬇️
     *      3. [Function]: User-defined script processing to possibly further modify the payload
     *           ⬇️
     *      4. Final Payload: Ready for use in the application
     * Note:
     * - Function processing happens after schema/type decoding to allow the function to work with a more structured data.
     */
    if (
      (this.scriptOption?.function && ['all', 'received'].includes(this.scriptOption.apply)) ||
      this.receivedMsgType !== 'Plaintext'
    ) {
      const schemaPayload = this.convertPayloadBySchema(payload, 'received', this.receivedMsgType)
      if (!schemaPayload) {
        return
      }
      let convertedPayload
      try {
        convertedPayload = this.convertPayloadByType(schemaPayload, this.receivedMsgType, 'received')
      } catch (e) {
        jsonMsgError = (e as Error).toString()
      }
      if (!convertedPayload) {
        convertedPayload = schemaPayload
      }
      receivedPayload = this.convertPayloadByFunction(convertedPayload.toString(), 'received')
      if (this.scriptOption?.schema && this.receivedMsgType === 'Plaintext') {
        receivedPayload = this.scriptOption?.config?.name + ' ' + printObjectAsString(JSON.parse(receivedPayload))
      }
    } else {
      receivedPayload = this.convertPayloadBySchema(payload, 'received')
      if (!receivedPayload) {
        return
      }
    }
    const receivedMessage: MessageModel = {
      id: getMessageId(),
      out: false,
      createAt: time.getNowDate(),
      topic,
      payload: receivedPayload.toString(),
      qos,
      retain,
      properties,
    }
    this.updateMeta(receivedMessage, 'function', 'received')
    this.updateMeta(receivedMessage, 'schema', 'received')
    this.updateMetaMsgType(receivedMessage, this.receivedMsgType)
    if (this.receivedMsgType === 'JSON' && jsonMsgError) {
      this.updateMetaError(receivedMessage, jsonMsgError)
    }

    return receivedMessage
  }

  // Bytes Statistics
  private bytesStatistics(messages: MessageModel[]) {
    if (messages.length) {
      let bytesTimes = 0
      let _chartData: ChartDataModel = this.chartData
      let _version = this.version
      let _uptime = this.uptime
      messages.forEach((msg: MessageModel) => {
        const data = getBytes(msg)
        const version = getVersion(msg)
        const uptime = getUptime(msg)
        data && ((_chartData = data), (bytesTimes += 1))
        version && (_version = version)
        uptime && (_uptime = uptime)
      })
      this.chartData = _chartData
      this.version = _version
      this.uptime = _uptime
      if (this.chartData && bytesTimes) {
        const bytesStatistics = this.$refs.bytesStatistics as BytesStatistics
        this.$nextTick(() => {
          bytesStatistics.updateChart()
        })
      }
    }
  }

  // Save message
  private async saveMessage(id: string, messages: MessageModel[]) {
    try {
      if (messages.length) {
        const { messageService } = useServices()
        await messageService.pushToConnection(messages, id)
      }
    } catch (error) {
      this.$log.error((error as Error).toString())
    }
  }

  // Print message log
  private printMessageLog(id: string, message: MessageModel) {
    try {
      const { topic, retain } = message
      if (id === this.curConnectionId) {
        const isActiveTopicMessages = matchTopicMethod(this.activeTopic, topic)
        const isFromActiveTopic = this.msgType !== 'publish' && this.activeTopic && isActiveTopicMessages
        const isFromNotActiveTopic = this.msgType !== 'publish' && !this.activeTopic
        if (isFromActiveTopic || isFromNotActiveTopic) {
          this.$log.info(`Message Arrived with topic: ${topic}`)
          let receivedLog = `${this.record.name} message arrived: message added "${
            message.id
          }" and added to topic: "${topic}", payload: ${JSON.stringify(
            message.payload,
          )} MQTT.js onMessageArrived trigger`
          if (this.record.mqttVersion === '5.0') {
            const logProperties = JSON.stringify(message.properties)
            receivedLog += ` with Properties: ${logProperties}`
          }
          if (retain) {
            receivedLog += `, Retain Message`
          }
          this.$log.info(receivedLog)
        }
      } else {
        this.$log.info(`ID: ${id} received an unread message`)
      }
    } catch (error) {
      this.$log.error((error as Error).toString())
      return
    }
  }

  private getMsgListRef() {
    return this.$refs.msgList as MessageList
  }

  private isScrollBottom() {
    const msgListRef = this.getMsgListRef()
    const msgListDOM = msgListRef?.$el
    if (msgListDOM) {
      const { scrollTop, scrollHeight, clientHeight } = msgListDOM
      const isScrollBottom = scrollTop + clientHeight >= scrollHeight - 250
      return isScrollBottom
    }
  }

  // Render message
  private renderMessage(id: string, msgs: MessageModel | MessageModel[], msgType: 'received' | 'publish' = 'received') {
    try {
      const unreadMsgIncrement = (count: number) => this.unreadMessageIncrement({ id, increasedCount: count })
      const totalCountIncrement = (count: number) => (this.recordMsgs.total += count)
      const receivedTotalIncrement = (count: number) => (this.recordMsgs.receivedTotal += count)
      const publishedTotalIncrement = (count: number) => (this.recordMsgs.publishedTotal += count)
      const newMsgsCountIncrement = (count: number) => (this.newMsgsCount += count)
      const pushMsgs = (msgs: MessageModel[]) => {
        let _messages = _.cloneDeep(this.recordMsgs.list)
        msgs.forEach((msg: MessageModel) => {
          const isActiveTopicMessages = matchTopicMethod(this.activeTopic, msg.topic)
          const isActiveMsgType =
            this.msgType === 'all' ||
            (this.msgType === 'publish' && msg.out) ||
            (this.msgType === 'received' && !msg.out)
          if (isActiveMsgType && (!this.activeTopic || isActiveTopicMessages)) _messages.push(msg)
        })
        if (_messages.length > 40) _messages = _messages.slice(_messages.length - 40)
        this.recordMsgs.list = _messages
      }
      if (!Array.isArray(msgs)) msgs = [msgs]
      if (id !== this.curConnectionId) {
        unreadMsgIncrement(msgs.length)
        return
      }
      totalCountIncrement(msgs.length)
      const receivedMsgs = msgs.filter((msg: MessageModel) => !msg.out)
      const publishedMsgs = msgs.filter((msg: MessageModel) => msg.out)
      receivedTotalIncrement(receivedMsgs.length)
      publishedTotalIncrement(publishedMsgs.length)
      const isScrollBottom = this.isScrollBottom()
      if (msgType === 'received' && !isScrollBottom) {
        newMsgsCountIncrement(receivedMsgs.length)
        return
      }
      this.newMsgsCount = 0
      if (!this.moreMsgAfter && isScrollBottom) {
        pushMsgs(msgs)
        this.scrollToBottom()
        return
      }
      this.handleMessages()
    } catch (error) {
      this.$log.error((error as Error).toString())
    }
  }

  // Recevied message
  private onMessageArrived(client: MqttClient, id: string) {
    const unsubscribe$ = new Subject()

    if (client.listenerCount('close') <= 1) {
      fromEvent(client, 'close').subscribe(() => {
        unsubscribe$.next()
        unsubscribe$.complete()
        this.onClose()
      })
    }

    const messageSubject$ = fromEvent(client, 'message').pipe(takeUntil(unsubscribe$))

    const processMessageSubject$ = messageSubject$.pipe(
      map(([topic, payload, packet]: [string, Buffer, IPublishPacket]) => {
        return this.processReceivedMessage(topic, payload, packet)
      }),
    )

    const SYSMessageSubject$ = processMessageSubject$.pipe(
      filter((m: MessageModel) => this.showBytes && id === this.curConnectionId && m.topic.includes('$SYS')),
    )

    const nonSYSMessageSubject$ = processMessageSubject$.pipe(
      filter((m: MessageModel) => !(this.showBytes && id === this.curConnectionId && m.topic.includes('$SYS'))),
    )

    // Print message log
    nonSYSMessageSubject$.subscribe((message: MessageModel) => {
      this.printMessageLog(id, message)
    })

    // Render messages
    nonSYSMessageSubject$.pipe(bufferTime(500)).subscribe((messages: MessageModel[]) => {
      messages.length && this.renderMessage(id, messages)
    })

    // Save messages
    nonSYSMessageSubject$.pipe(bufferTime(1000)).subscribe((messages: MessageModel[]) => {
      messages.length && this.saveMessage(id, messages)
    })

    // Bytes statistics
    SYSMessageSubject$.pipe(bufferTime(1000)).subscribe((messages: MessageModel[]) => {
      this.bytesStatistics(messages)
    })
  }

  // Set timed message success
  private setTimerSuccess(time: number) {
    this.sendFrequency = time
  }

  /**
   * Sends a message. If a send frequency is defined, it also sets up a timed message.
   */
  private async sendMessage(
    message: MessageModel,
    type: PayloadType,
    afterpublishMessageCallback?: (isNewPayload: boolean) => void,
    afterCallback?: () => void,
  ): Promise<void> {
    await this.publishMessage(message, type, afterpublishMessageCallback)
    if (this.sendFrequency) {
      this.notifyTimedMessageSuccess()
      this.timedSendMessage(this.sendFrequency, message, type)
    }
    afterCallback?.()
  }

  /**
   * Notifies the user about the successful setup of a timed message.
   */
  private notifyTimedMessageSuccess() {
    this.$message.success(`${this.$t('connections.startTimedMessage')}${this.sendFrequency}`)
    this.$log.info(`${this.record.name} opened timed message successfully, frequency(s): ${this.sendFrequency}s`)
  }

  /**
   * Sets up a message to be sent at regular intervals defined by the 'time' parameter.
   */
  private timedSendMessage(time: number, message: MessageModel, type: PayloadType) {
    this.stopTimedSend()
    this.sendTimedMessageCount += 1
    this.sendTimeId = window.setInterval(() => {
      message.id = getMessageId()
      this.publishMessage(message, type)
    }, time * 1000)
  }

  /**
   * Inserts the message history into local storage.
   */
  private async insertHistory(payload: HistoryMessagePayloadModel, header: HistoryMessageHeaderModel) {
    const { historyMessagePayloadService, historyMessageHeaderService } = useServices()
    const payloadIdToUpdate = await hasMessagePayloadID(payload)
    const headerIdToUpdate = await hasMessageHeaderID(header)

    payloadIdToUpdate
      ? await historyMessagePayloadService.updateCreateAt(payloadIdToUpdate)
      : await historyMessagePayloadService.create(payload)

    headerIdToUpdate
      ? await historyMessageHeaderService.updateCreateAt(headerIdToUpdate)
      : await historyMessageHeaderService.create(header)

    return { isNewPayload: !payloadIdToUpdate, isNewHeader: !headerIdToUpdate }
  }

  /**
   * Filters out entries from an object where the value is null or undefined.
   */
  private filterNonNullEntries(properties: any): any {
    return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v != null))
  }

  /**
   * Processes message properties and returns a refined version.
   */
  private processProperties(properties: any) {
    const props = this.filterNonNullEntries(properties)
    if (props.correlationData && typeof props.correlationData === 'string') {
      props.correlationData = Buffer.from(props.correlationData)
    }
    if (props.userProperties) {
      props.userProperties = { ...props.userProperties } // Convert Vue object to JS object
    }
    return props
  }

  /**
   * Publih a single message to the MQTT topic. Inserts the message to the history,
   * processes the payload, and handles the publish process.
   */
  private async publishMessage(
    message: MessageModel,
    type: PayloadType,
    afterSendCallback?: (isNewPayload: boolean) => void,
  ): Promise<void> {
    const { topic, qos, payload, retain, properties } = message

    const props = properties ? this.processProperties(properties) : undefined

    const { isNewPayload } = await this.insertHistory(
      { payload, payloadType: type } as HistoryMessagePayloadModel,
      { qos, topic, retain } as HistoryMessageHeaderModel,
    )

    let convertedPayload = ''
    let finalPayload: string | Buffer | undefined = payload

    /*
     * Payload processing pipeline for publishing:
     *      1. Raw Payload
     *           ⬇️
     *      2. [Function]: user-defined script processing
     *           ⬇️
     *      3. [Schema | Type]: decoding via custom schema (if defined) or default payload type conversion
     *           ⬇️
     *      4. Final Payload: ready for publishing
     * Note:
     * - Empty payloads are allowed to facilitate the clearing of retained messages.
     */
    if (payload) {
      convertedPayload = this.convertPayloadByFunction(payload as string, 'publish', type)
      finalPayload = this.handlePayloadBySchemaOrType(convertedPayload, type)
      if (finalPayload === undefined) return
    }

    this.client.publish!(
      topic,
      finalPayload,
      { qos, retain, properties: props as IClientPublishOptions['properties'] },
      async (error: Error) => {
        if (error) {
          this.handleErrorOnPublish(error)
          return
        }
        /*
         * Store the message in the database and update the UI. We store the convertedPayload instead of the finalPayload for these reasons:
         * 1. The finalPayload might be a Buffer, which isn't suitable for storage.
         * 2. To retain a human-readable payload that reflects the original or the user-script processed data.
         */
        await this.handleSuccessfulPublish(message, convertedPayload)
      },
    )

    afterSendCallback?.(isNewPayload)
  }

  /**
   * Converts the given payload based on the specified option. Can return string, undefined or void.
   */
  private handlePayloadBySchemaOrType(convertedPayload: string, type: PayloadType): Buffer | string | undefined {
    const payload =
      this.scriptOption?.schema && ['all', 'publish'].includes(this.scriptOption.apply)
        ? this.convertPayloadBySchema(convertedPayload, 'publish', type)
        : this.convertPayloadByType(convertedPayload, type, 'publish')

    return payload
  }

  /**
   * Handles errors that occur during the message publish process.
   */
  private handleErrorOnPublish(error: Error) {
    const errorMsg = error.toString()
    this.$message.error(errorMsg)
    this.stopTimedSend()
    this.$log.error(`${this.record.name} message publish failed, ${error.stack}`)
  }

  /**
   * Handles the operations after a successful message publish.
   */
  private async handleSuccessfulPublish(message: MessageModel, publishedPayload: string | undefined) {
    if (publishedPayload === undefined) {
      return
    }
    const { id, topic, qos, retain } = message

    const properties = this.record.mqttVersion === '5.0' ? this.processProperties(message.properties) : undefined
    const publishMessage: MessageModel = {
      id,
      out: true,
      createAt: time.getNowDate(),
      topic,
      payload: publishedPayload.toString(),
      qos,
      retain,
      properties,
    }

    this.updateMeta(publishMessage, 'function', 'publish')
    this.updateMeta(publishMessage, 'schema', 'publish')

    if (this.record.id) {
      const { messageService } = useServices()
      await messageService.pushToConnection({ ...publishMessage }, this.record.id)
      this.renderMessage(this.curConnectionId, publishMessage, 'publish')
      this.logSuccessfulPublish(publishMessage)
    }
  }

  /**
   * Logs details of a successfully published message.
   */
  private logSuccessfulPublish(publishMessage: MessageModel) {
    const logPayload = JSON.stringify(publishMessage.payload)
    let pubLog = `${this.record.name} successfully published message ${logPayload} to topic "${publishMessage.topic}"`
    if (this.record.mqttVersion === '5.0') {
      const logProperties = JSON.stringify(publishMessage.properties)
      pubLog += ` with Properties: ${logProperties}`
    }
    this.$log.info(pubLog)
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
  private convertPayloadByType(
    value: Buffer | string,
    type: PayloadType,
    way: 'publish' | 'received',
  ): Buffer | string | undefined {
    const genPublishPayload = (publishType: PayloadType, publishValue: string) => {
      if (publishType === 'Base64') {
        return Buffer.from(publishValue, 'base64')
      }
      if (publishType === 'Hex') {
        return Buffer.from(publishValue.replaceAll(' ', ''), 'hex')
      }
      if (publishType === 'JSON') {
        try {
          validFormatJson(publishValue.toString())
        } catch (error) {
          const err = error as Error
          let errorMessage = `${this.$t('connections.publishMsg')} ${err.toString()}`
          this.$message.error(errorMessage)
          return undefined
        }
      }
      return publishValue
    }
    const genReceivePayload = (receiveType: PayloadType, receiveValue: Buffer) => {
      if (receiveType === 'Base64') {
        return receiveValue.toString('base64')
      }
      if (receiveType === 'Hex') {
        return receiveValue.toString('hex').replace(/(.{4})/g, '$1 ')
      }
      if (receiveType === 'JSON') {
        let jsonValue: string | undefined
        try {
          jsonValue = validFormatJson(receiveValue.toString())
        } catch (error) {
          throw error
        }
        if (jsonValue) {
          return jsonValue
        }
      }
      return receiveValue.toString()
    }
    if (way === 'publish') {
      return genPublishPayload(type, value as string)
    } else if (way === 'received') {
      return genReceivePayload(type, value as Buffer)
    }
    return value
  }

  // Use function to apply to payload
  private convertPayloadByFunction(payload: string, msgType: MessageType, type?: PayloadType): string {
    let convertedPayload = payload
    if (this.scriptOption?.function && ['all', msgType].includes(this.scriptOption.apply)) {
      if (this.sendFrequency || this.sendTimeId !== null) {
        msgType === 'publish' && (this.sendTimedMessageCount += 1)
      } else {
        this.sendTimedMessageCount = 0
      }
      const count = this.sendTimedMessageCount || undefined
      // Enable script function
      try {
        convertedPayload = sandbox.executeScript(
          this.scriptOption.function.script,
          type || this.receivedMsgType,
          payload,
          msgType,
          count,
        )
      } catch (error) {
        this.$message.error(`Function Error: ${(error as Error).toString()}`)
      }
    }
    return convertedPayload
  }

  // Use schema to apply to payload
  private convertPayloadBySchema(
    payload: Buffer | string,
    msgType: MessageType,
    to?: PayloadType,
  ): string | Buffer | undefined {
    let convertedPayload = payload
    try {
      if (this.scriptOption?.schema && ['all', msgType].includes(this.scriptOption.apply)) {
        switch (msgType) {
          case 'publish': {
            const result = serializeProtobufToBuffer(
              payload as string,
              this.scriptOption.schema.script,
              this.scriptOption?.config?.name,
              to,
            )
            if (result) return result
            break
          }
          case 'received': {
            const result = deserializeBufferToProtobuf(
              payload as Buffer,
              this.scriptOption.schema.script,
              this.scriptOption?.config?.name,
              to,
            )
            if (result) return result
            break
          }
        }
      }
      return convertedPayload
    } catch (error) {
      this.$message.error((error as Error).toString())
      return
    }
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
      const { resubscribe } = this.client.options
      const { subscriptions } = this.record
      const needResub = resubscribe && subscriptions.length
      if (needResub) {
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
      if (client.connected && msgEventCount === 0) {
        this.onMessageArrived(client, connectionID)
      }
      this.changeActiveConnection({
        id: connectionID,
        client,
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
    window.addEventListener('resize', () => {
      this.setMessageListHeight()
    })
  }

  private beforeDestroy() {
    ipcRenderer.removeAllListeners('searchContent')
    this.removeClinetsMessageListener()
    this.stopTimedSend()
    window.removeEventListener('resize', () => {
      this.setMessageListHeight()
    })
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
          font-weight: 400;
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
      position: relative;
      .filter-bar {
        padding: 7px 16px;
        background: var(--color-bg-normal);
        border-bottom: 1px solid var(--color-border-default);
        box-shadow: #00000010 0px 2px 4px;
        position: fixed;
        left: 341px;
        right: 0;
        z-index: 1;
        transition: all 0.4s;
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
            width: 88px;
            margin-left: 227px;
            .el-input__inner {
              padding: 4px 10px;
            }
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
  .iconfont,
  [class^='el-icon-'] {
    font-size: 18px;
    font-weight: 400;
  }
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    .iconfont,
    [class^='el-icon-'] {
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
.el-select-group__title {
  padding-right: 20px;
  color: var(--color-text-light) !important;
  font-size: 13px;
  height: 34px;
  border-bottom: 1px solid var(--color-border-default);
}
</style>
