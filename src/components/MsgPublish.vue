<template>
  <div class="msg-publish message" v-click-outside="handleClickOutSide">
    <div class="publish-top">
      <transition name="el-zoom-in-bottom">
        <div v-if="showMetaCard">
          <el-card class="meta-card">
            <el-form ref="form" label-width="185px" label-position="left" :model="MQTT5PropsForm" :rules="rules">
              <el-row class="form-row" :gutter="20">
                <el-col :span="24">
                  <KeyValueEditor
                    :title="$t('connections.userProperties')"
                    v-model="MQTT5PropsForm.userProperties"
                    maxHeight="140px"
                  />
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.contentType')" prop="contentType">
                    <el-input size="mini" v-model="MQTT5PropsForm.contentType"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.payloadFormatIndicator')" prop="payloadFormatIndicator">
                    <el-switch
                      size="mini"
                      v-model="MQTT5PropsForm.payloadFormatIndicator"
                      active-color="#13ce66"
                      inactive-color="#A2A9B0"
                    ></el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item
                    :label="`${$t('connections.messageExpiryInterval')}(${$t('common.unitS')})`"
                    prop="messageExpiryInterval"
                  >
                    <el-input
                      v-model.number="MQTT5PropsForm.messageExpiryInterval"
                      size="mini"
                      :min="0"
                      type="number"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.topicAlias')" prop="topicAlias">
                    <el-input v-model.number="MQTT5PropsForm.topicAlias" size="mini" :min="1" type="number" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.responseTopic')" prop="responseTopic">
                    <el-input size="mini" v-model="MQTT5PropsForm.responseTopic" type="text" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.correlationData')" prop="correlationData">
                    <el-input size="mini" v-model="MQTT5PropsForm.correlationData" type="text" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.subscriptionIdentifier')" prop="subscriptionIdentifier">
                    <el-input size="mini" type="number" v-model.number="MQTT5PropsForm.subscriptionIdentifier">
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div class="dropdown-btn">
              <el-button size="mini" class="dropdown-btn-reset" type="text" @click="showMetaCard = false">{{
                $t('common.cancel')
              }}</el-button>
              <el-button
                size="mini"
                class="dropdown-btn-submit"
                type="text"
                :loading="saveMetaLoading"
                @click="saveMeta"
                >{{ $t('common.save') }}</el-button
              >
            </div>
          </el-card>
        </div>
      </transition>
    </div>
    <div class="publish-header">
      <div class="publish-metadata">
        <el-select class="payload-select" size="mini" :value="draft.payloadType" @change="handleTypeChange">
          <el-option-group :label="$t('connections.publishPayloadEncodedBy')">
            <el-option v-for="(type, index) in payloadOptions" :key="index" :label="type" :value="type"> </el-option>
          </el-option-group>
        </el-select>
        <el-select class="qos-select" size="mini" v-model="draft.qos">
          <el-option v-for="qos in [0, 1, 2]" :key="qos" :label="`QoS ${qos}`" :value="qos">
            <span style="float: left">{{ qos }}</span>
            <span style="float: right; color: #8492a6; margin-left: 12px">{{ $t(`connections.qos${qos}`) }}</span>
          </el-option>
        </el-select>
        <el-checkbox class="retain-checkbox" v-model="draft.retain" label="Retain" border size="mini"></el-checkbox>
        <el-tooltip
          placement="top"
          :disabled="mqtt5PropsEnable"
          :open-delay="500"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          :content="$t('connections.metaTips')"
        >
          <el-badge :is-dot="hasMqtt5Prop && mqtt5PropsEnable" class="item">
            <el-button
              type="outline"
              plain
              :disabled="!mqtt5PropsEnable"
              :class="['dropdown-btn', showMetaCard ? 'dropdown-btn-active' : '']"
              @click="changeVisable"
              label="Meta"
              size="mini"
            >
              Meta
            </el-button>
          </el-badge>
        </el-tooltip>
        <el-dropdown class="actions-dropdown" placement="top" trigger="click" @command="handleActionCommand">
          <el-button class="dropdown-btn actions-btn" type="outline" plain size="mini" icon="el-icon-caret-top">
          </el-button>
          <el-dropdown-menu class="connection-oper-item" slot="dropdown">
            <el-dropdown-item command="clearRetainedMessage" :disabled="!clientConnected">
              <i class="iconfont icon-delete"></i>{{ $t('connections.clearRetainedMessage') }}
            </el-dropdown-item>
            <el-dropdown-item command="timedMessage" :disabled="!clientConnected || sendTimeId !== null">
              <i class="iconfont icon-timed-message"></i>{{ $t('connections.timedMessage') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <div class="history-button-group">
          <el-tooltip
            :content="$t('connections.previousPayload')"
            placement="top"
            :open-delay="500"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          >
            <el-button
              :disabled="historyIndex === 0 || payloadsHistory.length === 0"
              size="mini"
              icon="el-icon-arrow-left"
              class="history-btn history-btn-left"
              @click="decrease"
            ></el-button>
          </el-tooltip>
          <el-tooltip
            :content="$t('connections.payloadHistory')"
            placement="top"
            :open-delay="500"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          >
            <el-button size="mini" class="history-btn history-btn-center" @click="back">
              <span>{{ historyIndex + 1 }}/{{ payloadsHistory.length }}</span>
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="$t('connections.nextPayload')"
            placement="top"
            :open-delay="500"
            :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          >
            <el-button
              :disabled="historyIndex === payloadsHistory.length - 1 || historyIndex === -1"
              size="mini"
              icon="el-icon-arrow-right"
              class="history-btn history-btn-right"
              @click="increase"
            ></el-button>
          </el-tooltip>
        </div>
      </div>
      <div :class="['topic-input-container', topicRequired ? 'required' : '']">
        <el-input
          class="publish-topic-input"
          placeholder="Topic"
          v-model="draft.topic"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
        >
        </el-input>
        <el-select
          class="header-select"
          popper-class="header-select--popper"
          v-model="headerValue"
          placeholder=""
          size="mini"
          @change="handleHeaderChange"
        >
          <el-option
            class="header-option"
            v-for="item in headersHistory"
            :key="item.id"
            :label="item.label"
            :value="item"
          >
            <div class="header-option-content">
              <span class="header-option-topic" :title="item.topic">{{ item.topic }}</span>
              <span class="header-option-meta">QoS:{{ item.qos }}</span>
              <span class="header-option-meta">retain:{{ item.retain ? '1' : '0' }}</span>
              <i
                class="el-icon-close header-option-delete"
                :title="$t('common.delete')"
                @click.stop.prevent="handleDeleteHistoryHeader(item)"
              ></i>
            </div>
          </el-option>
        </el-select>
      </div>
    </div>
    <div class="editor-container">
      <div
        class="publish-footer"
        :style="{
          height: `${editorHeight}px`,
        }"
      >
        <Editor
          ref="payloadEditor"
          id="payload"
          :lang="payloadLang"
          v-model="draft.payload"
          :useShadows="true"
          @enter-event="send"
          @format="formatJsonValue"
        />
      </div>
      <a href="javascript:;" class="send-btn" @click="send">
        <i class="iconfont icon-send"></i>
      </a>
    </div>
    <div v-if="disabled" class="disabled-mask" @click.stop></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { Getter } from 'vuex-class'
import ClickOutside from 'vue-click-outside'
import Editor from '@/components/Editor.vue'
import KeyValueEditor from '@/components/KeyValueEditor.vue'
import convertPayload from '@/utils/convertPayload'
import { getMessageId } from '@/utils/idGenerator'
import _ from 'lodash'
import validFormatJson from '@/utils/validFormatJson'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import { emptyToNull } from '@/utils/handleString'
import { getDefaultPublishDraft, PublishDraft } from '@/utils/publishDraft'

@Component({
  components: {
    Editor,
    KeyValueEditor,
  },
  directives: {
    ClickOutside,
  },
})
export default class MsgPublish extends Vue {
  @Prop({ required: true }) public editorHeight!: number
  @Prop({ default: false }) public disabled!: boolean
  @Prop({ default: false }) public mqtt5PropsEnable!: boolean
  @Prop({ default: false }) public clientConnected!: boolean
  @Prop({ default: null }) public sendTimeId!: number | null

  @Getter('currentTheme') private currentTheme!: Theme

  private MQTT5PropsForm: PushPropertiesModel = {}

  private MQTT5PropsSend: PushPropertiesModel = {}

  private showMetaCard = false

  private saveMetaLoading = false

  private topicRequired = false

  private isValidProp(value: any) {
    return value !== null && value !== undefined && value !== false
  }

  private getHasMqtt5PropState() {
    return Object.values(this.MQTT5PropsForm).some(this.isValidProp)
  }

  private async saveMeta() {
    this.saveMetaLoading = true
    await this.updatePushProp()
    this.saveMetaLoading = false
    this.showMetaCard = false
    this.hasMqtt5Prop = this.getHasMqtt5PropState()
  }

  private changeVisable() {
    this.showMetaCard = !this.showMetaCard
  }

  get rules() {
    return {}
  }

  private hasMqtt5Prop = false

  private headersHistory: HistoryMessageHeaderModel[] | [] = []
  private payloadsHistory: HistoryMessagePayloadModel[] | [] = []
  private historyIndex = -1
  private isDisposed = false
  private draft: PublishDraft = getDefaultPublishDraft()
  private draftConnectionId: string | undefined = undefined
  private savedDraftSnapshot = ''
  private payloadConversionId = 0
  private propertiesRequestId = 0
  private headerValue: HistoryMessageHeaderModel = {
    qos: this.draft.qos,
    retain: this.draft.retain,
    topic: this.draft.topic,
  }

  get payloadLang() {
    return ['CBOR', 'JSON', 'MsgPack'].includes(this.draft.payloadType) ? 'json' : 'plaintext'
  }

  private persistDraft = _.debounce(() => this.saveDraft(), 300, { maxWait: 1000 })

  @Watch('draft', { deep: true })
  private queueDraftSave() {
    this.persistDraft()
  }

  private saveDraft() {
    this.persistDraft.cancel()
    const snapshot = JSON.stringify(this.draft)
    // An unchanged window must not overwrite a newer draft saved by another window.
    if (this.draftConnectionId && snapshot !== this.savedDraftSnapshot) {
      const { connectionService } = useServices()
      connectionService.updatePublishDraft(this.draftConnectionId, this.draft)
      this.savedDraftSnapshot = snapshot
    }
  }

  private payloadOptions: PayloadType[] = ['Plaintext', 'JSON', 'Base64', 'Hex', 'CBOR', 'MsgPack']

  @Watch('editorHeight')
  private handleHeightChanged() {
    this.handleLayout()
  }
  private async handleTypeChange(payloadType: PayloadType) {
    const draft = this.draft
    const { payload, payloadType: oldType } = draft
    const conversionId = ++this.payloadConversionId
    if (payloadType === oldType) return
    const isCurrent = () =>
      !this.isDisposed && conversionId === this.payloadConversionId && draft === this.draft && draft.payload === payload
    try {
      const converted = payload === '' ? '' : await convertPayload(payload, payloadType, oldType)
      // A late conversion must not replace a different connection, history selection or newer edit.
      if (isCurrent()) {
        this.draft = { ...draft, payload: converted, payloadType }
      }
    } catch (error) {
      if (isCurrent()) {
        this.$message.error((error as Error).toString())
      }
    }
  }
  @Watch('disabled', { immediate: true, deep: true })
  private handleDisabledChange(val: boolean) {
    if (val) {
      ipcRenderer.removeAllListeners('sendPayload')
    }
  }
  private selectHistory(index: number) {
    const item = this.payloadsHistory[index]
    if (item) {
      this.historyIndex = index
      this.draft = { ...this.draft, payload: item.payload, payloadType: item.payloadType as PayloadType }
    }
  }

  /**
   * Notice:
   *
   * When we switch between the `creation page` and `connection page`, the Monaco editor is not initialized or destroyed.
   * Instead, we use `v-show` to hide the `MsgPublish` component.
   * Therefore, we need to manually create and destroy the editor by listening to the route.
   *
   * Relevant PRs:
   * - https://github.com/emqx/MQTTX/pull/518
   * - https://github.com/emqx/MQTTX/pull/446
   */
  @Watch('$route.params.id', { immediate: true, deep: true })
  private handleIdChanged(to: string, from: string) {
    this.saveDraft()
    this.draftConnectionId = to && to !== '0' ? to : undefined
    const { connectionService } = useServices()
    this.draft = this.draftConnectionId
      ? connectionService.getPublishDraft(this.draftConnectionId)
      : getDefaultPublishDraft()
    this.savedDraftSnapshot = JSON.stringify(this.draft)
    this.historyIndex = -1
    this.headerValue = { qos: this.draft.qos, retain: this.draft.retain, topic: this.draft.topic }
    this.topicRequired = false
    this.showMetaCard = false
    const editorRef = this.$refs.payloadEditor as Editor | undefined
    if (editorRef && to && from === '0' && to !== '0') {
      // Initialize the editor when the route jumps from the creation page
      editorRef.initEditor()
    } else if (editorRef && from && from !== '0' && to === '0') {
      // Destroy the editor when the route jumps to the creation page
      editorRef.destroyEditor()
    }
    this.loadProperties()
  }

  @Watch('mqtt5PropsEnable')
  private handleMqtt5Enable() {
    this.loadProperties()
  }

  private handleHeaderChange(val: HistoryMessageHeaderModel) {
    if (val) {
      const { retain, topic, qos } = val
      Object.assign(this.draft, { retain, topic, qos })
    }
  }

  private async handleDeleteHistoryHeader(item: HistoryMessageHeaderModel) {
    if (!item.id) {
      return
    }
    const { historyMessageHeaderService } = useServices()
    await historyMessageHeaderService.delete(item.id)
    if (this.headerValue && this.headerValue.id === item.id) {
      this.headerValue = {
        qos: this.draft.qos,
        retain: this.draft.retain,
        topic: this.draft.topic,
      }
    }
    await this.loadHistoryData()
  }

  /**
   * Manually create and destroy the editor for the parent component.
   * Note: This function destroys the editor instance.
   */
  public editorDestory() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.destroyEditor()
  }

  public editorInit() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.initEditor()
  }

  private async updatePushProp() {
    this.MQTT5PropsForm = emptyToNull(this.MQTT5PropsForm)
    this.MQTT5PropsSend = _.cloneDeep(this.MQTT5PropsForm)
    const propRecords = Object.entries(this.MQTT5PropsForm).filter(([_, v]) => v !== null && v !== undefined && v !== 0)
    const props = Object.fromEntries(propRecords)
    const { connectionService } = useServices()
    return await connectionService.addPushProp(props, this.$route.params.id)
  }

  private async send() {
    const message: MessageModel = {
      id: getMessageId(),
      createAt: time.getNowDate(),
      out: true,
      qos: this.draft.qos,
      retain: this.draft.retain,
      topic: this.draft.topic,
      payload: this.draft.payload,
      properties: this.mqtt5PropsEnable ? _.cloneDeep(this.MQTT5PropsSend) : undefined,
    }
    if (!this.clientConnected) {
      this.$notify({
        title: this.$tc('connections.notConnect'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }
    if (!message.topic && !message.properties?.topicAlias) {
      this.topicRequired = true
      this.$notify({
        title: this.$tc('connections.topicRequired'),
        message: '',
        type: 'warning',
        duration: 3000,
        offset: 30,
      })
      return
    }
    if (this.draft.topic.includes('+') || this.draft.topic.includes('#')) {
      this.$notify({
        title: this.$tc('connections.topicCannotContain'),
        message: '',
        type: 'warning',
        duration: 3000,
        offset: 30,
      })
      return
    }
    this.$emit('handleSend', message, this.draft.payloadType, this.loadHistoryData)
  }

  private handleInputFocus() {
    if (this.topicRequired) {
      this.topicRequired = false
    }
    ipcRenderer.on('sendPayload', () => {
      this.send()
    })
    this.$emit('focus')
  }

  private handleInputBlur() {
    if (this.topicRequired) {
      this.topicRequired = false
    }
    ipcRenderer.removeAllListeners('sendPayload')
  }

  private handleLayout() {
    const editorRef = this.$refs.payloadEditor as Editor
    editorRef.editorLayout()
  }

  private async loadHistoryData(isNewPayload?: boolean) {
    const { historyMessageHeaderService, historyMessagePayloadService } = useServices()
    const [headersHistory, payloadsHistory] = await Promise.all([
      historyMessageHeaderService.getAll(),
      historyMessagePayloadService.getAll(),
    ])
    if (this.isDisposed) return
    this.headersHistory = headersHistory ?? []
    this.payloadsHistory = payloadsHistory ?? []
    if (isNewPayload) {
      this.historyIndex = -1
    } else {
      this.historyIndex = Math.min(this.historyIndex, this.payloadsHistory.length - 1)
    }
  }

  private async loadProperties() {
    const connectionId = this.draftConnectionId
    const requestId = ++this.propertiesRequestId
    this.MQTT5PropsForm = {}
    this.MQTT5PropsSend = {}
    this.hasMqtt5Prop = false
    if (this.mqtt5PropsEnable && connectionId) {
      const { connectionService } = useServices()
      const pushProps = await connectionService.getPushProp(connectionId)
      if (!this.isDisposed && requestId === this.propertiesRequestId && pushProps) {
        this.MQTT5PropsForm = pushProps
        this.MQTT5PropsSend = _.cloneDeep(pushProps)
        this.hasMqtt5Prop = this.getHasMqtt5PropState()
      }
    }
  }

  private formatJsonValue() {
    try {
      let jsonValue: string | undefined = validFormatJson(this.draft.payload.toString())
      if (jsonValue) {
        this.draft.payload = jsonValue
      }
    } catch (error) {
      this.$message.error((error as Error).toString())
    }
  }

  private decrease() {
    this.selectHistory(this.historyIndex === -1 ? this.payloadsHistory.length - 1 : Math.max(this.historyIndex - 1, 0))
  }

  private back() {
    this.selectHistory(this.payloadsHistory.length - 1)
  }

  private increase() {
    this.selectHistory(Math.min(this.historyIndex + 1, this.payloadsHistory.length - 1))
  }

  private handleClickOutSide() {
    this.showMetaCard = false
  }

  private handleActionCommand(command: string) {
    if (command === 'clearRetainedMessage') {
      this.onClearRetainedMsgPublish()
    } else if (command === 'timedMessage') {
      this.$emit('handleSendTimedMessage')
    }
  }

  private onClearRetainedMsgPublish() {
    const draft = this.draft
    this.$confirm(
      `${this.$tc('connections.clearRetainedMessageConfirm')} "${this.draft.topic}"`,
      this.$tc('common.warning'),
      {
        type: 'warning',
      },
    )
      .then(() => {
        if (this.isDisposed || draft !== this.draft) return
        this.draft.payload = ''
        this.draft.retain = true
        this.send()
      })
      .catch(() => {
        // The user canceled the action
      })
  }

  private created() {
    this.loadHistoryData()
  }

  private mounted() {
    window.addEventListener('beforeunload', this.saveDraft)
    ipcRenderer.on('insertCodeToEditor', (event: IpcRendererEvent, code: string) => {
      if (code) {
        this.draft.payload = code
        this.$emit('onInsertedCode')
      }
    })
  }

  private beforeDestroy() {
    this.saveDraft()
    this.isDisposed = true
    window.removeEventListener('beforeunload', this.saveDraft)
    ipcRenderer.removeAllListeners('sendPayload')
    ipcRenderer.removeAllListeners('insertCodeToEditor')
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.msg-publish {
  position: relative;
  background: var(--color-bg-normal);
  transition: 0.3s height;
  border-top: 1px solid var(--color-border-default);
  box-shadow: #00000010 0px -1px 4px;
  z-index: 10;
  .publish-top {
    position: absolute;
    transform: translate(0, -100%);
    width: 100%;
    .el-card.meta-card {
      padding: 10px;
      padding-bottom: 0px;
      margin: 4px;
      user-select: none;
      .dropdown-btn {
        margin-top: 10px;
        text-align: right;
        .dropdown-btn-reset {
          color: var(--color-text-default);
          &:hover {
            color: var(--color-main-green);
          }
        }
        .dropdown-btn-submit {
          margin-right: 8px;
        }
      }
      .el-card__body {
        padding: 4px 4px 6px 4px;
        .form-row {
          display: flex;
          flex-wrap: wrap;
          position: relative;
          .el-form-item {
            margin-bottom: 0;
            .el-form-item__label {
              padding-bottom: 0;
            }
          }
        }
      }
    }
  }
  .topic-input-container {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    &.required {
      .el-input.publish-topic-input {
        .el-input__inner {
          border-right: none !important;
        }
      }
      .el-select {
        .el-input__inner {
          border-left: none !important;
        }
      }
      .el-input__inner {
        border: 1px solid var(--color-minor-red) !important;
      }
    }
  }
  .publish-topic-input.el-input {
    flex: 1 1 0;
    min-width: 0;
    width: auto;
    display: block;
    @include topic-input__inner;
    .el-input__inner {
      padding: 0px 16px;
    }
  }
  .header-select.el-select {
    flex: 0 0 20px;
    width: 20px;
    display: block;
    .el-input {
      @include topic-input__inner;
    }
  }
  .editor-container {
    padding: 0 6px;
    display: flex;
    justify-content: space-around;
    .publish-footer {
      width: 100%;
      flex: 1 1 auto;
    }
    .send-btn {
      position: fixed;
      right: 16px;
      bottom: 10px;
      background: var(--color-bg-btn-gradient);
      border-radius: 50%;
      text-align: center;
      box-shadow: #00000011 0px 1px 3px, #0000002e 0px 1px 2px;
      width: 28px;
      height: 28px;
      line-height: 29px;
      .icon-send {
        font-size: 16px;
        color: var(--color-text-active);
      }
      &:active {
        box-shadow: none;
      }
    }
  }
  .publish-metadata {
    background: var(--color-bg-normal);
    padding: 0 13px;
    margin-top: 6px;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .el-input__inner {
      padding: 4px 10px;
    }
    .publish-label {
      color: var(--color-text-default);
      margin-right: 0px;
    }
    .payload-select {
      width: 88px;
      margin-right: 4px;
    }
    .qos-select {
      width: 76px;
      margin-right: 4px;
    }
    .retain-checkbox {
      margin-right: 4px;
      .el-checkbox__input {
        line-height: 1px;
      }
      .el-checkbox__label {
        padding-left: 8px;
      }
    }
    .dropdown-btn {
      margin-right: 4px;
      border-radius: 4px;
      &.el-button.is-disabled {
        background-color: transparent;
        border: 1px solid var(--color-border-default);
        color: var(--color-text-historybtn_disabled);
      }
      &:not(.is-disabled) {
        border-color: var(--color-border-default);
        color: var(--color-text-default);
      }
      &.dropdown-btn-active {
        color: var(--color-main-green);
        border-color: var(--color-main-green);
      }
    }
    .el-badge.item {
      .el-badge__content.is-dot {
        top: -1px;
        right: 2px;
        transform: none;
      }
    }
    .el-checkbox__inner {
      border-radius: 100%;
    }
    .actions-dropdown {
      display: inline;
      margin-right: 4px;
    }
    .history-button-group {
      margin-left: auto;
      display: flex;
      gap: 3px;

      .history-btn {
        height: 28px;
        padding: 0;
        border: none;
        border-radius: 8px;
        margin: 0;
        background-color: transparent;
        min-width: unset;

        &.history-btn-left {
          width: 18px;
          font-size: 13px;
        }

        &.history-btn-center {
          min-width: 24px;
          font-size: 13px;
          color: var(--color-text-default);

          &:hover {
            background-color: var(--color-bg-hover);
          }
        }

        &.history-btn-right {
          width: 18px;
          font-size: 13px;
        }

        &:hover:not(.is-disabled) {
          background-color: var(--color-bg-hover);
        }

        &.is-disabled {
          background-color: transparent;
          color: var(--color-text-historybtn_disabled);
        }
      }
    }
  }
  .disabled-mask {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--color-bg-primary);
    opacity: 0.5;
    cursor: not-allowed;
    z-index: 9;
    top: 0;
  }
}
.el-select-dropdown.el-popper.header-select--popper {
  max-width: 360px;
  .el-select-dropdown__empty {
    width: 80px;
  }
  .header-option-content {
    display: flex;
    align-items: center;
  }
  .header-option-topic {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    unicode-bidi: plaintext;
    text-align: left;
  }
  .header-option-meta {
    flex-shrink: 0;
    margin-left: 8px;
    color: #8492a6;
    font-size: 12px;
  }
  .header-option-delete {
    flex-shrink: 0;
    margin-left: 8px;
    margin-right: -10px;
    color: #8492a6;
    font-size: 14px;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    &:hover {
      color: var(--color-minor-red);
    }
  }
  .el-select-dropdown__item:hover .header-option-delete {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
