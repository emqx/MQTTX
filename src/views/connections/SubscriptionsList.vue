<template>
  <div>
    <right-panel>
      <el-card class="subscriptions-list-view" v-if="subsVisible">
        <div slot="header" class="clearfix">
          <a href="javascript:;" class="message-close" @click="openDialog">
            <i class="el-icon-plus"></i>
            {{ $t('connections.newSubscription') }}
          </a>
          <a href="javascript:;" class="back-btn" @click="closeSubsList">
            <i class="el-icon-arrow-right"></i>
          </a>
        </div>
        <div class="topics-item" v-for="(sub, index) in subsList" :key="index">
          <span class="topic">{{ sub.topic }}</span>
          <span class="qos">QoS {{ sub.qos }}</span>
          <a href="javascript:;" class="close" @click="removeSubs(sub)">
            <i class="el-icon-close"></i>
          </a>
        </div>
      </el-card>
    </right-panel>

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
import RightPanel from '@/components/RightPanel.vue'
import MyDialog from '@/components/MyDialog.vue'
import { ConnectionModel } from './types'

@Component({
  components: {
    RightPanel,
    MyDialog,
  },
})
export default class SubscriptionsList extends Vue {
  @Prop({ required: true }) public subsVisible!: boolean
  @Prop({ required: true }) public connectionId!: string
  @Prop({ required: true }) public record!: ConnectionModel

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

  @Watch('connectionId')
  private handleIdChanged(val: string) {
    this.setCurrentConnection(val)
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private closeSubsList() {
    this.$emit('update:subsVisible', false)
  }

  private openDialog(): void {
    this.showDialog = true
  }

  private saveSubs(): void | boolean {
    this.setCurrentConnection(this.connectionId)

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
          this.record.subscriptions = subscriptions
          updateConnection(this.record.id as string, this.record)
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
        subscriptions: this.currentConnection.subscriptions.filter(
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

  private setCurrentConnection(id: string): void {
    const $activeConnection = this.activeConnection[id]
    if ($activeConnection) {
      this.subsList = $activeConnection.subscriptions || []
      this.currentConnection = $activeConnection
    } else {
      this.currentConnection = {}
      this.subsList = []
    }
  }

  private created(): void {
    this.setCurrentConnection(this.connectionId)
  }
}
</script>


<style lang="scss">
.subscriptions-list-view {
  .el-card__header {
    text-align: center;
    position: relative;
    .back-btn {
      width: 24px;
      height: 24px;
      background: var(--color-bg-accent);
      color: var(--color-text-light);
      position: absolute;
      left: 0;
      top: 17px;
      padding: 1px;
    }
  }
  .el-card__body {
    padding: 0px;
    .topics-item {
      padding: 20px;
      color: var(--color-text-title);
      border-bottom: 1px solid var(--color-border-default);
      display: flex;
      .topic {
        flex: 3;
      }
      .qos {
        flex: 1;
        color: var(--color-text-light);
      }
      .close {
        visibility: hidden;
        color: var(--color-second-red);
      }
      transition: 0.3s all;
      &:hover {
        background: var(--color-thrid-green);
        .close {
          visibility: visible;
        }
      }
    }
  }
}
</style>
