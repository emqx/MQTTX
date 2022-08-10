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
                    <el-checkbox
                      style="width: 100%"
                      size="mini"
                      v-model="MQTT5PropsForm.payloadFormatIndicator"
                      border
                      >{{ MQTT5PropsForm.payloadFormatIndicator ? 'true' : 'false' }}</el-checkbox
                    >
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
                    <el-input
                      placeholder="Response Topic"
                      size="mini"
                      v-model="MQTT5PropsForm.responseTopic"
                      type="text"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="$t('connections.correlationData')" prop="correlationData">
                    <el-input
                      placeholder="Correlation Data"
                      size="mini"
                      v-model="MQTT5PropsForm.correlationData"
                      type="text"
                    />
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
            <div class="meta-btn">
              <el-button size="mini" class="meta-btn-reset" type="text" @click="showMetaCard = false">{{
                $t('common.cancel')
              }}</el-button>
              <el-button size="mini" class="meta-btn-submit" type="text" :loading="saveMetaLoading" @click="saveMeta">{{
                $t('common.save')
              }}</el-button>
            </div>
          </el-card>
        </div>
      </transition>
    </div>
    <div class="publish-header">
      <div class="publish-metadata">
        <span class="publish-label">Payload: </span>
        <el-select class="payload-select" size="mini" v-model="payloadType">
          <el-option v-for="(type, index) in payloadOptions" :key="index" :value="type"> </el-option>
        </el-select>
        <span class="publish-label">QoS: </span>
        <el-select class="qos-select" size="mini" v-model="msgRecord.qos">
          <el-option v-for="qos in [0, 1, 2]" :key="qos" :label="qos" :value="qos">
            <span style="float: left">{{ qos }}</span>
            <span style="float: right; color: #8492a6; margin-left: 12px">{{ $t(`connections.qos${qos}`) }}</span>
          </el-option>
        </el-select>
        <el-checkbox class="retain-block" v-model="msgRecord.retain" label="Retain" border size="mini"></el-checkbox>
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
              :class="['meta-block', showMetaCard ? 'meta-block-active' : '']"
              @click="changeVisable"
              label="Meta"
              size="mini"
            >
              Meta
            </el-button>
          </el-badge>
        </el-tooltip>
      </div>
      <el-input class="publish-topic-input" placeholder="Topic" v-model="msgRecord.topic" @focus="handleInputFoucs">
      </el-input>
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
      <a href="javascript:;" class="send-btn" @click="send">
        <i class="iconfont icon-send"></i>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import ClickOutside from 'vue-click-outside'
import Editor from '@/components/Editor.vue'
import KeyValueEditor from '@/components/KeyValueEditor.vue'
import convertPayload from '@/utils/convertPayload'
import { getMessageId } from '@/utils/idGenerator'
import _ from 'lodash'
import validFormatJson from '@/utils/validFormatJson'
import time from '@/utils/time'
import { emptyToNull } from '@/utils/handleString'
import { getConnectionPushProp, updateConnectionPushProp } from '@/utils/api/connection'

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
  @Prop({ default: false }) public mqtt5PropsEnable!: boolean

  @Getter('currentTheme') private currentTheme!: Theme

  private MQTT5PropsForm: PushPropertiesModel = {}

  private MQTT5PropsSend: PushPropertiesModel = {}

  private showMetaCard: boolean = false

  private saveMetaLoading = false

  private getHasMqtt5PropState() {
    return (
      Object.entries(this.MQTT5PropsForm).filter(([_, v]) => v !== null && v !== undefined && v !== false).length > 0
    )
  }

  private async saveMeta() {
    this.hasMqtt5Prop = this.getHasMqtt5PropState()
    this.saveMetaLoading = true
    await this.updatePushProp()
    this.saveMetaLoading = false
    this.showMetaCard = false
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
  private msgRecord: MessageModel = _.cloneDeep(this.defaultMsgRecord)
  private headerValue: HistoryMessageHeaderModel = {
    qos: this.msgRecord.qos,
    retain: this.msgRecord.retain,
    topic: this.msgRecord.topic,
  }

  private payloadLang = 'json'
  private payloadType: PayloadType = 'JSON'
  private payloadOptions: PayloadType[] = ['Plaintext', 'Base64', 'JSON', 'Hex']

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
    if (val === 'JSON') {
      this.payloadLang = 'json'
    } else {
      this.payloadLang = 'plaintext'
    }
    if (payload === '') {
      return
    }
    convertPayload(payload, val, oldVal)
      .then((res) => {
        this.msgRecord.payload = res
      })
      .catch((error: Error) => {
        const errorMsg = error.toString()
        this.$message.error(errorMsg)
        this.payloadType = oldVal
      })
  }
  @Watch('historyIndex', { immediate: true, deep: true })
  private handleHistoryIndexChange(val: number, lastval: number) {
    if (lastval !== val && val >= 0 && val < this.payloadsHistory.length) {
      this.msgRecord = Object.assign(this.msgRecord, this.payloadsHistory[val])
      this.payloadType = this.payloadsHistory[val].payloadType
    }
  }
  /**
   * Notice:
   * when we jump order by`creation page` <-> `connection page`,
   * the monaco will not init or destroy, because we use the v-show to hidden Msgpublish componment.
   * So we need to operate editor creation and destroy manually by listening on route.
   * relative PR: https://github.com/emqx/MQTTX/pull/518 https://github.com/emqx/MQTTX/pull/446
   */
  @Watch('$route.params.id', { immediate: true, deep: true })
  private async handleIdChanged(to: string, from: string) {
    const editorRef = this.$refs.payloadEditor as Editor
    if (to && from === '0' && to !== '0') {
      // Init the editor when rout jump from creation page
      editorRef.initEditor()
    } else if (from && from !== '0' && to === '0') {
      // destroy the editor when rout jump to creation page
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

  // Notice: add editor creation and destroy manually export for it's father componment.
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
    return await updateConnectionPushProp(this.$route.params.id, props)
  }

  private send() {
    this.msgRecord.id = getMessageId()
    this.msgRecord.createAt = time.getNowDate()
    this.mqtt5PropsEnable && (this.msgRecord.properties = this.MQTT5PropsSend)
    this.$emit('handleSend', this.msgRecord, this.payloadType)
  }

  private async loadHistoryData(isNewPayload?: boolean, isLoadData?: boolean) {
    // const { historyMessageHeaderService, historyMessagePayloadService } = useServices()
    // const headersHistory = (await historyMessageHeaderService.getAll()) ?? []
    // const payloadsHistory = (await historyMessagePayloadService.getAll()) ?? []
    // const historyMsg = payloadsHistory[payloadsHistory.length - 1]
    // if (historyMsg && isLoadData) {
    //   this.payloadType = historyMsg.payloadType
    // }
    // this.headersHistory = headersHistory
    // this.payloadsHistory = payloadsHistory
    // if (isNewPayload) {
    //   this.historyIndex = this.payloadsHistory.length - 1
    // }
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
      this.payloadType = headersHistoryIndex.payloadType
    }
    this.loadProperties()
  }

  private async loadProperties() {
    this.MQTT5PropsForm = {}
    if (this.mqtt5PropsEnable) {
      const pushProps = await getConnectionPushProp(this.$route.params.id)
      if (pushProps) {
        this.MQTT5PropsForm = pushProps
        this.MQTT5PropsSend = _.cloneDeep(this.MQTT5PropsForm)
        this.hasMqtt5Prop = this.getHasMqtt5PropState()
      }
    }
  }

  private handleInputFoucs() {
    this.$emit('foucs')
  }

  private handleLayout() {
    const editorRef: EditorRef = this.$refs.payloadEditor as EditorRef
    editorRef.editorLayout()
  }

  private formatJsonValue() {
    const jsonValue = validFormatJson(this.msgRecord.payload)
    if (jsonValue) {
      this.msgRecord.payload = jsonValue
    }
  }

  private created() {
    this.loadData()
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
  z-index: 10;
  .publish-top {
    position: absolute;
    transform: translate(0, -100%);
    width: 100%;
    z-index: 11;
    .el-card.meta-card {
      padding: 10px;
      padding-bottom: 0px;
      margin: 4px;
      user-select: none;
      .meta-btn {
        margin-top: 10px;
        text-align: right;
        .meta-btn-reset {
          color: var(--color-text-default);
          &:hover {
            color: var(--color-main-green);
          }
        }
        .meta-btn-submit {
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
  .publish-topic-input.el-input {
    width: 100%;
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
      &.is-focus {
        @include topic-input__inner;
      }
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
      background: var(--color-main-green);
      border-radius: 50%;
      text-align: center;
      box-shadow: 0px 4px 6px 0px var(--color-shadow-sendbtn);
      width: 26px;
      height: 26px;
      line-height: 26px;
      .icon-send {
        font-size: 16px;
        color: var(--color-text-active);
      }
    }
  }
  .publish-metadata {
    background: var(--color-bg-normal);
    padding: 0 16px;
    margin-top: 6px;
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
      width: 46px;
    }
    .retain-block {
      margin-left: 8px;
    }
    .meta-block {
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
      &.meta-block-active {
        color: var(--color-main-green);
        border-color: var(--color-main-green);
      }
    }
    .el-checkbox__inner {
      border-radius: 100%;
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
