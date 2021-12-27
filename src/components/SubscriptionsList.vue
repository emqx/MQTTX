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
          <a class="hide-btn" href="javascript:;" @click="hideSubsList">
            <i class="iconfont icon-collapse"></i>
          </a>
        </div>
        <div
          v-for="(sub, index) in subsList"
          :key="index"
          :class="['topics-item', index === topicActiveIndex ? 'active' : '']"
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
          <a href="javascript:;" class="close" @click.stop="removeSubs(sub)">
            <i :class="unsubLoading ? 'el-icon-loading' : 'el-icon-close'"></i>
          </a>
        </div>
      </el-card>
    </left-panel>
    <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
      <a href="javascript:;" :class="['context-menu__item']" @click="handleTopicEdit">
        <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
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
                v-if="!isEdit"
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
              <el-select v-model="subRecord.qos" size="small">
                <el-option v-for="qos in qosOption" :key="qos" :label="qos" :value="qos"> </el-option>
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
                v-if="!isEdit"
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

  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions!: (payload: SubscriptionsVisible) => void
  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs!: (payload: Subscriptions) => void

  @Getter('currentTheme') private theme!: Theme
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

  private hideSubsList() {
    this.$emit('update:subsVisible', false)
    this.changeShowSubscriptions({ showSubscriptions: false })
  }

  private openDialog() {
    this.showDialog = true
    this.isEdit = false
    this.setColor()
    this.setNewSubscribeId()
  }

  private saveSubs(): void | boolean {
    this.getCurrentConnection(this.connectionId)
    if (!this.client || !this.client.connected) {
      this.$message.warning(this.$tc('connections.notConnect'))
      return false
    }
    this.subForm.validate((valid: boolean) => {
      if (!valid) {
        return false
      }
      this.subLoading = true
      this.subRecord.color = this.topicColor || this.getBorderColor()
      if (!this.isEdit) {
        this.subscribe(this.subRecord)
        this.$log.info(`Save subscription topic: ${this.subRecord.topic} successed`)
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
    for (let i = 0; i < this.subsList.length; i++) {
      const sub = this.subsList[i]
      this.$log.info(`Topic: ${sub.topic} is resubscribing`)
      this.subRecord = sub
      await this.subscribe({ ...this.subRecord })
    }
  }

  public async subscribe(
    { topic, alias, qos, nl, rap, rh, subscriptionIdentifier }: SubscriptionModel,
    isAuto?: boolean,
  ) {
    if (isAuto) {
      this.subRecord.nl = nl
      this.subRecord.rap = rap
      this.subRecord.rh = rh
      this.subRecord.topic = topic
      this.subRecord.qos = qos
      this.subRecord.subscriptionIdentifier = subscriptionIdentifier
      this.subRecord.color = getRandomColor()
    }
    let isFinshed = false
    if (this.client.subscribe) {
      const topicsArr = topic.split(',')
      const aliasArr = alias?.split(',')
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
        topicsArr.forEach((topic, index) => {
          const existTopicIndex: number = this.subsList.findIndex((item: SubscriptionModel) => item.topic === topic)
          if (existTopicIndex !== -1) {
            this.subsList[existTopicIndex].qos = qos
          } else {
            let { topic: unuseTopic, color, alias, id, ...others } = this.subRecord
            alias = aliasArr ? aliasArr[index] : alias
            if (index > 0) {
              color = getRandomColor()
              id = getSubscriptionId()
            }
            this.subsList.push({
              topic,
              id,
              color,
              alias,
              ...others,
            })
          }
        })
        this.record.subscriptions = this.subsList
        if (this.record.id) {
          const { connectionService } = useServices()
          await connectionService.updateWithCascade(this.record.id, this.record)
          this.changeSubs({ id: this.connectionId, subscriptions: this.subsList })
          this.showDialog = false
          let subLog = `Topic: ${topic} successfully subscribed`
          if (this.record.mqttVersion === '5.0') {
            subLog += `, Subscription Identifier: ${subscriptionIdentifier}, No Local flag: ${nl}, Retain as Published flag: ${rap}, Retain Handling: ${rh}`
          }
          this.$log.info(subLog)
        }
        isFinshed = true
      })
    }
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // TODO: maybe we should replace mqtt.js to mqtt-async.js
    await new Promise(async (resolve) => {
      // long pool query base on sleep
      while (!isFinshed) {
        await sleep(100)
      }
      resolve(isFinshed)
    })
  }

  private async updateSub() {
    if (this.selectedTopic) {
      const res = await this.removeSubs(this.selectedTopic)
      if (res) {
        this.subscribe(this.subRecord)
      }
    }
  }

  private removeSubs(row: SubscriptionModel): Promise<boolean> {
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
      const { topic, qos } = row
      if (this.client.unsubscribe) {
        this.client.unsubscribe(topic, { qos }, async (error) => {
          this.unsubLoading = false
          if (error) {
            this.$message.error(error)
            resolve(false)
            return false
          }
          if (this.record.id) {
            const payload: {
              id: string
              subscriptions: SubscriptionModel[]
            } = {
              id: this.record.id,
              subscriptions: this.subsList.filter(($: SubscriptionModel) => $.topic !== topic),
            }
            this.record.subscriptions = payload.subscriptions
            if (this.record.id) {
              const { connectionService } = useServices()
              await connectionService.updateSubscriptions(this.record.id, payload.subscriptions)
              this.changeSubs(payload)
              this.subsList = payload.subscriptions
              this.$emit('deleteTopic')
              this.$log.info(`Unsubscribe topic: ${topic}`)
              resolve(true)
              return true
            }
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
    this.selectedTopic = null
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
    padding: 16px 16px 0 16px;
    text-align: initial;
    .new-subs-btn {
      border-width: 1px;
      border-style: dashed;
    }
    .hide-btn {
      font-size: 20px;
      position: absolute;
      top: 15px;
      right: 0px;
    }
  }
  .el-card__body {
    padding: 16px 16px 0 16px;
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
      transition: all 0.3s ease;
      animation: subItem 0.2s ease-in-out;
      &.active {
        background: var(--color-bg-dark) !important;
        box-shadow: none;
        .topic,
        .qos {
          color: var(--color-text-active) !important;
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
