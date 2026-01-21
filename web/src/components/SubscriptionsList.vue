<template>
  <div>
    <left-panel>
      <el-card
        v-show="subsVisible"
        shadow="never"
        class="subscriptions-list-view"
        :style="{
          top,
        }"
      >
        <div slot="header" class="clearfix">
          <el-button class="btn new-subs-btn" icon="el-icon-plus" plain type="outline" size="mini" @click="openDialog">
            {{ $t('connections.newSubscription') }}
          </el-button>
        </div>
        <div
          v-for="(sub, index) in subsList"
          :key="index"
          :class="['topics-item', { active: index === topicActiveIndex, disabled: sub.disabled }]"
          :style="{
            background: `${sub.color}10`,
          }"
          @click="handleClickTopic(sub, index)"
          @contextmenu.prevent="handleContextMenu(sub, $event)"
        >
          <div
            :style="{
              background: `${sub.color}`,
            }"
            class="topics-color-line"
          ></div>
          <el-popover
            placement="top"
            trigger="hover"
            popper-class="topic-tooltip"
            :content="getPopoverContent(copySuccess, sub)"
          >
            <a
              slot="reference"
              v-clipboard:copy="sub.topic"
              v-clipboard:success="onCopySuccess"
              href="javascript:;"
              class="topic"
              :style="{
                color: sub.color,
              }"
              @click.stop="stopClick"
            >
              {{ sub.alias || sub.topic }}
            </a>
          </el-popover>
          <span class="qos">QoS {{ sub.qos }}</span>
          <a href="javascript:;" class="close" @click.stop="unsubscribe(sub)">
            <i :class="unsubLoading ? 'el-icon-loading' : 'el-icon-close'"></i>
          </a>
        </div>
      </el-card>
    </left-panel>
    <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
      <a href="javascript:;" class="context-menu__item" @click="handleTopicEdit">
        <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
      </a>
      <a
        v-if="!getTopicDisabled()"
        href="javascript:;"
        class="context-menu__item danger"
        @click="setTopicDisabled(true)"
      >
        <i class="el-icon-remove-outline"></i>{{ $t('common.disable') }}
      </a>
      <a v-else href="javascript:;" class="context-menu__item" @click="setTopicDisabled(false)">
        <i class="el-icon-circle-check"></i>{{ $t('common.enable') }}
      </a>
    </contextmenu>

    <!-- New subscription dialog -->
    <my-dialog
      :title="isEdit ? $t('connections.editSubscription') : $t('connections.newSubscription')"
      :visible.sync="showDialog"
      :confirmLoading="subLoading"
      :top="record.mqttVersion === '5.0' ? '60px' : '15vh'"
      width="530px"
      class="topic-dialog"
      @confirm="saveSubs"
      @close="resetSubs"
      @keyupEnter="saveSubs"
    >
      <el-row :gutter="20">
        <el-form ref="form" :model="subRecord" :rules="rules">
          <el-col :span="24">
            <el-form-item label="Topic" prop="topic">
              <el-tooltip
                v-if="!isEdit && multiTopics"
                class="subinfo-tooltip"
                placement="top-start"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :content="$t('connections.topicTips')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
              <el-input
                v-model="topicInput"
                type="textarea"
                placeholder="testtopic/#"
                size="small"
                @keydown.enter.native.prevent
                @keyup.enter.native.prevent
              >
              </el-input>
              <div v-if="topicHasWhitespace" class="topic-whitespace-hint">
                <span class="topic-whitespace-label">{{ $t('connections.topicWhitespaceHint') }}</span>
                <span class="topic-whitespace-marker">
                  <span
                    v-for="(part, index) in topicWhitespaceParts"
                    :key="index"
                    :class="{ 'space-marker': part.isSpace }"
                    >{{ part.text }}</span
                  >
                </span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="QoS" prop="qos">
              <span class="qos-tip">{{ $t(`connections.qos${subRecord.qos}`) }}</span>
              <el-select class="qos-select" v-model="subRecord.qos" size="small">
                <el-option v-for="qos in qosOption" :key="qos" :label="qos" :value="qos">
                  <span style="float: left">{{ qos }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ $t(`connections.qos${qos}`) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('connections.color')">
              <el-color-picker v-model="topicColor" size="mini" color-format="hex" :predefine="predefineColors">
              </el-color-picker>
              <el-input v-model="topicColor" size="small" placeholder="#34c388">
                <i slot="suffix" title="Refresh" class="el-icon-refresh" @click="setColor"> </i>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('connections.alias')">
              <el-tooltip
                v-if="!isEdit && multiTopics"
                class="subinfo-tooltip"
                placement="top-start"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :content="$t('connections.aliasTip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
              <el-input
                v-model.trim="subRecord.alias"
                type="textarea"
                size="small"
                @keydown.enter.native.prevent
                @keyup.enter.native.prevent
              >
              </el-input>
            </el-form-item>
          </el-col>
          <!-- MQTT 5.0 -->
          <template v-if="record.mqttVersion === '5.0'">
            <div class="topic-mqtt5">
              <el-col :span="24">
                <el-form-item
                  label-width="180px"
                  :label="$t('connections.subscriptionIdentifier')"
                  prop="subscriptionIdentifier"
                >
                  <el-input size="small" type="number" v-model.number="subRecord.subscriptionIdentifier"> </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label-width="180px" :label="$t('connections.noLocal')" prop="nl">
                  <el-radio-group v-model="subRecord.nl">
                    <el-radio :label="true">true</el-radio>
                    <el-radio :label="false">false</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label-width="180px" :label="$t('connections.retainAsPublished')" prop="rap">
                  <el-radio-group v-model="subRecord.rap">
                    <el-radio :label="true">true</el-radio>
                    <el-radio :label="false">false</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label-width="180px" :label="$t('connections.retainHandling')" prop="rh">
                  <el-select v-model="subRecord.rh" size="small">
                    <el-option
                      v-for="retainOps in retainHandling"
                      :key="retainOps"
                      :label="retainOps"
                      :value="retainOps"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </div>
          </template>
        </el-form>
      </el-row>
    </my-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { MqttClient } from 'mqtt'
import { Getter, Action } from 'vuex-class'
import VueI18n from 'vue-i18n'
import _ from 'lodash'
import { defineColors, getRandomColor } from '@/utils/colors'
import LeftPanel from '@/components/LeftPanel.vue'
import MyDialog from '@/components/MyDialog.vue'
import Contextmenu from '@/components/Contextmenu.vue'
import { updateConnection } from '@/utils/api/connection'
import time from '@/utils/time'
import { getSubscriptionId } from '@/utils/idGenerator'
import getErrorReason from '@/utils/mqttErrorReason'

@Component({
  components: {
    LeftPanel,
    MyDialog,
    Contextmenu,
  },
})
export default class SubscriptionsList extends Vue {
  @Prop({ required: true }) public subsVisible!: boolean
  @Prop({ required: true }) public connectionId!: string
  @Prop({ required: true }) public record!: ConnectionModel
  @Prop({ type: String, default: '60px' }) public top!: string

  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs!: (payload: Subscriptions) => void

  @Getter('currentTheme') private theme!: Theme
  @Getter('multiTopics') private multiTopics!: boolean
  @Getter('activeConnection') private activeConnection!: ActiveConnection
  @Getter('topicWhitespaceDetection') private topicWhitespaceDetection!: boolean

  private topicColor = ''
  private client: Partial<MqttClient> = {
    connected: false,
  }
  private showDialog: boolean = false
  private subRecord: SubscriptionModel = {
    id: getSubscriptionId(),
    topic: 'testtopic/#',
    qos: 0,
    disabled: false,
    createAt: time.getNowDate(),
    alias: '',
    nl: undefined,
    rap: undefined,
    rh: undefined,
    subscriptionIdentifier: undefined,
  }
  private retainHandling: RetainHandlingList = [0, 1, 2]
  private qosOption: QoSList = [0, 1, 2]
  private subsList: SubscriptionModel[] = []
  private copySuccess = false
  private topicActiveIndex: number | null = null
  private subLoading = false
  private unsubLoading = false
  private showContextmenu = false
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private isEdit = false
  private selectedTopic: SubscriptionModel | null = null

  get rules() {
    return {
      topic: { required: true, message: this.$t('common.inputRequired') },
      qos: { required: true, message: this.$t('common.selectRequired') },
    }
  }

  get topicInput(): string {
    return this.subRecord.topic
  }

  set topicInput(value: string) {
    this.subRecord.topic = this.topicWhitespaceDetection ? value : value.trim()
  }

  get topicHasWhitespace(): boolean {
    return this.topicWhitespaceDetection && /\s/.test(this.subRecord.topic)
  }

  get topicWhitespaceParts(): Array<{ text: string; isSpace: boolean }> {
    return Array.from(this.subRecord.topic).map((char) => {
      const isSpace = /\s/.test(char)
      return {
        text: isSpace ? '␣' : char,
        isSpace,
      }
    })
  }

  get subForm(): VueForm {
    return this.$refs.form as VueForm
  }

  get predefineColors(): string[] {
    return defineColors
  }

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
    this.topicActiveIndex = null
    if (val.id) {
      this.getCurrentConnection(val.id)
      this.subsList = val.subscriptions
    }
  }

  private setColor() {
    this.topicColor = getRandomColor()
  }

  private setNewSubscribeId() {
    this.subRecord.id = getSubscriptionId()
  }

  private getBorderColor(): string {
    let $index: number = this.subsList.length
    const lastSubs: SubscriptionModel = this.subsList[$index - 1]

    if ($index === 0) {
      return this.predefineColors[0]
    }
    const subIndex = this.predefineColors.findIndex((color) => color === lastSubs.color)
    if (this.predefineColors[subIndex + 1]) {
      $index = subIndex + 1
    } else {
      $index = 0
    }
    return this.predefineColors[$index]
  }

  private openDialog() {
    this.showDialog = true
    this.isEdit = false
    this.setColor()
    this.setNewSubscribeId()
  }

  private saveSubs(): void | boolean {
    this.getCurrentConnection(this.connectionId)
    this.subRecord.topic = this.subRecord.topic.replace(/[\r\n]+/g, '')
    this.subRecord.alias = this.subRecord.alias?.replace(/[\r\n]+/g, '') || ''
    if (!this.client || !this.client.connected) {
      this.$message.warning(this.$tc('connections.notConnect'))
      return false
    }
    this.subForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      this.subLoading = true
      this.subRecord.color = this.topicColor || this.getBorderColor()
      if (!this.isEdit) {
        await this.subscribe(this.subRecord)
      } else {
        this.updateSub()
      }
    })
  }

  public async resubscribe() {
    this.getCurrentConnection(this.connectionId)
    for (let sub of this.subsList) {
      this.subRecord = { ...sub }
      if (this.subRecord.disabled === false) {
        await this.subscribe(this.subRecord)
      }
    }
  }

  private saveTopicToSubList(topic: string, qos: QoS, index?: number, aliasArr?: string[]): void {
    const existTopicIndex: number = this.subsList.findIndex((item: SubscriptionModel) => item.topic === topic)
    if (existTopicIndex !== -1) {
      this.subsList[existTopicIndex].qos = qos
    } else {
      let { topic: unuseTopic, color, alias, id, ...others } = this.subRecord
      if (index !== undefined && aliasArr !== undefined) {
        alias = aliasArr ? aliasArr[index] : alias
        if (index > 0) {
          color = getRandomColor()
          id = getSubscriptionId()
        }
      }
      this.subsList.push({
        topic,
        id,
        color,
        alias,
        ...others,
      })
    }
  }

  private handleSubError(topic: string, qos: number) {
    const isAclSubFailed = (qos: number) => {
      return [128, 135].includes(qos)
    }

    const aclSubFailed = isAclSubFailed(qos)
    const errorReasonMsg = aclSubFailed ? `. ${this.$t('connections.aclSubFailed')}` : ''
    const errorReason = getErrorReason(this.record.mqttVersion, qos)
    this.$message.error(`${this.$t('connections.subFailed', [topic, errorReason, qos]) + errorReasonMsg}`)
  }

  public async subscribe(
    { topic, alias, qos, nl, rap, rh, subscriptionIdentifier, disabled }: SubscriptionModel,
    isAuto?: boolean,
    enable?: boolean,
  ) {
    if (isAuto) {
      this.subRecord.nl = nl
      this.subRecord.rap = rap
      this.subRecord.rh = rh
      this.subRecord.topic = topic
      this.subRecord.qos = qos
      this.subRecord.subscriptionIdentifier = subscriptionIdentifier
      this.subRecord.disabled = disabled
      this.subRecord.color = getRandomColor()
    }
    let isFinished = false

    if (this.client.subscribe) {
      const topicsArr = this.multiTopics ? [...new Set(topic.split(','))].filter(Boolean) : topic
      const aliasArr = this.multiTopics ? alias?.split(',') : alias
      let properties: { subscriptionIdentifier: number } | undefined = undefined
      if (this.record.mqttVersion === '5.0' && subscriptionIdentifier) {
        properties = {
          subscriptionIdentifier,
        }
      }
      this.client.subscribe(topicsArr, { qos, nl, rap, rh, properties }, async (error, granted) => {
        this.subLoading = false
        if (error) {
          this.$message.error(error)
          isFinished = true
          return false
        }
        const successSubscriptions: string[] = []
        granted.forEach((grant) => {
          if ([0, 1, 2].includes(grant.qos)) {
            successSubscriptions.push(grant.topic)
          } else {
            setTimeout(() => {
              this.handleSubError(grant.topic, grant.qos)
            }, 0)
          }
        })
        if (!successSubscriptions.length) {
          isFinished = true
          return false
        }
        if (enable) {
          this.subsList = this.setSubsDisable(topic, disabled)
        } else {
          if (!Array.isArray(topicsArr)) {
            this.saveTopicToSubList(topic, qos)
          } else {
            topicsArr.forEach((topic, index) => {
              if (successSubscriptions.includes(topic)) {
                this.saveTopicToSubList(topic, qos, index, aliasArr as string[])
              }
            })
          }
        }
        this.record.subscriptions = this.subsList
        if (this.record.id) {
          updateConnection(this.record.id, this.record)
          this.changeSubs({ id: this.connectionId, subscriptions: this.subsList })
          this.showDialog = false
        }
        isFinished = true
      })
    }
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // TODO: maybe we should replace mqtt.js to mqtt-async.js
    await new Promise(async (resolve) => {
      // long pool query base on sleep
      while (!isFinished) {
        await sleep(100)
      }
      resolve(isFinished)
    })
  }

  private async updateSub() {
    if (this.selectedTopic) {
      const res = await this.unsubscribe(this.selectedTopic)
      if (res) {
        this.subscribe(this.subRecord)
      }
    }
  }

  private unsubscribe(row: SubscriptionModel, disable?: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        this.$notify({
          title: this.$tc('connections.notConnect'),
          message: '',
          type: 'error',
          duration: 3000,
          offset: 30,
        })
        resolve(false)
        return false
      }
      this.unsubLoading = true
      const { topic, qos, disabled } = row
      if (this.client.unsubscribe) {
        this.client.unsubscribe(topic, { qos }, async (error) => {
          this.unsubLoading = false
          if (error) {
            this.$message.error(error)
            resolve(false)
            return false
          }
          if (this.record.id) {
            let payload: {
              id: string
              subscriptions: SubscriptionModel[]
            } = {
              id: this.record.id,
              subscriptions: [],
            }
            if (disable) {
              payload.subscriptions = this.setSubsDisable(topic, disabled)
            } else {
              payload.subscriptions = this.subsList.filter((sub: SubscriptionModel) => sub.topic !== topic)
            }
            this.record.subscriptions = payload.subscriptions
            updateConnection(this.record.id, this.record)
            this.changeSubs(payload)
            this.$emit('deleteTopic')
            this.subsList = payload.subscriptions
            resolve(true)
            return true
          }
        })
      }
    })
  }

  private resetSubs() {
    this.subForm.clearValidate()
    this.subForm.resetFields()
    this.subRecord.topic = 'testtopic/#'
    this.subRecord.qos = 0
    this.subRecord.alias = ''
    this.subRecord.nl = undefined
    this.subRecord.rap = undefined
    this.subRecord.rh = undefined
    this.subRecord.subscriptionIdentifier = undefined
    this.subRecord.disabled = false
    this.selectedTopic = null
  }

  private setSubsDisable(topic: string, disabled: boolean) {
    return this.subsList.map((sub: SubscriptionModel) => {
      if (sub.topic === topic) {
        sub.disabled = disabled
      }
      return sub
    })
  }

  private getCurrentConnection(id: string) {
    const $activeConnection = this.activeConnection[id]
    if ($activeConnection) {
      this.client = $activeConnection.client
    }
  }

  private onCopySuccess() {
    this.copySuccess = true
    setTimeout(() => {
      this.copySuccess = false
    }, 1500)
  }

  private stopClick(): boolean {
    return true
  }

  private handleClickTopic(item: SubscriptionModel, index: number) {
    if (item.disabled) {
      return
    }
    if (this.topicActiveIndex === null || this.topicActiveIndex !== index) {
      this.topicActiveIndex = index
      this.$emit('onClickTopic', item, false)
    } else if (this.topicActiveIndex === index) {
      this.topicActiveIndex = null
      this.$emit('onClickTopic', item, true)
    }
  }

  private handleContextMenu(row: SubscriptionModel, event: MouseEvent) {
    if (!this.showContextmenu) {
      const { clientX, clientY } = event
      this.contextmenuConfig.top = clientY
      this.contextmenuConfig.left = clientX
      this.showContextmenu = true
      this.selectedTopic = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleTopicEdit() {
    this.isEdit = true
    this.showContextmenu = false
    this.showDialog = true
    this.setColor()
    this.setNewSubscribeId()
    if (this.selectedTopic) {
      this.subRecord = _.cloneDeep(this.selectedTopic)
      this.topicColor = this.selectedTopic.color || getRandomColor()
    }
  }

  private getPopoverContent(copied: boolean, sub: SubscriptionModel): string {
    if (copied) {
      return this.$tc('connections.topicCopied')
    }
    let topicString = sub.topic
    if (sub.subscriptionIdentifier) {
      topicString = `
        Topic: ${topicString},
        ${this.$tc('connections.subscriptionIdentifier')}: ${sub.subscriptionIdentifier}
      `
    }
    return topicString
  }

  private getTopicDisabled() {
    return this.selectedTopic?.disabled
  }

  private async setTopicDisabled(disable: boolean) {
    this.showContextmenu = false
    if (!this.client || !this.client.connected) {
      this.$notify({
        title: this.$tc('connections.notConnect'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }
    if (!this.selectedTopic) {
      return
    }
    this.selectedTopic.disabled = disable
    if (disable) {
      await this.unsubscribe(this.selectedTopic, true)
    } else {
      await this.subscribe(this.selectedTopic, false, true)
    }
  }

  private created() {
    this.getCurrentConnection(this.connectionId)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';

.subscriptions-list-view {
  &.el-card {
    border-top: 0px;
    border-left: 0px;
  }
  .el-card__header {
    border-bottom: none;
    text-align: center;
    position: relative;
    padding: 12px 16px;
    text-align: center;
    .hide-btn {
      font-size: 20px;
      position: absolute;
      top: 15px;
      right: 0px;
    }
    .new-subs-btn {
      width: 100%;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--color-main-green);
      color: var(--color-main-green);
      background: transparent;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        background: var(--color-light-green);
      }
      &:active {
        transform: scale(0.98);
      }
    }
  }
  .el-card__body {
    padding: 6px 16px;
    height: 100%;
    overflow: auto;
    .topics-item {
      cursor: pointer;
      color: var(--color-text-title);
      padding: 0px 8px;
      height: 46px;
      line-height: 46px;
      margin-bottom: 8px;
      position: relative;
      top: 0px;
      clear: both;
      border-radius: 8px;
      -moz-user-select: none;
      -khtml-user-select: none;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      animation: subItem 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
      &:hover {
        transform: translateX(2px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
      }
      &.active {
        background: var(--color-bg-dark) !important;
        box-shadow: none;
        .topic,
        .qos {
          color: var(--color-text-active) !important;
        }
        .topics-color-line {
          background: var(--color-text-active) !important;
        }
      }
      &.disabled {
        background: transparent !important;
        border: 1px solid var(--color-border-default);
        box-shadow: none;
        cursor: not-allowed;
        &:hover {
          transform: none;
          box-shadow: none;
        }
        .topic,
        .qos {
          color: var(--color-text-light) !important;
        }
        .topics-color-line {
          background: var(--color-border-default) !important;
        }
      }
      .topics-color-line {
        margin-right: 3px;
        display: inline-block;
        width: 4px;
        height: 24px;
        vertical-align: top;
        border-radius: 8px;
        position: relative;
        top: 50%;
        transform: translateY(-50%);
        transition: height 0.2s ease;
      }
      &:hover .topics-color-line {
        height: 32px;
      }
      &.active .topics-color-line,
      &.active:hover .topics-color-line {
        height: 24px;
      }
      .topic {
        max-width: 120px;
        margin-left: 5px;
        display: inline-block;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .qos {
        float: right;
        color: var(--color-text-light);
      }
      .close {
        display: none;
        border-radius: 50%;
        background: var(--color-minor-red);
        position: absolute;
        right: -5px;
        top: -5px;
        width: 18px;
        height: 18px;
        text-align: center;
        line-height: 18px;
        transition: transform 0.15s ease;
        &:hover {
          transform: scale(1.1);
        }
        .el-icon-close,
        .el-icon-loading {
          color: var(--color-text-active);
          font-size: 10px;
        }
      }
      &:hover {
        .close {
          display: inline;
        }
      }
    }
  }
  @keyframes subItem {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
.topic-dialog {
  .el-dialog__body {
    padding: 20px 20px 0 20px;
    .qos-tip {
      position: absolute;
      top: 40px;
      right: 36px;
    }
    .qos-select {
      .el-input .el-input__inner {
        background: transparent;
      }
    }
    .el-color-picker {
      position: absolute;
      right: 0;
      top: 6px;
    }
    .topic-mqtt5-title {
      margin: 0 0 10px 10px;
    }
    .topic-mqtt5 {
      .el-form-item {
        margin-bottom: 8px;
        .el-form-item__label {
          text-align: left;
        }
      }
    }
    a.collapse-btn {
      color: var(--color-text-light);
      font-size: 1rem;
      position: relative;
      top: 1px;
    }
    @include collapse-btn-transform(0deg, 180deg);
    .icon-oper {
      color: var(--color-text-default);
      float: right;
      &:hover {
        color: var(--color-main-green);
      }
    }
    .topic-whitespace-hint {
      position: relative;
      margin-top: 16px;
      padding: 12px 10px 8px;
      border: 1px dashed var(--color-border-default);
      border-radius: 6px;
      background: var(--color-bg-normal);
      color: var(--color-text-light);
      font-size: 11px;
      line-height: 14px;
      white-space: pre-wrap;
      word-break: break-word;

      .topic-whitespace-label {
        position: absolute;
        top: 4px;
        right: 8px;
        padding: 0 4px;
        background: var(--color-bg-normal);
        font-size: 12px;
        color: var(--color-text-light);
        opacity: 0.75;
      }

      .topic-whitespace-marker {
        display: block;
        margin-top: 10px;
        color: var(--color-text-default);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;

        .space-marker {
          color: var(--color-main-yellow);
          background: rgba(250, 173, 20, 0.18);
          border-radius: 2px;
          padding: 0 1px;
          font-weight: 600;
        }
      }
    }
  }
}
.topic-tooltip {
  color: var(--color-bg-normal);
  padding: 8px;
  font-size: $font-size--tips;
  background: var(--color-bg-popover);
  text-align: center;
  min-width: 120px;
  border-radius: 8px;
  .popper__arrow::after {
    bottom: 0px !important;
    border-top-color: var(--color-bg-popover) !important;
  }
}
</style>
