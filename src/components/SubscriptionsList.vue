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
          <!-- <a class="hide-btn" href="javascript:;" @click="hideSubsList">
            <i class="iconfont icon-collapse"></i>
          </a> -->
        </div>
        <div
          v-for="(sub, index) in subsList"
          :key="index"
          :class="['topics-item', { active: index === topicActiveIndex, disabled: sub.disabled }]"
          :style="{
            background: `${sub.color}10`,
          }"
          @click="handleClickTopic(sub, index)"
          @contextmenu="handleContextMenu(sub, $event)"
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
              <el-input v-model.trim="subRecord.topic" type="textarea" placeholder="testtopic/#" size="small">
              </el-input>
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
              <el-input v-model.trim="subRecord.alias" type="textarea" size="small"> </el-input>
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
                <el-form-item label-width="180px" label="No Local flag" prop="nl">
                  <el-radio-group v-model="subRecord.nl">
                    <el-radio :label="true">true</el-radio>
                    <el-radio :label="false">false</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label-width="180px" label="Retain as Published flag" prop="rap">
                  <el-radio-group v-model="subRecord.rap">
                    <el-radio :label="true">true</el-radio>
                    <el-radio :label="false">false</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label-width="180px" label="Retain Handling" prop="rh">
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
import useServices from '@/database/useServices'
import time from '@/utils/time'
import { getSubscriptionId } from '@/utils/idGenerator'
import getContextmenuPosition from '@/utils/getContextmenuPosition'

enum SubscribeErrorReason {
  normal,
  qosSubFailed, // qos is abnormal
  qosSubSysFailed, // qos is abnormal becauseof $SYS subscribe
  emptySubFailed, // subscription returns empty array
}

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
    nl: false,
    rap: false,
    rh: 0,
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

  get predefineColors(): string[] {
    return defineColors
  }

  @Watch('$route.params.id')
  private handleIdChanged() {
    this.$emit('onClickTopic', this.topicActiveIndex, true)
    this.topicActiveIndex = null
  }

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
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

  private getSubForm() {
    return this.$refs.form as VueForm
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
    if (!this.client || !this.client.connected) {
      this.$notify({
        title: this.$tc('connections.notConnect'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return false
    }
    this.resetSubs()
    this.setColor()
    this.setNewSubscribeId()
    this.isEdit = false
    this.showDialog = true
  }

  private saveSubs(): void | boolean {
    this.getCurrentConnection(this.connectionId)
    const form = this.getSubForm()
    form.validate(async (valid: boolean) => {
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

  /**
   * Get the error reason message corresponding to the enumeration.
   * Check that errorReason not equal `SubscribeErrorReason.normal` before using.
   * @return Return the message of failure subscribe
   * @param errorReason - Type:enum, The reason cause the failed subscription
   */
  private getErrorReasonMsg(errorReason: SubscribeErrorReason): VueI18n.TranslateResult {
    if (errorReason === SubscribeErrorReason.normal) return ''
    switch (errorReason) {
      case errorReason & SubscribeErrorReason.qosSubFailed: {
        return this.$t('connections.qosSubFailed')
      }
      case errorReason & SubscribeErrorReason.qosSubSysFailed: {
        return this.$t('connections.qosSubSysFailed')
      }
      case errorReason & SubscribeErrorReason.emptySubFailed: {
        return this.$t('connections.emptySubFailed')
      }
    }
    return this.$t('connections.unknowSubFailed')
  }

  public async resubscribe() {
    this.getCurrentConnection(this.connectionId)
    for (let sub of this.subsList) {
      this.$log.info(`Topic: ${sub.topic} is resubscribing`)
      this.subRecord = { ...sub }
      if (this.subRecord.disabled === false) {
        await this.subscribe(this.subRecord)
      }
    }
  }

  private saveTopicToSubList(topic: string, qos: QoS, index?: number, aliasArr?: string[], id?: string): void {
    const existTopicIndex: number = this.subsList.findIndex((item: SubscriptionModel) => item.topic === topic)
    if (existTopicIndex !== -1) {
      this.subsList[existTopicIndex].qos = qos
    } else {
      let { topic: unuseTopic, id: recordID, color, alias, ...others } = this.subRecord
      if (index !== undefined && aliasArr !== undefined) {
        alias = aliasArr ? aliasArr[index] : alias
        if (index > 0) {
          color = getRandomColor()
          id = getSubscriptionId()
        }
      }
      this.subsList.push({
        topic,
        id: id ?? recordID,
        color,
        alias,
        ...others,
      })
    }
  }

  public async subscribe(
    { topic, alias, qos, nl, rap, rh, subscriptionIdentifier, disabled, id }: SubscriptionModel,
    isAuto?: boolean,
    enable?: boolean,
  ) {
    if (isAuto) {
      Object.assign(this.subRecord, {
        nl,
        rap,
        rh,
        topic,
        qos,
        subscriptionIdentifier,
        disabled,
        color: getRandomColor(),
      })
    }
    let isFinished = false
    if (this.client.subscribe) {
      const topicsArr = this.multiTopics ? topic.split(',') : topic
      const aliasArr = this.multiTopics ? alias?.split(',') : alias
      let properties: { subscriptionIdentifier: number } | undefined = undefined
      if (this.record.mqttVersion === '5.0' && subscriptionIdentifier) {
        properties = {
          subscriptionIdentifier,
        }
      } else if (this.record.mqttVersion !== '5.0') {
        nl = undefined
        rap = undefined
        rh = undefined
      }
      this.client.subscribe(topicsArr, { qos, nl, rap, rh, properties }, async (error, granted) => {
        this.subLoading = false
        if (error) {
          this.$message.error(error)
          this.$log.error(`Topic: subscribe error, ${error} `)
          return false
        }
        let errorReason = SubscribeErrorReason.normal

        if (!granted || (Array.isArray(granted) && granted.length < 1)) {
          this.$log.error('Topic: subscribe granted empty')
        } else if (![0, 1, 2].includes(granted[0].qos) && topic.match(/^(\$SYS)/i)) {
          errorReason = SubscribeErrorReason.qosSubSysFailed
        } else if (![0, 1, 2].includes(granted[0].qos)) {
          errorReason = SubscribeErrorReason.qosSubFailed
        }

        if (errorReason !== SubscribeErrorReason.normal) {
          const errorReasonMsg: VueI18n.TranslateResult = this.getErrorReasonMsg(errorReason)
          const errorMsg: string = `${this.$t('connections.subFailed')} ${errorReasonMsg}`
          this.$log.error(`Topic: subscribe error, ${errorReasonMsg} `)
          this.$message.error(errorMsg)
          return false
        }
        if (enable) {
          this.subsList = this.setSubsDisable(topic, disabled)
          this.$log.info(`Enabled topic: ${topic}`)
        } else {
          if (!Array.isArray(topicsArr)) {
            this.saveTopicToSubList(topic, qos, undefined, undefined, id)
          } else {
            topicsArr.forEach((topic, index) => {
              this.saveTopicToSubList(topic, qos, index, aliasArr as string[], id)
            })
          }
          this.$log.info(`Saved topic: ${topic}`)
        }
        this.record.subscriptions = this.subsList
        if (this.record.id) {
          const { subscriptionService } = useServices()
          await subscriptionService.updateSubscriptions(this.record.id, this.record.subscriptions)
          this.changeSubs({ id: this.connectionId, subscriptions: this.subsList })
          this.showDialog = false
          let subLog = `Topic: ${topic} successfully subscribed`
          if (this.record.mqttVersion === '5.0') {
            subLog += `, Subscription Identifier: ${subscriptionIdentifier}, No Local flag: ${nl}, Retain as Published flag: ${rap}, Retain Handling: ${rh}`
          }
          this.$log.info(subLog)
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
              this.$log.info(`Disabled topic: ${topic}`)
            } else {
              payload.subscriptions = this.subsList.filter((sub: SubscriptionModel) => sub.topic !== topic)
              this.$log.info(`Removed topic: ${topic}`)
            }
            this.record.subscriptions = payload.subscriptions
            const { subscriptionService } = useServices()
            await subscriptionService.updateSubscriptions(this.record.id, this.record.subscriptions)
            this.changeSubs(payload)
            this.$emit('deleteTopic', topic)
            this.subsList = payload.subscriptions
            this.$log.info(`Unsubscribe topic: ${topic}`)
            resolve(true)
            return true
          }
        })
      }
    })
  }

  private resetSubs() {
    const form = this.getSubForm()
    form?.clearValidate()
    form?.resetFields()
    this.subRecord.topic = 'testtopic/#'
    this.subRecord.qos = 0
    this.subRecord.alias = ''
    this.subRecord.nl = false
    this.subRecord.rap = false
    this.subRecord.rh = 0
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
      const { x, y } = getContextmenuPosition(event as MouseEvent, 110, 90)
      this.contextmenuConfig.left = x
      this.contextmenuConfig.top = y
      this.showContextmenu = true
      this.selectedTopic = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleTopicEdit() {
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
    this.isEdit = true
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
    padding: 12px 16px 0 16px;
    .hide-btn {
      font-size: 20px;
      position: absolute;
      top: 15px;
      right: 0px;
    }
  }
  .el-card__body {
    padding: 18px 16px 0 16px;
    height: 100%;
    overflow: auto;
    .topics-item {
      cursor: pointer;
      color: var(--color-text-title);
      padding: 0px 8px;
      height: 46px;
      line-height: 46px;
      margin-bottom: 12px;
      position: relative;
      top: 0px;
      clear: both;
      border-radius: 8px;
      -moz-user-select: none;
      -khtml-user-select: none;
      user-select: none;
      transition: all 0.3s ease;
      animation: subItem 0.2s ease-in-out;
      box-shadow: #0000000b 1px 2px 2px;
      &.active {
        background: var(--color-bg-dark) !important;
        box-shadow: none;
        .topic,
        .qos {
          color: var(--color-text-active) !important;
        }
      }
      &.disabled {
        background: transparent !important;
        border: 1px solid var(--color-border-default);
        box-shadow: none;
        cursor: not-allowed;
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
        .el-icon-close,
        .el-icon-loading {
          color: var(--color-text-active);
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
      top: 100px;
    }
    to {
      top: 0px;
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
  }
}
.topic-tooltip {
  color: var(--color-bg-normal);
  padding: 8px;
  font-size: $font-size--tips;
  background: var(--color-bg-popover);
  text-align: center;
  min-width: 120px;
  border-radius: 4px;
  .popper__arrow::after {
    bottom: 0px !important;
    border-top-color: var(--color-bg-popover) !important;
  }
}
</style>
