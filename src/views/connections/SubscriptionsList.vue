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
        <div class="topics-item" v-for="(sub, index) in subsList" :key="index">
          <el-tooltip
            effect="light"
            :disabled="sub.topic.length < 20"
            :content="sub.topic"
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
      @confirm="saveSubs"
      @close="resetSubs">
      <el-form
        ref="form"
        :model="subRecord"
        :rules="rules">
        <el-form-item label="Topic" prop="topic">
          <el-input v-model="subRecord.topic" placeholder="testtopic/#"></el-input>
        </el-form-item>
        <el-form-item label="QoS" prop="qos">
          <el-select v-model="subRecord.qos">
            <el-option
              v-for="qos in qosOption"
              :key="qos"
              :label="qos"
              :value="qos">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </my-dialog>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { updateConnection } from '@/utils/api/connection'
import LeftPanel from '@/components/LeftPanel.vue'
import MyDialog from '@/components/MyDialog.vue'
import { ConnectionModel } from './types'

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

  @Action('SHOW_SUBSCRIPTIONS') private changeShowSubscriptions: $TSFixed
  @Action('CHANGE_SUBSCRIPTIONS') private changeSubs: any
  @Getter('activeConnection') private activeConnection: any

  private currentConnection: $TSFixed = {}
  private showDialog: boolean = false
  private subRecord: SubscriptionModel = {
    topic: '',
    qos: 0,
  }
  get rules() {
    return {
      topic: { required: true, message: this.$t('common.inputRequired') },
      qos: { required: true, message: this.$t('common.selectRequired') },
    }
  }
  private qosOption: qosList = [0, 1, 2]
  private subsList: SubscriptionModel[] = []

  @Watch('record')
  private handleRecordChanged(val: ConnectionModel) {
    this.getCurrentConnection(val.id as string)
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
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
      background: var(--color-bg-tabs);
      padding: 0px 8px;
      height: 46px;
      line-height: 46px;
      margin-bottom: 16px;
      position: relative;
      clear: both;
      .topic {
        max-width: 164px;
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
        background: var(--color-second-red);
        position: absolute;
        right: -7px;
        top: -7px;
        width: 18px;
        height: 18px;
        text-align: center;
        line-height: 18px;
        .el-icon-close {
          color: var(--color-bg-normal);
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
</style>
