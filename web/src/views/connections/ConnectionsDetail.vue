<template>
  <div class="connections-detail">
    <div ref="connectionTopbar" class="connections-topbar right-topbar">
      <div class="connections-info">
        <div class="topbar">
          <div class="connection-head">
            <h2 :class="{ offline: !client.connected }">
              {{ titleName }}
              <a
                href="javascript:;"
                :class="['collapse-btn', showClientInfo ? 'top' : 'bottom']"
                @click="handleCollapse($route.params.id)"
              >
                <i class="el-icon-d-arrow-left"></i>
              </a>
            </h2>
          </div>
          <div class="connection-tail">
            <transition name="el-fade-in">
              <el-tooltip
                v-if="!showClientInfo && client.connected"
                placement="bottom"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="1000"
                :content="$t('connections.disconnectedBtn')"
              >
                <a class="disconnect-btn" href="javascript:;" @click="disconnect">
                  <i v-if="!disconnectLoding" class="el-icon-switch-button"></i>
                  <i v-else class="iconfont icon-disconnect"></i>
                </a>
              </el-tooltip>
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
              placement="bottom"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="1000"
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
                <el-dropdown-item command="searchByTopic">
                  <i class="iconfont icon-search"></i>{{ $t('connections.searchByTopic') }}
                </el-dropdown-item>
                <el-dropdown-item command="clearHistory">
                  <i class="iconfont icon-a-clearhistory"></i>{{ $t('connections.clearHistory') }}
                </el-dropdown-item>
                <el-dropdown-item command="disconnect" :disabled="!client.connected">
                  <i class="el-icon-switch-button"></i>{{ $t('connections.disconnect') }}
                </el-dropdown-item>
                <el-dropdown-item class="delete-item" command="deleteConnect" divided>
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
            v-model="searchTopic"
            size="small"
            :placeholder="$t('connections.searchByTopic')"
            @keyup.enter.native="searchByTopic"
            @keyup.esc.native="handleSearchClose"
          >
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
      class="connections-detail-main right-content"
      :style="{
        paddingTop: showClientInfo ? msgTop.open : msgTop.close,
        paddingBottom: `${msgBottom}px`,
        marginLeft: marginLeft,
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
          ref="messagesDisplay"
          :key="$route.params.id"
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

      <div ref="connectionFooter" class="connections-footer" :style="{ marginLeft: marginLeft }">
        <ResizeHeight v-model="inputHeight" />
        <MsgPublish
          :mqtt5PropsEnable="record.mqttVersion === '5.0'"
          ref="msgPublish"
          :editor-height="inputHeight - 75"
          :subs-visible="showSubs"
          :style="{ height: `${inputHeight}px` }"
          @foucs="scrollToBottom"
          @handleSend="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { TranslateResult } from 'vue-i18n'
import { MqttClient, IPublishPacket, IClientPublishOptions } from 'mqtt'
import _ from 'lodash'
import { Subject } from 'rxjs'
import { throttleTime } from 'rxjs/operators'

import { deleteConnection, updateConnection, updateConnectionMessage } from '@/utils/api/connection'
import time from '@/utils/time'
import matchSearch from '@/utils/matchSearch'
import topicMatch, { matchTopicMethod } from '@/utils/topicMatch'
import { createClient } from '@/utils/mqttUtils'
import { getMessageId } from '@/utils/idGenerator'

import MessageList from '@/components/MessageList.vue'
import MsgPublish from '@/components/MsgPublish.vue'
import SubscriptionsList from '@/components/SubscriptionsList.vue'
import ResizeHeight from '@/components/ResizeHeight.vue'
import MsgTypeTabs from '@/components/MsgTypeTabs.vue'
import ConnectionInfo from './ConnectionInfo.vue'
import Contextmenu from '@/components/Contextmenu.vue'

import connectionMessageService from '@/utils/api/connectionMessageService.ts'
import { hasMessagePayloadID, hasMessageHeaderID } from '@/utils/historyRecordUtils'
import historyMessageHeaderService from '@/utils/api/historyMessageHeaderService'
import historyMessagePayloadService from '@/utils/api/historyMessagePayloadService'

type MessageType = 'all' | 'received' | 'publish'
type CommandType = 'searchByTopic' | 'clearHistory' | 'disconnect' | 'deleteConnect'
type PayloadConvertType = 'base64' | 'hex'

interface Top {
  open: string
  close: string
}

@Component({
  components: {
    MessageList,
    ConnectionInfo,
    Contextmenu,
    MsgPublish,
    SubscriptionsList,
    ResizeHeight,
    MsgTypeTabs,
  },
})
export default class ConnectionsDetail extends Vue {
  @Prop({ required: true }) public record!: ConnectionModel

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs!: (payload: Subscriptions) => void
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('REMOVE_ACTIVE_CONNECTION') private removeActiveConnection!: (payload: { readonly id: string }) => void
  @Action('SHOW_CLIENT_INFO') private changeShowClientInfo!: (payload: ClientInfo) => void
  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions!: (payload: SubscriptionsVisible) => void
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: $TSFixed
  @Getter('showSubscriptions') private showSubscriptions!: boolean
  @Getter('autoScroll') private autoScroll!: boolean
  @Getter('autoScrollInterval') private autoScrollInterval!: number
  @Getter('maxReconnectTimes') private maxReconnectTimes!: number
  @Getter('currentTheme') private theme!: Theme
  @Getter('showClientInfo') private clientInfoVisibles!: {
    [id: string]: boolean
  }

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
  private largeDesktop = false
  private screenWidth = document.body.clientWidth
  private showClientInfo = true
  private connectLoading = false
  private disconnectLoding = false
  private isReconnect = false
  private searchVisible = false
  private searchLoading = false
  private receivedMsgType: PayloadType = 'Plaintext'
  private msgType: MessageType = 'all'
  private client: Partial<MqttClient> = {
    connected: false,
  }
  private messages: MessageModel[] = this.record.messages
  private searchTopic = ''
  private titleName: string = this.record.name
  private retryTimes = 0
  private inputHeight = 180
  private msgBottom = 160
  private messageListHeight: number = 284
  private messageListMarginTop: number = 19
  private messagesAddedNewItem: boolean = false
  private activeTopic = ''
  private showContextmenu: boolean = false
  private selectedMessage: MessageModel | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private selectedInfo: string = ''
  private mqttVersionDict = {
    '3.1.1': 4,
    '5.0': 5,
  }
  private scrollSubject = new Subject()

  // Connect
  public connect(): boolean | void {
    this.isReconnect = false
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.connectLoading = true
    // new client
    const { curConnectClient } = createClient(this.record)
    this.client = curConnectClient
    const { id } = this.record
    if (id && this.client.on) {
      this.client.on('connect', this.onConnect)
      this.client.on('error', this.onError)
      this.client.on('reconnect', this.onReConnect)
      this.client.on('close', this.onClose)
      this.client.on('message', this.onMessageArrived(id))
    }
  }

  public removeConnection(currentConnection?: ConnectionModel) {
    let { id, name } = this.record
    if (currentConnection) {
      id = currentConnection.id
      name = currentConnection.name
    }
    const confirmDelete: string = this.$t('common.confirmDelete', { name }) as string
    this.$confirm(confirmDelete, this.$t('common.warning') as string, {
      type: 'warning',
    })
      .then(async () => {
        const res: ConnectionModel | null = await deleteConnection(id as string)
        if (res) {
          this.$emit('delete')
          this.$message.success(this.$t('common.deleteSuccess') as string)
          this.removeActiveConnection({ id: res.id as string })
        }
      })
      .catch((error) => {
        // ignore(error)
      })
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
    const deleteMsg: MessageModel | undefined = await connectionMessageService.delete(this.$route.params.id, id)
    if (deleteMsg) {
      this.showContextmenu = false
      this.$message.success(this.$tc('common.deleteSuccess'))
      this.$emit('reload')
    } else {
      this.showContextmenu = false
      this.$message.error(this.$tc('common.deletefailed'))
    }
  }

  get bodyTop(): Top {
    return {
      open: '249px',
      close: '60px',
    }
  }

  get msgTop(): Top {
    return {
      open: '277px',
      close: '86px',
    }
  }

  get marginLeft(): string {
    const left = this.showSubs ? (this.largeDesktop ? '920px' : '680px') : this.largeDesktop ? '521px' : '401px'
    return left
  }

  get subListRef(): SubscriptionsList {
    return this.$refs.subList as SubscriptionsList
  }

  get curConnectionId(): string {
    return this.$route.params.id
  }

  @Watch('record')
  private handleRecordChanged() {
    const id: string = this.$route.params.id
    this.titleName = this.record.name
    this.getConnectionValue(id)
    this.getMessages()
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

  private getConnectionValue(id: string) {
    const currentActiveConnection:
      | {
          id?: string
          client: MqttClient
        }
      | undefined = this.activeConnection[id]
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

  private handleShowSubs() {
    this.showSubs = !this.showSubs
    this.changeShowSubscriptions({ showSubscriptions: this.showSubs })
  }

  private handleCollapse(id: string) {
    this.showClientInfo = !this.showClientInfo
    this.changeShowClientInfo({
      id,
      showClientInfo: this.showClientInfo,
    })
  }

  private handleCommand(command: CommandType) {
    switch (command) {
      case 'disconnect':
        this.disconnect()
        break
      case 'deleteConnect':
        this.removeConnection()
        break
      case 'clearHistory':
        this.handleMsgClear()
        break
      case 'searchByTopic':
        this.handleSearchOpen()
        break
      default:
        break
    }
  }

  private handleEdit(id: string): boolean | void {
    if (this.client.connected || this.connectLoading) {
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
  private handleMsgClear() {
    this.messages = []
    this.record.messages = []
    this.changeActiveConnection({
      id: this.$route.params.id,
      client: this.client,
      messages: this.messages,
    })
    updateConnection(this.record.id as string, this.record)
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
  private async searchByTopic() {
    this.searchLoading = true
    setTimeout(() => {
      this.searchLoading = false
    }, 500)
    this.getMessages()
    if (this.searchTopic !== '') {
      const $messages = _.cloneDeep(this.messages)
      const res = await matchSearch($messages, 'topic', this.searchTopic)
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
      return false
    }
    this.activeTopic = sub.topic
    const $messages = _.cloneDeep(this.messages)
    const res = await topicMatch($messages, sub.topic)
    if (res) {
      this.messages = res.slice()
    } else {
      this.messages = [].slice()
    }
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
  private handleSearchClose() {
    this.searchVisible = false
    this.getMessages()
  }
  private cancel() {
    this.connectLoading = false
    this.client.end!(true)
    this.retryTimes = 0
  }
  private disconnect(): boolean | void {
    if (!this.client.connected || this.disconnectLoding) {
      return false
    }
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
    })
  }

  // Connect callback
  private onConnect() {
    this.connectLoading = false

    this.changeActiveConnection({
      id: this.$route.params.id,
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
  }

  // Error callback
  private onError(error: string) {
    let msgTitle = this.$tc('connections.connectFailed')
    if (error) {
      msgTitle = error
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
        this.client.end!(true)
        this.retryTimes = 0
        this.connectLoading = false
      } else {
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
    this.connectLoading = false
    this.isReconnect = false
  }

  private onMessageArrived(id: string) {
    return (topic: string, payload: Buffer, packet: IPublishPacket) => {
      const { qos, retain, properties } = packet
      const convertPayload = this.convertPayloadByType(payload, this.receivedMsgType, 'receive') as string
      const receivedMessage: MessageModel = {
        id: getMessageId(),
        out: false,
        createAt: time.getNowDate(),
        topic,
        payload: convertPayload,
        qos,
        retain,
        properties,
      }
      const connectionId = this.$route.params.id
      if (id === connectionId) {
        this.record.messages.push({ ...receivedMessage })
        this.messagesAddedNewItem = true
        updateConnectionMessage(connectionId, { ...receivedMessage })
        const isActiveTopicMessages = matchTopicMethod(this.activeTopic, topic)
        if (this.msgType !== 'publish' && !this.activeTopic) {
          this.messages.push(receivedMessage)
        } else if (this.activeTopic && isActiveTopicMessages && this.msgType !== 'publish') {
          this.messages.push(receivedMessage)
        }
      } else {
        updateConnectionMessage(id, { ...receivedMessage })
        this.unreadMessageIncrement({ id })
      }
      this.scrollToBottomThrottle()
    }
  }

  private async insertHistory(payload: HistoryMessagePayloadModel, header: HistoryMessageHeaderModel) {
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

  private async sendMessage(
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
      return false
    }

    const { id, topic, qos, payload, retain, properties } = message

    if (!topic && !properties?.topicAlias) {
      this.$message.warning(this.$tc('connections.topicRequired'))
      return false
    }

    if (topic && (topic.includes('+') || topic.includes('#'))) {
      this.$message.warning(this.$tc('connections.topicCannotContain'))
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

    const $payload = this.convertPayloadByType(payload, type, 'publish')
    this.client.publish!(
      topic,
      $payload,
      { qos, retain, properties: props as IClientPublishOptions['properties'] },
      (error: Error) => {
        if (error) {
          const errorMsg = error.toString()
          this.$message.error(errorMsg)
          return false
        }
        const properties = this.record.mqttVersion === '5.0' ? props : undefined
        const publishMessage: MessageModel = {
          id,
          out: true,
          createAt: time.getNowDate(),
          topic,
          payload,
          qos,
          retain,
          properties,
        }
        const isActiveTopicMessages = matchTopicMethod(this.activeTopic, topic)
        this.record.messages.push({ ...publishMessage })
        updateConnectionMessage(this.record.id as string, { ...publishMessage })
        if (this.msgType !== 'received' && !this.activeTopic) {
          this.messages.push(publishMessage)
        } else if (this.activeTopic && isActiveTopicMessages && this.msgType !== 'received') {
          this.messages.push(publishMessage)
          this.messagesAddedNewItem = true
        }
        this.scrollToBottom()
      },
    )

    // insert message into local storage
    const { isNewPayload } = await this.insertHistory({ payload, payloadType: type }, { qos, topic, retain })

    afterSendCallback && afterSendCallback(isNewPayload)
  }

  // Scroll to page bottom
  private scrollToBottomThrottle = () => {
    this.scrollSubject.next()
  }

  private scrollToBottom() {
    if (this.autoScroll === false) {
      return
    }
    const timer = setTimeout(() => {
      const messagesDisplay = this.$refs.messagesDisplay as MessageList
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

  private setShowClientInfo(show: boolean) {
    setTimeout(() => {
      this.showClientInfo = show
      this.changeShowClientInfo({
        id: this.record.id as string,
        showClientInfo: this.showClientInfo,
      })
    }, 500)
  }

  private convertPayloadByType(value: Buffer | string, type: PayloadType, way: 'publish' | 'receive'): Buffer | string {
    const validJSONType = (jsonValue: string, warnMessage: TranslateResult) => {
      try {
        return JSON.parse(jsonValue)
      } catch (error) {
        this.$message.warning(`${warnMessage} ${error.toString()}`)
        return false
      }
    }
    const genPublishPayload = (publishType: PayloadType, publishValue: string) => {
      if (publishType === 'Base64' || publishType === 'Hex') {
        const $type = publishType.toLowerCase() as PayloadConvertType
        return Buffer.from(publishValue, $type)
      }
      if (publishType === 'JSON') {
        validJSONType(publishValue, this.$t('connections.publishMsg'))
      }
      return publishValue
    }
    const genReceivePayload = (receiveType: PayloadType, receiveValue: Buffer) => {
      if (receiveType === 'Base64' || receiveType === 'Hex') {
        const $type = receiveType.toLowerCase() as 'base64' | 'hex'
        return receiveValue.toString($type)
      }
      if (receiveType === 'JSON') {
        const jsonValue = validJSONType(receiveValue.toString(), this.$t('connections.receivedMsg'))
        if (jsonValue) {
          return JSON.stringify(jsonValue, null, 2)
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

  private created() {
    const { id } = this.$route.params
    this.getConnectionValue(id)
    this.autoScroll &&
      this.scrollSubject
        .asObservable()
        .pipe(throttleTime(this.autoScrollInterval * 1000))
        .subscribe(() => {
          this.scrollToBottom()
        })
  }

  private mounted() {
    this.setMessageListHeight()
    this.largeDesktop = document.body.clientWidth >= 1920 ? true : false
    window.onresize = () => {
      return (() => {
        this.screenWidth = document.body.clientWidth
        this.largeDesktop = this.screenWidth >= 1920 ? true : false
        this.setMessageListHeight()
      })()
    }
  }

  private setClientsMessageListener() {
    // Register connected clients message event listeners
    Object.keys(this.activeConnection).forEach((connectionID: string) => {
      const $connection: {
        id?: string
        client: MqttClient
      } = this.activeConnection[connectionID]
      const client: MqttClient = $connection.client
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

  private removeClinetsMessageListener() {
    // Remove connected clients message event listeners
    Object.keys(this.activeConnection).forEach((connectionID: string) => {
      const currentActiveConnection: {
        id?: string
        client: MqttClient
      } = this.activeConnection[connectionID]
      const client: MqttClient = currentActiveConnection.client
      if (client.removeAllListeners) {
        client.removeAllListeners('message')
      }
    })
  }

  private beforeDestroy() {
    // ipcRenderer.removeAllListeners('searchByTopic')
    this.removeClinetsMessageListener()
    this.scrollSubject.unsubscribe()
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
      }
      .connection-tail {
        i {
          font-size: 20px;
          color: var(--color-text-title);
          font-weight: 400;
        }
        .disconnect-btn {
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
      padding: 13px 16px 13px 16px;
      height: auto;
      background-color: var(--color-bg-normal);
      &.topbar {
        border-bottom: 0px;
        min-height: 0px;
      }
      .icon-search,
      .el-icon-loading {
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

  .connections-detail-main {
    height: 100%;
    transition: all 0.5s;
    .connections-body {
      .filter-bar {
        padding: 6px 16px;
        background: var(--color-bg-normal);
        border-bottom: 1px solid var(--color-border-default);
        position: fixed;
        left: 401px;
        right: 0;
        z-index: 1;
        transition: all 0.4s;
        .subs-title {
          line-height: 32px;
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
            margin-left: 276px;
            .el-input__inner {
              padding: 4px 10px;
            }
          }
          .icon-tip {
            position: absolute;
            left: 300px;
            font-size: 16px;
            color: var(--color-text-tips);
          }
        }
        @media (min-width: 1920px) {
          left: 521px;
          .message-type {
            .received-type-select {
              margin-left: 420px;
            }
            .icon-tip {
              left: 420px;
            }
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
.el-popper li.delete-item {
  color: var(--color-minor-red);
  &:hover {
    color: var(--color-minor-red);
    background: var(--color-light-red);
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
