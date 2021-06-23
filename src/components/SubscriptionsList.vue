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
          <a href="javascript:;" class="new-subs" @click="openDialog">
            <i class="el-icon-plus"></i>
            {{ $t('connections.newSubscription') }}
          </a>
          <a class="hide-btn" href="javascript:;" @click="hideSubsList">
            <i class="iconfont icon-zhedie"></i>
          </a>
        </div>
        <div
          v-for="(sub, index) in subsList"
          :key="index"
          :class="['topics-item', index === topicActiveIndex ? 'active' : '']"
          @click="handleClickTopic(sub, index)"
        >
          <div
            :style="{
              background: `${sub.color}`,
            }"
            class="topics-color-box"
          ></div>
          <el-popover
            placement="top"
            trigger="hover"
            width="100%"
            popper-class="topic-tooltip"
            :content="copySuccess ? $t('connections.topicCopied') : sub.topic"
          >
            <a
              slot="reference"
              v-clipboard:copy="sub.topic"
              v-clipboard:success="onCopySuccess"
              href="javascript:;"
              class="topic"
              @click.stop="stopClick"
            >
              {{ sub.alias || sub.topic }}
            </a>
          </el-popover>
          <span class="qos">QoS {{ sub.qos }}</span>
          <a href="javascript:;" class="close" @click.stop="removeSubs(sub)">
            <i class="el-icon-close"></i>
          </a>
        </div>
      </el-card>
    </left-panel>

    <!-- New subscription dialog -->
    <my-dialog
      :title="$t('connections.newSubscription')"
      :visible.sync="showDialog"
      width="500px"
      class="topic-dialog"
      @confirm="saveSubs"
      @close="resetSubs"
      @keyupEnter="saveSubs"
    >
      <el-row :gutter="20">
        <el-form ref="form" :model="subRecord" :rules="rules">
          <el-col :span="24">
            <el-form-item label="Topic" prop="topic">
              <el-input v-model="subRecord.topic" placeholder="testtopic/#" size="small"> </el-input>
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
              <el-input v-model="topicColor" size="small" placeholder="#34C388">
                <i slot="suffix" title="Refresh" class="el-icon-refresh" @click="setColor"> </i>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('connections.alias')">
              <el-input v-model="subRecord.alias" size="small"> </el-input>
            </el-form-item>
          </el-col>
        </el-form>
      </el-row>
    </my-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { updateConnection } from '@/api/connection'
import { defineColors, getRandomColor } from '@/utils/colors'
import LeftPanel from '@/components/LeftPanel.vue'
import MyDialog from '@/components/MyDialog.vue'
import { ConnectionModel, SubscribeErrorReason } from '../views/connections/types'
import VueI18n from 'vue-i18n'

@Component({
  components: {
    LeftPanel,
    MyDialog,
  },
})
export default class SubscriptionsList extends Vue {
  @Prop({ required: true }) public subsVisible!: boolean
  @Prop({ required: true }) public connectionId!: string
  @Prop({ required: true }) public record!: ConnectionModel
  @Prop({ type: String, default: '60px' }) public top!: string

  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions!: (payload: SubscriptionsVisible) => void
  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs!: (payload: Subscriptions) => void
  @Getter('activeConnection') private activeConnection: $TSFixed
  @Getter('currentTheme') private theme!: Theme

  private topicColor = ''
  private currentConnection: $TSFixed = {}
  private showDialog: boolean = false
  private subRecord: SubscriptionModel = {
    topic: 'testtopic/#',
    qos: 0,
  }
  private qosOption: QoSList = [0, 1, 2]
  private subsList: SubscriptionModel[] = []
  private copySuccess = false
  private topicActiveIndex: number | null = null

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
    this.getCurrentConnection(val.id as string)
    this.subsList = val.subscriptions
  }

  private setColor() {
    this.topicColor = getRandomColor()
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
    this.setColor()
  }

  private saveSubs(): void | boolean {
    this.getCurrentConnection(this.connectionId)
    if (!this.currentConnection.client || !this.currentConnection.client.connected) {
      this.$message.warning(this.$t('connections.notConnect') as string)
      return false
    }
    this.subForm.validate((valid: boolean) => {
      if (!valid) {
        return false
      }
      this.subRecord.topic = this.subRecord.topic.trim()
      this.subRecord.alias = this.subRecord.alias ? this.subRecord.alias.trim() : this.subRecord.alias
      this.subRecord.color = this.topicColor || this.getBorderColor()
      this.subscribe(this.subRecord)
      this.$log.info(`Save subscription topic: ${this.subRecord.topic} successed`)
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

  public resubscribe() {
    this.getCurrentConnection(this.connectionId)
    this.subsList.forEach((sub) => {
      this.$log.info(`Topic: ${sub.topic} is resubscribing`)
      this.subRecord.topic = sub.topic
      this.subRecord.qos = sub.qos
      this.subRecord.color = sub.color
      this.subscribe(this.subRecord)
    })
  }

  public subscribe({ topic, qos }: SubscriptionModel, isAuto?: boolean) {
    if (isAuto) {
      this.subRecord.topic = topic
      this.subRecord.qos = qos
      this.subRecord.color = getRandomColor()
    }
    this.currentConnection.client.subscribe(topic, { qos }, (error: string, res: SubscriptionModel[]) => {
      if (error) {
        this.$message.error(error)
        this.$log.error(`Topic: ${topic} subscribe error ${error} `)
        return false
      }
      let errorReason: SubscribeErrorReason = SubscribeErrorReason.normal
      if (res.length < 1) {
        errorReason = SubscribeErrorReason.emptySubFailed
      } else if (![0, 1, 2].includes(res[0].qos) && topic.match(/^(\$SYS)/i)) {
        errorReason = SubscribeErrorReason.qosSubSysFailed
      } else if (![0, 1, 2].includes(res[0].qos)) {
        errorReason = SubscribeErrorReason.qosSubFailed
      }

      if (errorReason !== SubscribeErrorReason.normal) {
        const errorReasonMsg: VueI18n.TranslateResult = this.getErrorReasonMsg(errorReason)
        const errorMsg: string = `${topic} ${this.$t('connections.subFailed')} ${errorReasonMsg}`
        this.$log.error(`Topic: ${topic} subscribe error ${errorReasonMsg} `)
        this.$message.error(errorMsg)
        return false
      }
      const existTopicIndex: number = this.subsList.findIndex((item: SubscriptionModel) => item.topic === topic)
      if (existTopicIndex !== -1) {
        this.subsList[existTopicIndex].qos = qos
      } else {
        this.subsList.push({ ...this.subRecord })
      }
      this.record.subscriptions = this.subsList
      updateConnection(this.record.id as string, this.record)
      this.changeSubs({ id: this.connectionId, subscriptions: this.subsList })
      this.showDialog = false
      this.$log.info(`Topic: ${topic} successfully subscribed`)
    })
  }

  private removeSubs(row: SubscriptionModel): void | boolean {
    if (!this.currentConnection.client) {
      return false
    }
    if (!this.currentConnection.client.connected) {
      return false
    }
    const { topic, qos } = row
    this.currentConnection.client.unsubscribe(topic, { qos }, (error: string) => {
      if (error) {
        this.$message.error(error)
        return false
      }
      const payload: {
        id: string
        subscriptions: SubscriptionModel[]
      } = {
        id: this.record.id as string,
        subscriptions: this.subsList.filter(($: SubscriptionModel) => $.topic !== topic),
      }
      this.record.subscriptions = payload.subscriptions
      updateConnection(this.record.id as string, this.record)
      this.changeSubs(payload)
      this.subsList = payload.subscriptions
      this.$emit('deleteTopic')
      this.$log.info(`Unsubscribe topic: ${topic}`)
      return true
    })
  }

  private resetSubs() {
    this.subForm.clearValidate()
    this.subForm.resetFields()
    this.subRecord.topic = 'testtopic/#'
    this.subRecord.qos = 0
    this.subRecord.alias = ''
  }

  private getCurrentConnection(id: string) {
    const $activeConnection = this.activeConnection[id]
    if ($activeConnection) {
      this.currentConnection = $activeConnection
    } else {
      this.currentConnection = {}
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

  private created() {
    this.getCurrentConnection(this.connectionId)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/variable.scss';

.subscriptions-list-view {
  &.el-card {
    border-top: 0px;
    border-left: 0px;
  }
  .el-card__header {
    border-bottom: 1px solid var(--color-border-default);
    text-align: center;
    position: relative;
    .hide-btn {
      font-size: 20px;
      position: absolute;
      top: 13px;
      right: 0px;
    }
  }
  .el-card__body {
    padding: 8px 16px;
    height: 100%;
    overflow: auto;
    .topics-item {
      cursor: pointer;
      color: var(--color-text-title);
      background: var(--color-bg-topics);
      padding: 0px 8px;
      height: 46px;
      line-height: 46px;
      margin-bottom: 8px;
      position: relative;
      top: 0px;
      clear: both;
      border-radius: 4px;
      -moz-user-select: none;
      -khtml-user-select: none;
      user-select: none;
      transition: all 0.3s ease;
      box-shadow: var(--color-bg-topics_shadow) 0px 1px 1px, var(--color-bg-topics_shadow) 0px 0px 1px;
      animation: subItem 0.2s ease-in-out;
      &.active {
        background: var(--color-bg-topics_active);
        box-shadow: none;
        .topic,
        .qos {
          color: var(--color-text-topics_active);
        }
      }
      .topics-color-box {
        margin: 0 5px 0 0;
        display: inline-block;
        width: 16px;
        height: 16px;
        vertical-align: top;
        border-radius: 4px;
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
        color: var(--color-text-default);
      }
      .qos {
        float: right;
        color: var(--color-text-light);
      }
      .close {
        display: none;
        border-radius: 50%;
        background: var(--color-second-red);
        position: absolute;
        right: -5px;
        top: -5px;
        width: 18px;
        height: 18px;
        text-align: center;
        line-height: 18px;
        .el-icon-close {
          color: #fff;
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
  }
}
.topic-tooltip {
  color: var(--color-bg-normal);
  padding: 8px;
  font-size: $font-size--tips;
  background: var(--color-bg-popover);
  text-align: center;
  min-width: auto;
  border-radius: 4px;
  .popper__arrow::after {
    bottom: 0px !important;
    border-top-color: var(--color-bg-popover) !important;
  }
}
</style>
