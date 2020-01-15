<template>
  <div>
    <left-panel>
      <el-card
        v-if="subsVisible"
        shadow="never"
        class="subscriptions-list-view"
        :style="{
          top: top,
        }">
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
          class="topics-item"
          v-for="(sub, index) in subsList"
          :key="index"
          :style="{
            borderLeft: `4px solid ${sub.color}`,
          }">
          <el-tooltip
            :effect="theme !== 'light' ? 'light' : 'dark'"
            :disabled="sub.topic.length < 25"
            :content="sub.topic"
            :open-delay="500"
            placement="top">
            <span class="topic">
              {{ sub.topic }}
            </span>
          </el-tooltip>
          <span class="qos">QoS {{ sub.qos }}</span>
          <a href="javascript:;" class="close" @click="removeSubs(sub)">
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
      @close="resetSubs">
      <el-row :gutter="20">
        <el-form
          ref="form"
          :model="subRecord"
          :rules="rules">
          <el-col :span="24">
            <el-form-item label="Topic" prop="topic">
              <el-input v-model="subRecord.topic" placeholder="testtopic/#" size="small">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="20">
            <el-form-item label="QoS" prop="qos">
              <el-select v-model="subRecord.qos" size="small">
                <el-option
                  v-for="qos in qosOption"
                  :key="qos"
                  :label="qos"
                  :value="qos">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item :label="$t('connections.color')">
              <el-color-picker
                v-model="topicColor"
                size="small"
                color-format="hex"
                :predefine="predefineColors">
              </el-color-picker>
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
import { updateConnection } from '@/utils/api/connection'
import LeftPanel from '@/components/LeftPanel.vue'
import MyDialog from '@/components/MyDialog.vue'
import { ConnectionModel } from '../views/connections/types'

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
  private predefineColors = ['#34C388', '#6ECBEE', '#D08CF1', '#907AEF', '#EDB16E']
  private currentConnection: $TSFixed = {}
  private showDialog: boolean = false
  private subRecord: SubscriptionModel = {
    topic: 'testtopic/#',
    qos: 0,
  }
  private qosOption: qosList = [0, 1, 2]
  private subsList: SubscriptionModel[] = []

  get rules() {
    return {
      topic: { required: true, message: this.$t('common.inputRequired') },
      qos: { required: true, message: this.$t('common.selectRequired') },
    }
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
    this.getCurrentConnection(val.id as string)
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

  private openDialog(): void {
    this.showDialog = true
  }

  private saveSubs(): void | boolean {
    this.getCurrentConnection(this.connectionId)

    if (!this.currentConnection.client) {
      return false
    }
    if (!this.currentConnection.client.connected) {
      return false
    }
    this.vueForm.validate((valid: boolean) => {
      if (!valid) {
        return false
      }
      const { topic, qos } = this.subRecord
      this.subRecord.color = this.topicColor || this.getBorderColor()
      this.currentConnection.client.subscribe(
        topic,
        { qos },
        (error: string, res: SubscriptionModel[]) => {
          if (error) {
            this.$message.error(error)
            return false
          }
          if (res.length < 1 || ![0, 1, 2].includes(res[0].qos)) {
            this.$message.error(this.$t('connections.subFailed') as string)
            return false
          }

          const subscriptions: SubscriptionModel[] = this.currentConnection.subscriptions || []
          const existTopicIndex: number = subscriptions.findIndex(
            (item: SubscriptionModel) => item.topic === topic,
          )
          if (existTopicIndex !== -1) {
            subscriptions[existTopicIndex].qos = qos
          } else {
            subscriptions.push({ ...this.subRecord })
          }
          if (!this.record.clean) {
            this.record.subscriptions = subscriptions
            updateConnection(this.record.id as string, this.record)
          }
          this.changeSubs({ id: this.connectionId, subscriptions })
          this.subsList = subscriptions
          this.showDialog = false
          return true
        },
      )
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
        id: string,
        subscriptions: SubscriptionModel[],
      } = {
        id: this.record.id as string,
        subscriptions: this.subsList.filter(
          ($: SubscriptionModel) => $.topic !== topic,
        ),
      }
      this.record.subscriptions = payload.subscriptions
      updateConnection(this.record.id as string, this.record)
      this.changeSubs(payload)
      this.subsList = payload.subscriptions
      return true
    })
  }

  private resetSubs(): void {
    this.vueForm.clearValidate()
    this.vueForm.resetFields()
  }

  private getCurrentConnection(id: string): void {
    const $activeConnection = this.activeConnection[id]
    const { clean } = this.record
    if ($activeConnection) {
      this.currentConnection = $activeConnection
      if (clean) {
        this.subsList = $activeConnection.subscriptions || []
      } else {
        this.subsList = this.record.subscriptions
      }
    } else {
      this.currentConnection = {}
      this.subsList = this.record.subscriptions
    }
  }

  private created(): void {
    this.getCurrentConnection(this.connectionId)
  }
}
</script>


<style lang="scss">
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
    padding: 16px;
    height: 100%;
    overflow: scroll;
    .topics-item {
      color: var(--color-text-title);
      background: var(--color-bg-topics);
      padding: 0px 8px;
      height: 46px;
      line-height: 46px;
      margin-bottom: 16px;
      position: relative;
      clear: both;
      border-radius: 2px;
      .topic {
        max-width: 120px;
        margin-left: 5px;
        display: inline-block;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        user-select: all;
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
}
.topic-dialog {
  .el-dialog__body {
    padding: 20px 20px 0 20px;
    .el-color-picker {
      top: 3px;
    }
    .el-color-picker--small .el-color-picker__trigger {
      width: 40px;
    }
  }
}
</style>
