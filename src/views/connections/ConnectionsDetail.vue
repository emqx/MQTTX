<template>
  <div class="connections-detail">
    <copilot v-if="enableCopilot" ref="copilot" :record="record" mode="connections" />
    <div
      ref="connectionTopbar"
      class="connections-topbar right-topbar"
      :style="{
        left: leftValue,
      }"
    >
      <div class="connections-info">
        <div class="topbar">
          <div class="connection-head">
            <el-tooltip
              placement="bottom"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('connections.showConnections')"
            >
              <a
                v-if="!showConnectionList"
                href="javascript:;"
                class="show-connections-button"
                @click="
                  toggleShowConnectionList({
                    showConnectionList: true,
                  })
                "
              >
                <i class="iconfont icon-show-connections"></i>
              </a>
            </el-tooltip>
            <el-tooltip
              :disabled="!showTitleTooltip"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :content="titleName"
              :open-delay="500"
              placement="top"
            >
              <h2 ref="title" :class="[{ offline: !client.connected }, 'title-name']">
                {{ titleName }}
              </h2>
            </el-tooltip>
            <a
              href="javascript:;"
              :class="['collapse-btn', showClientInfo ? 'top' : 'bottom']"
              @click="handleCollapse($route.params.id)"
            >
              <i class="iconfont icon-collapse"></i>
            </a>
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
                    <i class="iconfont icon-stop-timing"></i>
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
                <i class="iconfont icon-stop-script"></i>
              </a>
            </el-tooltip>
            <el-tooltip
              v-if="enableCopilot"
              placement="bottom"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              content="MQTTX Copilot"
            >
              <a href="javascript:;" class="copilot-btn" @click="toggleShowCopilot">
                <i class="iconfont icon-chat"></i>
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
                  <el-dropdown-item command="clearHistory">
                    <i class="iconfont icon-clear-history"></i>{{ $t('connections.clearHistory') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="useScript" :disabled="!client.connected">
                    <i class="iconfont icon-use-script"></i>{{ $t('script.useScript') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="newWindow">
                    <i class="iconfont icon-new-window"></i>{{ $t('common.newWindow') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="exportData">
                    <i class="iconfont icon-export-data"></i>{{ $t('connections.exportData') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="importData">
                    <i class="iconfont icon-import-data"></i>{{ $t('connections.importData') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="syncToTopicTree">
                    <i class="iconfont icon-tree-view"></i>{{ $t('connections.syncToTopicTree') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="trafficMonitor" :disabled="!client.connected">
                    <i class="iconfont icon-bytes-statistics"></i>{{ $t('viewer.trafficMonitor') }}
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
      class="connections-detail-main"
      :style="{
        paddingTop: msgTopValue,
        paddingBottom: `${msgBottom}px`,
        marginLeft: detailLeftValue,
      }"
    >
      <div class="connections-body">
        <div ref="filterBar" class="filter-bar" :style="{ top: bodyTopValue, left: detailLeftValue }">
          <div class="message-type">
            <el-select
              class="received-type-select"
              size="mini"
              v-model="receivedMsgType"
              @change="handleReceivedMsgTypeChange"
            >
              <el-option-group :label="$t('connections.receivedPayloadDecodedBy')">
                <el-option
                  v-for="type in ['Plaintext', 'JSON', 'Base64', 'Hex', 'CBOR', 'MsgPack']"
                  :key="type"
                  :value="type"
                >
                </el-option>
              </el-option-group>
            </el-select>
            <MsgTypeTabs v-model="msgType" @change="handleMsgTypeChanged" />
          </div>
        </div>
        <SubscriptionsList
          v-if="$route.params.id"
          ref="subList"
          :connectionId="$route.params.id"
          :record="record"
          :top="bodyTopValue"
          @onClickTopic="handleTopicClick"
          @deleteTopic="handleTopicDelete"
          @onSubError="handleSubTopicError"
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

      <div ref="connectionFooter" class="connections-footer" :style="{ marginLeft: detailLeftValue }">
        <ResizeHeight v-model="inputHeight" />
        <MsgPublish
          :mqtt5PropsEnable="record.mqttVersion === '5.0'"
          ref="msgPublish"
          :editor-height="inputHeight - 75"
          :style="{ height: `${inputHeight}px` }"
          :disabled="sendTimeId !== null"
          :clientConnected="client.connected"
          :sendTimeId="sendTimeId"
          @foucs="handleMessages"
          @handleSend="throttleSendMessage"
          @handleSendTimedMessage="handleCommand('timedMessage')"
          @onInsertedCode="handleInsertedCode"
        />
      </div>
    </div>
    <ExportData :visible.sync="showExportData" :connection="record" />
    <ImportData :visible.sync="showImportData" />
    <TimedMessage ref="timedMessage" :visible.sync="showTimedMessage" @setTimerSuccess="setTimerSuccess" />
    <UseScript ref="useScript" :visible.sync="showUseScript" @setScript="handleSetScript" />
    <SyncTopicTreeDialog
      :visible.sync="showSyncTopicTreeDialog"
      :auto-sync="true"
      :sync-connection-id="curConnectionId"
      @success="handleSyncTopicTreeSuccess"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { ipcRenderer } from 'electron'
import { MqttClient, IConnackPacket, IPublishPacket, IClientPublishOptions, IDisconnectPacket, Packet } from 'mqtt'
import _ from 'lodash'
import { Subject, fromEvent } from 'rxjs'
import { bufferTime, map, filter, takeUntil, shareReplay } from 'rxjs/operators'
import cbor from 'cbor'
import { pack, unpack } from 'msgpackr'

import time from '@/utils/time'
import matchMultipleSearch from '@/utils/matchMultipleSearch'
import { matchTopicMethod } from '@/utils/topicMatch'
import { createClient, ignoreQoS0Message } from '@/utils/mqttUtils'
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
import UseScript from '@/components/UseScript.vue'
import MsgTypeTabs from '@/components/MsgTypeTabs.vue'
import MsgTip from '@/components/MsgTip.vue'
import Copilot from '@/components/Copilot.vue'

import sandbox from '@/utils/sandbox'
import { hasMessagePayloadID, hasMessageHeaderID } from '@/utils/historyRecordUtils'
import useServices from '@/database/useServices'
import { getMessageId, getSubscriptionId } from '@/utils/idGenerator'
import getContextmenuPosition from '@/utils/getContextmenuPosition'
import { deserializeBufferToProtobuf, printObjectAsString, serializeProtobufToBuffer } from '@/utils/protobuf'
import { jsonStringify } from '@/utils/jsonUtils'
import { LeftValues, BodyTopValues, MsgTopValues, DetailLeftValues } from '@/utils/styles'
import getErrorReason from '@/utils/mqttErrorReason'
import { isLargeData } from '@/utils/data'
import { serializeAvroToBuffer, deserializeBufferToAvro } from '@/utils/avro'
import { globalEventBus } from '@/utils/globalEventBus'
import SyncTopicTreeDialog from '@/widgets/SyncTopicTreeDialog.vue'

type CommandType =
  | 'searchContent'
  | 'clearHistory'
  | 'disconnect'
  | 'deleteConnect'
  | 'exportData'
  | 'importData'
  | 'timedMessage'
  | 'syncToTopicTree'
  | 'trafficMonitor'
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
    MessageList,
    UseScript,
    MsgTypeTabs,
    MsgTip,
    Copilot,
    SyncTopicTreeDialog,
  },
})
export default class ConnectionsDetail extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection!: (payload: { readonly id: string }) => void
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo!: (payload: ClientInfo) => void
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void
  @Action('SET_SCRIPT') private setScript!: (payload: { currentScript: ScriptState | null }) => void
  @Action('TOGGLE_SHOW_CONNECTION_LIST') private toggleShowConnectionList!: (payload: {
    showConnectionList: boolean
  }) => void

  @Getter('activeConnection') private activeConnection!: ActiveConnection
  @Getter('maxReconnectTimes') private maxReconnectTimes!: number
  @Getter('currentTheme') private theme!: Theme
  @Getter('showClientInfo') private clientInfoVisibles!: { [id: string]: boolean }
  @Getter('currentScript') private scriptOption!: ScriptState | null
  @Getter('enableCopilot') private enableCopilot!: boolean
  @Getter('showConnectionList') private showConnectionList!: boolean

  /**
   * Notice: when we jump order by `other page` -> `creation page` -> `connection page`,
   * MsgPublish/editor twice which is not we expected, it should be init only once.
   * `other page` -> `creation page` the MsgPublish/editor will init, `creation page` -> `connection page` init editor again.
   * So when route jump order by `other page` -> `creation page`, we need to operate editor creation and destroy manually by listening on route.
   * relative PR: https://github.com/emqx/MQTTX/pull/518 https://github.com/emqx/MQTTX/pull/446
   */
  @Watch('$route.path', { immediate: true, deep: true })
  private handleIdChanged(to: string, from: string) {
    // Stop reconnection attempts if the page changes, as reconnection only works on the current connection page
    this.forceStopToReconnect()
    // When route jump order by `other page` -> `creation page`
    if (!from && to && to === '/recent_connections/0') {
      // Destroy the MsgPublish/editor
      setTimeout(() => {
        const msgPublishRef: MsgPublish = this.$refs.msgPublish as MsgPublish
        msgPublishRef.editorDestory()
      }, 100)
    }
  }

  private showClientInfo = true
  private showExportData = false
  private showImportData = false
  private showTimedMessage = false
  private showUseScript = false
  private showTitleTooltip = false
  private showSyncTopicTreeDialog = false

  private connectLoading = false
  private disconnectLoding = false
  private searchVisible = false
  private searchLoading = false

  private sendFrequency: number | undefined = undefined
  private sendTimeId: number | null = null
  private sendTimedMessageCount = 0
  private receivedMsgType: PayloadType = this.getReceivedMsgType()
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

  private reTryConnectTimes = 0
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

  get titleName() {
    return this.record.name
  }

  get bodyTopValue(): string {
    return this.showClientInfo ? BodyTopValues.Open : BodyTopValues.Close
  }

  get msgTopValue(): string {
    return this.showClientInfo ? MsgTopValues.Open : MsgTopValues.Close
  }

  get leftValue(): string {
    return this.showConnectionList ? LeftValues.Show : LeftValues.Hide
  }

  get detailLeftValue(): string {
    return this.showConnectionList ? DetailLeftValues.Show : DetailLeftValues.Hide
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

  @Watch('titleName')
  private async checkTitleOverflow() {
    await this.$nextTick()
    const titleElement = this.$refs.title as HTMLElement
    if (titleElement?.scrollWidth > 200) {
      this.showTitleTooltip = true
    } else {
      this.showTitleTooltip = false
    }
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

  private updateMetaBigData(message: MessageModel) {
    const metaObj = JSON.parse(message.meta || '{}')
    metaObj['isLargeData'] = true
    message.meta = JSON.stringify(metaObj)
  }

  // Connect
  public async connect(): Promise<boolean | void> {
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.connectLoading = true
    // new client
    try {
      const { curConnectClient, connectUrl } = await createClient(this.record)
      this.client = curConnectClient
      const { id, name, host, protocol, port, path, clientId } = this.record
      if (id && this.client.on) {
        this.$log.info(`Assigned ID ${id} to MQTTX client`)
        this.client.on('connect', this.onConnect)
        this.client.on('error', this.onError)
        this.client.on('reconnect', this.onReConnect)
        this.client.on('disconnect', this.onDisconnect)
        this.client.on('offline', this.onOffline)
        this.onMessageArrived(this.client as MqttClient, id)
        // Debug MQTT Packet Log
        this.client.on('packetsend', (packet) => this.onPacketSent(packet, name))
        this.client.on('packetreceive', (packet) =>
          this.onPacketReceived(packet, { host, name, clientId, id, protocol, port, path }),
        )
      }

      const protocolLogMap: ProtocolMap = {
        mqtt: 'MQTT/TCP connection',
        mqtts: 'MQTT/SSL connection',
        ws: 'MQTT/WS connection',
        wss: 'MQTT/WSS connection',
      }
      const curOptionsProtocol: Protocol = (this.client as MqttClient).options.protocol as Protocol
      let connectLog = `Client ${this.record.name} connected using ${protocolLogMap[curOptionsProtocol]} at ${connectUrl}`
      this.$log.info(connectLog)
    } catch (error) {
      const err = error as Error
      this.connectLoading = false
      this.notifyMsgWithCopilot(err.toString())
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
          const { connectionService, topicNodeService } = useServices()
          const res = await Promise.all([
            topicNodeService.deleteTopicNodesForConnection(id),
            connectionService.delete(id),
          ])
          const [_, connection] = res
          if (connection) {
            this.$emit('delete')
            this.$message.success(this.$tc('common.deleteSuccess'))
            if (connection.id) {
              this.removeActiveConnection({ id: connection.id })
              this.$log.info(
                `Successfully removed MQTTX connection ${connection.name}@${connection.host} with clientID ${connection.clientId}`,
              )
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
      this.$log.info(`Timed messages sending stopped for ${this.record.name}@${this.record.host}`)
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
    let isOut = false
    if (this.selectedMessage && this.selectedMessage.id) {
      id = this.selectedMessage.id.toString()
      isOut = this.selectedMessage.out
    }
    const { messageService } = useServices()
    let res: MessageModel | undefined
    if (isOut) {
      res = await messageService.delete(id)
    } else {
      const { topicNodeService } = useServices()
      const [_res, _] = await Promise.all([messageService.delete(id), topicNodeService.updateTopicNodeByMessageId(id)])
      res = _res
    }
    if (res) {
      this.showContextmenu = false
      this.$message.success(this.$tc('common.deleteSuccess'))
      this.$emit('reload')
      this.$log.info(
        `Successfully deleted message from ${this.record.name} with ClientID ${
          this.record.clientId
        } and payload ${jsonStringify(res.payload)}`,
      )
    } else {
      this.showContextmenu = false
      this.$message.error(this.$tc('common.deletefailed'))
      this.$log.info('Message deletion failed')
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
    if (currentActiveConnection) {
      this.client = currentActiveConnection.client
      this.setClientsMessageListener()
    } else {
      this.client = {
        connected: false,
      }
    }
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
      case 'syncToTopicTree':
        this.showSyncTopicTreeDialog = true
        break
      case 'trafficMonitor':
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

  private handleSyncTopicTreeSuccess() {
    setTimeout(() => {
      this.$router.push({
        name: 'TopicTree',
      })
    }, 1000)
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

  private getReceivedMsgType(): PayloadType {
    const _receivedMsgType = localStorage.getItem('receivedMsgType')
    if (!_receivedMsgType) {
      return 'Plaintext'
    }
    return _receivedMsgType as PayloadType
  }

  private handleReceivedMsgTypeChange(receivedMsgType: PayloadType) {
    localStorage.setItem('receivedMsgType', receivedMsgType)
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
      const { messageService, topicNodeService } = useServices()
      await Promise.all([
        topicNodeService.deleteTopicNodesForConnection(this.record.id),
        messageService.cleanInConnection(this.record.id),
      ])
      this.$log.info(
        `History connection messages and topic tree nodes were cleaned for ${this.record.name}@${this.record.host}`,
      )
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

  private handleSubTopicError(errMsg: string, info?: string) {
    this.notifyMsgWithCopilot(errMsg, info, () => {
      this.subListRef.showDialog = false
    })
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
    this.forceCloseTheConnection()
    this.$log.info(`Cancelled connection for MQTTX client named ${this.record.name}`)
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
      this.reTryConnectTimes = 0

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
      this.$log.info(`MQTTX client named ${this.record.name} with client ID ${this.record.clientId} disconnected`)
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
    this.$log.info(`Successful connection for ${this.record.name}@${this.record.host}, MQTT.js onConnect trigger`)
  }

  // Error callback
  private onError(error: Error) {
    let msgTitle = this.$tc('connections.connectFailed')
    if (error) {
      msgTitle = error.toString()
    }
    this.forceCloseTheConnection()
    this.notifyMsgWithCopilot(msgTitle)
    this.$log.error(
      `Connection for ${this.record.name}@${this.record.host} failed, MQTT.js onError trigger, Error: ${error.stack}`,
    )
    this.$emit('reload')
  }

  // Reconnect callback
  private onReConnect() {
    if (!this.record.reconnect) {
      this.forceCloseTheConnection()
      this.$notify({
        title: this.$tc('connections.connectFailed'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      this.$emit('reload')
    } else {
      this.reTryConnectTimes += 1
      if (this.reTryConnectTimes > this.maxReconnectTimes) {
        this.$log.warn('Max reconnect limit reached, stopping retries')
        this.forceCloseTheConnection()
      } else {
        this.$log.info(
          `Retrying connection for ${this.record.name}@${this.record.host}, attempt: [${this.reTryConnectTimes}/${this.maxReconnectTimes}]`,
        )
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
    this.$log.info(`Connection for ${this.record.name}@${this.record.host} closed, MQTT.js onClose trigger`)
    this.connectLoading = false
  }

  // Emitted after receiving disconnect packet from broker. MQTT 5.0 feature.
  private onDisconnect(packet: IDisconnectPacket) {
    const reasonCode = packet.reasonCode!
    const reason = reasonCode === 0 ? 'Normal disconnection' : getErrorReason('5.0', reasonCode)
    this.notifyMsgWithCopilot(
      this.$t('connections.onDisconnect', { reason, reasonCode }) as string,
      JSON.stringify(packet),
      () => {},
      'warning',
    )
    const logMessage = 'Received disconnect packet from Broker. MQTT.js onDisconnect trigger'
    this.$log.warn(logMessage)
  }

  // Emitted when the client goes offline.
  private onOffline() {
    this.$log.info(
      `The connection ${this.record.name} (clientID ${this.record.clientId}) is offline. MQTT.js onOffline trigger`,
    )
  }

  /**
   * Handles the event when a packet is sent.
   * @param {Packet} packet - The packet that was sent.
   * @param {string} name - The name of the connection.
   */
  private onPacketSent(packet: Packet, name: string) {
    this.$log.debug(`[${name}] Sent packet: ${JSON.stringify(packet)}`)
  }

  /**
   * Handles the event when a packet is received.
   *
   * @param {Packet} packet - The received packet.
   * @param {string} name - The name of the connection.
   */
  private onPacketReceived(
    packet: Packet,
    {
      name,
      host,
      id,
      clientId,
      protocol,
      port,
      path,
    }: {
      name: string
      host: string
      id: string
      clientId: string
      protocol?: string
      port: number
      path: string
    },
  ) {
    globalEventBus.emit('packetReceive', packet, {
      name,
      clientId,
      host,
      id,
      protocol,
      port,
      path,
    })
    this.$log.debug(`[${name}] Received packet: ${JSON.stringify(packet)}`)
  }

  private forceCloseTheConnection() {
    if (this.client.end) {
      this.client.end(true, () => {
        this.reTryConnectTimes = 0
        this.connectLoading = false
        this.$log.warn(`MQTTX force closed the connection ${this.record.name} (Client ID: ${this.record.clientId})`)
      })
    }
  }

  private forceStopToReconnect() {
    if (this.client.reconnecting && this.client.connected === false) {
      this.client.reconnecting = false
      this.forceCloseTheConnection()
      this.$log.warn(
        `MQTTX force stopped reconnecting for ${this.record.name}@${this.record.host} - Client ID: ${this.record.clientId}`,
      )
    }
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
    this.$log.info(`Script set successfully for ${this.record.name}@${this.record.host}`)
  }

  // Remove script
  private removeScript() {
    this.setScript({ currentScript: null })
    this.$message.success(this.$tc('script.stopScirpt'))
    this.$log.info(`Script removed successfully from ${this.record.name}@${this.record.host}`)
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
    if (['JSON', 'CBOR', 'MsgPack'].includes(this.receivedMsgType) && jsonMsgError) {
      this.updateMetaError(receivedMessage, jsonMsgError)
    }
    if (isLargeData(receivedMessage.payload)) {
      this.updateMetaBigData(receivedMessage)
    }

    return receivedMessage
  }

  // Save message
  private async saveMessage(id: string, messages: MessageModel[]) {
    try {
      if (messages.length) {
        const { messageService } = useServices()
        await messageService.pushMsgsToConnection(messages, id)
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
          let receivedLog = `Message arrived for ${this.record.name}@${
            this.record.host
          } with topic: "${topic}". Message ID: "${message.id}", payload: ${jsonStringify(
            message.payload,
          )}. MQTT.js onMessageArrived trigger`
          this.$log.info(receivedLog)
        }
      } else {
        this.$log.info(`Connection with ID: ${id} has received a new, unread message`)
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

  // received message
  private onMessageArrived(client: MqttClient, id: string) {
    const unsubscribe$ = new Subject<void>()

    // Add close event handler if not already present
    if (client.listenerCount('close') <= 1) {
      fromEvent(client, 'close').subscribe(() => {
        unsubscribe$.next()
        unsubscribe$.complete()
        this.onClose()
      })
    }

    // Process message stream
    const messageSubject$ = fromEvent(client, 'message').pipe(
      takeUntil(unsubscribe$),
      map(([topic, payload, packet]: [string, Buffer, IPublishPacket]) => {
        return this.processReceivedMessage(topic, payload, packet)
      }),
      shareReplay(1),
    )

    // Print message log
    messageSubject$.subscribe((message: MessageModel) => {
      this.printMessageLog(id, message)
    })

    // Render messages
    messageSubject$.pipe(bufferTime(500)).subscribe((messages: MessageModel[]) => {
      if (messages.length) {
        this.renderMessage(id, messages)
      }
    })

    // Save messages with QoS filtering
    messageSubject$
      .pipe(
        filter((message: MessageModel) => !ignoreQoS0Message(message.qos)),
        bufferTime(1000),
      )
      .subscribe((messages: MessageModel[]) => {
        if (messages.length) {
          this.saveMessage(id, messages)
        }
      })

    // const SYSMessageSubject$ = messageSubject$.pipe(
    //   filter((m: MessageModel) => id === this.curConnectionId && m.topic.includes('$SYS')),
    //   shareReplay(1),
    // )

    // SYSMessageSubject$.pipe(bufferTime(1000)).subscribe((messages: MessageModel[]) => {
    //   // Handle System Topic Messages Here
    //   console.log('SYS Topics Messages', messages)
    // })
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

  private throttleSendMessage = _.throttle(this.sendMessage, 500, { leading: true, trailing: false })

  /**
   * Notifies the user about the successful setup of a timed message.
   */
  private notifyTimedMessageSuccess() {
    this.$message.success(`${this.$t('connections.startTimedMessage')}${this.sendFrequency}`)
    this.$log.info(
      `Timed message for ${this.record.name}@${this.record.host} started successfully with a frequency of ${this.sendFrequency} seconds.`,
    )
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
    this.notifyMsgWithCopilot(errorMsg)
    this.stopTimedSend()
    this.$log.error(
      `Failed to publish message for ${this.record.name}@${this.record.host}. Error: ${errorMsg}. Stack trace: ${error.stack}`,
    )
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
      if (!ignoreQoS0Message(qos)) {
        const { messageService } = useServices()
        await messageService.pushMsgsToConnection({ ...publishMessage }, this.record.id)
      }
      this.renderMessage(this.curConnectionId, publishMessage, 'publish')
      this.logSuccessfulPublish(publishMessage)
    }
  }

  /**
   * Logs details of a successfully published message.
   */
  private logSuccessfulPublish(publishMessage: MessageModel) {
    const logPayload = jsonStringify(publishMessage.payload)
    let pubLog = `Message with payload ${logPayload} was successfully published to topic "${publishMessage.topic}" by ${this.record.name}`
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
      if (publishType === 'CBOR') {
        try {
          return cbor.encodeOne(JSON.parse(publishValue))
        } catch (error) {
          const err = error as Error
          let errorMessage = `${this.$t('connections.publishMsg')} ${err.toString()}`
          this.$message.error(errorMessage)
          return undefined
        }
      }
      if (publishType === 'MsgPack') {
        try {
          return pack(JSON.parse(publishValue))
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
      if (receiveType === 'CBOR') {
        try {
          return jsonStringify(cbor.decodeFirstSync(receiveValue), null, 2)
        } catch (error) {
          throw error
        }
      }
      if (receiveType === 'MsgPack') {
        try {
          return jsonStringify(unpack(receiveValue), null, 2)
        } catch (error) {
          throw error
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

  private serializeWithSchema(
    payload: string,
    rawSchema: string,
    schemaType: SchemaType,
    protobufMessageName?: string,
    format?: PayloadType,
  ): string | Buffer {
    switch (schemaType) {
      case 'protobuf':
        if (!protobufMessageName) {
          this.$message.error(`Serialization: No protobuf message name found when serializing message.`)
          return payload
        }
        return serializeProtobufToBuffer(payload as string, rawSchema, protobufMessageName, format)

      case 'avro':
        return serializeAvroToBuffer(payload as string, rawSchema, format)

      default:
        this.$message.error(`Serialization: Schema type is not defined or is not supported.`)
        return payload
    }
  }

  private deserializeWithSchema(
    payload: Buffer,
    rawSchema: string,
    schemaType: SchemaType,
    protobufMessageName?: string,
    format?: PayloadType,
  ): string | Buffer {
    switch (schemaType) {
      case 'protobuf':
        if (!protobufMessageName) {
          this.$message.error('Deserialization: No protobuf message name found when deserializing message.')
          return payload
        }

        return deserializeBufferToProtobuf(payload, rawSchema, protobufMessageName, format)

      case 'avro':
        return deserializeBufferToAvro(payload, rawSchema, format)

      default:
        this.$message.error(`Deserialization: Schema type is not defined or is not supported.`)
        return payload
    }
  }

  // Use schema to apply to payload
  private convertPayloadBySchema(
    payload: Buffer | string,
    msgType: MessageType,
    to?: PayloadType,
  ): string | Buffer | undefined {
    // Do nothing if no schema is defined or script type does not apply to this message type
    if (!this.scriptOption?.schema || !['all', msgType].includes(this.scriptOption.apply)) {
      return payload
    }

    try {
      // TODO: separate Function and Schema from `ScriptState`
      if (!this.scriptOption.schema.type || this.scriptOption.schema.type === 'javascript') {
        throw new Error('Conversion: Schema type is not defined or not supported.')
      }

      switch (msgType) {
        case 'publish': {
          return this.serializeWithSchema(
            payload as string,
            this.scriptOption.schema.script,
            this.scriptOption.schema.type as SchemaType,
            this.scriptOption.config?.name,
            to,
          )
        }
        case 'received': {
          return this.deserializeWithSchema(
            payload as Buffer,
            this.scriptOption.schema.script,
            this.scriptOption.schema.type as SchemaType,
            this.scriptOption.config?.name,
            to,
          )
        }

        default:
          return payload
      }
    } catch (error) {
      this.$message.error((error as Error).toString())
      return undefined
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
  private async handleSubSystemTopic() {
    const sysTopic: SubscriptionModel = {
      topic: '$SYS/#',
      id: getSubscriptionId(),
      qos: 0,
      createAt: time.getNowDate(),
      disabled: false,
    }
    await this.subListRef.subscribe(sysTopic, true)
    this.$router.push({ name: 'TrafficMonitor', query: { connectionId: this.record.id } })
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

  /**
   * Notifies the user with a message and provides an option to ask Copilot for assistance.
   *
   * @param {string} msgTitle - The title of the message.
   * @param {string} promptInfo - Additional information to prompt the user.
   * @param {function} callback - The callback function to be executed after asking Copilot.
   * @param {string} type - The type of the message ('error' or 'warning') defualt error.
   */
  private notifyMsgWithCopilot(
    msgTitle: string,
    promptInfo?: string,
    callback?: () => void,
    type: 'error' | 'warning' = 'error',
  ) {
    const askCopilotButton = `
      <button id="notify-copilot-button">Ask Copilot</button>
    `
    const message = this.enableCopilot ? askCopilotButton : ''
    const notify = this.$notify({
      title: msgTitle,
      dangerouslyUseHTMLString: true,
      message,
      type,
      duration: 4000,
      offset: 30,
    })

    this.$nextTick(() => {
      const button = document.getElementById('notify-copilot-button')
      if (button) {
        button.addEventListener('click', () => {
          const sendMsg = promptInfo ? `${promptInfo}\n${msgTitle}` : msgTitle
          this.askCopilot(
            `${this.$tc('common.promptError')}\n\`\`\`${sendMsg}\`\`\`\n${this.$tc('common.myConnectionInfo')}`,
          )
          notify.close()
          callback?.()
        })
      }
    })
  }

  /**
   * Asks Copilot a question and shows the Copilot component.
   * @param askMsg The question to ask Copilot.
   */
  private askCopilot(askMsg: string) {
    const copilotRef = this.toggleShowCopilot()
    copilotRef.sendMessage(askMsg)
  }

  private toggleShowCopilot(show: boolean = true) {
    const copilotRef: Copilot = this.$refs.copilot as Copilot
    copilotRef.showCopilot = show
    return copilotRef
  }

  private handleInsertedCode() {
    this.$message.success(this.$tc('common.insertCodeSuccess'))
    this.toggleShowCopilot(false)
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
    this.forceStopToReconnect()
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
        align-items: center;
        h2.title-name {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 12px;
          &.offline {
            color: var(--color-text-light);
          }
        }
        .icon-show-connections,
        .icon-collapse {
          font-size: 20px;
        }
        a.show-connections-button {
          color: var(--color-text-title);
          margin-right: 16px;
        }
        .icon-collapse {
          font-weight: bold;
        }
        .connection-message-count {
          margin-left: 12px;
          display: flex;
        }
        @include collapse-btn-transform(0deg, 180deg);
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
          margin-right: 16px;
          i {
            color: var(--color-minor-red);
          }
        }
        .connect-loading,
        .edit-btn,
        .connect-btn,
        .copilot-btn,
        .new-window-btn {
          margin-right: 16px;
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
        }
        .message-type {
          @include flex-space-between;
          .received-type-select {
            width: 88px;
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
      z-index: 3;
    }
  }
}

@include el-dropdown-menu-common;

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
