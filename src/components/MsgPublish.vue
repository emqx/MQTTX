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
        <el-select class="payload-select" size="mini" v-model="payloadType">
          <el-option-group :label="$t('connections.publishPayloadEncodedBy')">
            <el-option v-for="(type, index) in payloadOptions" :key="index" :label="type" :value="type"> </el-option>
          </el-option-group>
        </el-select>
        <el-select class="qos-select" size="mini" v-model="msgRecord.qos">
          <el-option v-for="qos in [0, 1, 2]" :key="qos" :label="`QoS ${qos}`" :value="qos">
            <span style="float: left">{{ qos }}</span>
            <span style="float: right; color: #8492a6; margin-left: 12px">{{ $t(`connections.qos${qos}`) }}</span>
          </el-option>
        </el-select>
        <el-checkbox class="retain-checkbox" v-model="msgRecord.retain" label="Retain" border size="mini"></el-checkbox>
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
              <i class="iconfont icon-a-timedmessage"></i>{{ $t('connections.timedMessage') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <div :class="['topic-input-contianer', topicRequired ? 'required' : '']">
        <el-input
          class="publish-topic-input"
          placeholder="Topic"
          v-model="msgRecord.topic"
          @focus="handleInputFoucs"
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
            <span style="float: left; width: 160px; overflow: hidden; text-overflow: ellipsis" :title="item.topic">{{
              item.topic
            }}</span>
            <span style="color: #8492a6; font-size: 12px; margin-left: 4px">QoS:{{ item.qos }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px; margin-left: 4px">
              retain:{{ item.retain ? '1' : '0' }}
            </span>
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
          v-model="msgRecord.payload"
          :useShadows="true"
          @enter-event="send"
          @format="formatJsonValue"
        />
      </div>
      <div class="publish-right-bar">
        <div class="history-icon">
          <el-button
            :disabled="historyIndex === 0 || historyIndex === -1"
            circle
            size="mini"
            icon="el-icon-back"
            @click="decrease"
          ></el-button>
          <el-button
            circle
            :disabled="historyIndex === payloadsHistory.length - 1 || historyIndex === -1"
            size="mini"
            icon="el-icon-minus"
            @click="back"
          ></el-button>
          <el-button
            :disabled="historyIndex === payloadsHistory.length - 1 || historyIndex === -1"
            circle
            size="mini"
            icon="el-icon-right"
            @click="increase"
          ></el-button>
        </div>
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
import { ipcRenderer } from 'electron'
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
  @Prop({ required: true }) public subsVisible!: boolean
  @Prop({ default: false }) public disabled!: boolean
  @Prop({ default: false }) public mqtt5PropsEnable!: boolean
  @Prop({ default: false }) public clientConnected!: boolean
  @Prop({ default: null }) public sendTimeId!: number | null

  @Getter('currentTheme') private currentTheme!: Theme

  private MQTT5PropsForm: PushPropertiesModel = {}

  private MQTT5PropsSend: PushPropertiesModel = {}

  private showMetaCard: boolean = false

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

  private hasMqtt5Prop: boolean = false

  private headersHistory: HistoryMessageHeaderModel[] | [] = []
  private payloadsHistory: HistoryMessagePayloadModel[] | [] = []
  private historyIndex: number = -1
  private defaultMsgRecord: MessageModel = {
    createAt: time.getNowDate(),
    out: true,
    qos: 0,
    retain: false,
    topic: '',
    payload: JSON.stringify({ msg: 'hello' }, null, 2),
  }
  public msgRecord: MessageModel = _.cloneDeep(this.defaultMsgRecord)
  private headerValue: HistoryMessageHeaderModel = {
    qos: this.msgRecord.qos,
    retain: this.msgRecord.retain,
    topic: this.msgRecord.topic,
  }
  private payloadLang = 'json'
  private payloadType: PayloadType = 'JSON'
  private payloadOptions: PayloadType[] = ['Plaintext', 'JSON', 'Base64', 'Hex']

  @Watch('editorHeight')
  private handleHeightChanged() {
    this.handleLayout()
  }
  @Watch('subsVisible')
  private handleSubsChanged(val: boolean) {
    setTimeout(() => {
      this.handleLayout()
    }, 500)
  }
  @Watch('payloadType')
  private handleTypeChange(val: PayloadType, oldVal: PayloadType) {
    const { payload } = this.msgRecord
    if (['CBOR', 'JSON'].includes(val)) {
      this.payloadLang = 'json'
    } else {
      this.payloadLang = 'plaintext'
    }
    if (payload === '') {
      return
    }
    convertPayload(payload.toString(), val, oldVal)
      .then((res) => {
        this.msgRecord.payload = res
      })
      .catch((error: Error) => {
        const errorMsg = error.toString()
        this.$message.error(errorMsg)
        this.payloadType = oldVal
      })
  }
  @Watch('disabled', { immediate: true, deep: true })
  private handleDisabledChange(val: boolean) {
    if (val) {
      ipcRenderer.removeAllListeners('sendPayload')
    }
  }
  @Watch('historyIndex', { immediate: true, deep: true })
  private handleHistoryIndexChange(val: number, lastval: number) {
    if (lastval !== val && val >= 0 && val < this.payloadsHistory.length) {
      this.msgRecord = Object.assign(this.msgRecord, this.payloadsHistory[val])
      this.payloadType = this.payloadsHistory[val].payloadType as PayloadType
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
  private async handleIdChanged(to: string, from: string) {
    const editorRef = this.$refs.payloadEditor as Editor
    if (to && from === '0' && to !== '0') {
      // Initialize the editor when the route jumps from the creation page
      editorRef.initEditor()
    } else if (from && from !== '0' && to === '0') {
      // Destroy the editor when the route jumps to the creation page
      editorRef.destroyEditor()
    }
    this.loadProperties()
  }

  @Watch('mqtt5PropsEnable')
  private async handleMqtt5Enable(val: boolean) {
    if (val) {
      this.loadProperties()
    }
  }

  private handleHeaderChange(val: HistoryMessageHeaderModel) {
    if (val) {
      const { retain, topic, qos } = val
      Object.assign(this.msgRecord, { retain, topic, qos })
    }
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
    this.msgRecord.id = getMessageId()
    this.msgRecord.createAt = time.getNowDate()
    this.mqtt5PropsEnable && (this.msgRecord.properties = this.MQTT5PropsSend)
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
    if (!this.msgRecord.topic && !this.msgRecord?.properties?.topicAlias) {
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
    if (this.msgRecord.topic.includes('+') || this.msgRecord.topic.includes('#')) {
      this.$notify({
        title: this.$tc('connections.topicCannotContain'),
        message: '',
        type: 'warning',
        duration: 3000,
        offset: 30,
      })
      return
    }
    this.$emit('handleSend', this.msgRecord, this.payloadType, this.loadHistoryData)
  }

  private handleInputFoucs() {
    if (this.topicRequired) {
      this.topicRequired = false
    }
    ipcRenderer.on('sendPayload', () => {
      this.send()
    })
    this.$emit('foucs')
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

  private async loadHistoryData(isNewPayload?: boolean, isLoadData?: boolean) {
    const { historyMessageHeaderService, historyMessagePayloadService } = useServices()
    const headersHistory = (await historyMessageHeaderService.getAll()) ?? []
    const payloadsHistory = (await historyMessagePayloadService.getAll()) ?? []
    const historyMsg = payloadsHistory[payloadsHistory.length - 1]
    if (historyMsg && isLoadData) {
      this.payloadType = historyMsg.payloadType as PayloadType
    }
    this.headersHistory = headersHistory
    this.payloadsHistory = payloadsHistory
    if (isNewPayload) {
      this.historyIndex = this.payloadsHistory.length - 1
    }
  }

  private async loadData() {
    await this.loadHistoryData(false, true)
    this.historyIndex = this.payloadsHistory.length - 1
    Object.assign(
      this.msgRecord,
      this.defaultMsgRecord,
      this.headersHistory[this.headersHistory.length - 1],
      this.payloadsHistory[this.payloadsHistory.length - 1],
    )
    const headersHistoryIndex = this.payloadsHistory[this.historyIndex]
    if (headersHistoryIndex) {
      this.payloadType = headersHistoryIndex.payloadType as PayloadType
    }
    this.loadProperties()
  }

  private async loadProperties() {
    this.MQTT5PropsForm = {}
    if (this.mqtt5PropsEnable) {
      const { connectionService } = useServices()
      const pushProps = await connectionService.getPushProp(this.$route.params.id)
      if (pushProps) {
        this.MQTT5PropsForm = pushProps
        this.MQTT5PropsSend = _.cloneDeep(this.MQTT5PropsForm)
        this.hasMqtt5Prop = this.getHasMqtt5PropState()
      }
    }
  }

  private formatJsonValue() {
    try {
      let jsonValue: string | undefined = validFormatJson(this.msgRecord.payload.toString())
      if (jsonValue) {
        this.msgRecord.payload = jsonValue
      }
    } catch (error) {
      this.$message.error((error as Error).toString())
    }
  }

  private decrease() {
    this.historyIndex = this.historyIndex - 1 >= 0 ? this.historyIndex - 1 : 0
  }

  private back() {
    this.historyIndex = this.payloadsHistory.length - 1
  }

  private increase() {
    this.historyIndex =
      this.historyIndex + 1 <= this.payloadsHistory.length - 1 ? this.historyIndex + 1 : this.payloadsHistory.length - 1
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
    this.$confirm(
      `${this.$tc('connections.clearRetainedMessageConfirm')} "${this.msgRecord.topic}"`,
      this.$tc('common.warning'),
      {
        type: 'warning',
      },
    )
      .then(() => {
        this.msgRecord.payload = ''
        this.msgRecord.retain = true
        this.send()
      })
      .catch(() => {
        // The user canceled the action
      })
  }

  private created() {
    this.loadData()
  }

  private mounted() {
    ipcRenderer.on('insertCodeToEditor', (event: Event, code: string) => {
      if (code) {
        this.msgRecord.payload = code
        this.$emit('onInsertedCode')
      }
    })
  }

  private beforeDestroy() {
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
  .topic-input-contianer {
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
    width: calc(100% - 20px);
    vertical-align: top;
    display: inline-block;
    @include topic-input__inner;
    .el-input__inner {
      padding: 0px 16px;
    }
  }
  .header-select.el-select {
    vertical-align: top;
    width: 20px;
    display: inline-block;
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
    .publish-right-bar {
      width: 85px;
      position: absolute;
      right: 0;
      top: 70px;
      .history-icon {
        width: 70px;
        height: 10px;
        .el-button + .el-button {
          margin-left: 5px;
        }
        .el-button--mini.is-circle {
          padding: 3px;
          background: var(--color-bg-historybtn);
          border: 1px solid var(--color-bg-historybtn);
          color: var(--color-text-historybtn);
        }
        .el-button.is-disabled,
        .el-button.is-disabled:hover,
        .el-button.is-disabled:focus {
          color: var(--color-text-historybtn_disabled);
        }
      }
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
    .el-input__inner {
      padding: 4px 10px;
    }
    .publish-label {
      color: var(--color-text-default);
      margin-right: 0px;
    }
    .payload-select {
      width: 88px;
      margin-right: 8px;
    }
    .qos-select {
      width: 76px;
    }
    .retain-checkbox {
      margin-left: 8px;
      .el-checkbox__input {
        line-height: 1px;
      }
      .el-checkbox__label {
        padding-left: 8px;
      }
    }
    .dropdown-btn {
      margin-left: 6px;
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
    .el-checkbox__inner {
      border-radius: 100%;
    }
    .actions-dropdown {
      display: inline;
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
  max-width: 300px;
  .el-select-dropdown__empty {
    width: 80px;
  }
}
</style>
