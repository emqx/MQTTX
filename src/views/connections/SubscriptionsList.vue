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
          <a href="javascript:;" class="close"><i class="el-icon-close"></i></a>
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
        :model="record"
        :rules="rules">
        <el-form-item label="Topic" prop="topic">
          <el-input v-model="record.topic" placeholder="testtopic/#"></el-input>
        </el-form-item>
        <el-form-item label="QoS" prop="qos">
          <el-select v-model="record.qos">
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
import { Component, Vue, Prop } from 'vue-property-decorator'
import RightPanel from '@/components/RightPanel.vue'
import MyDialog from '@/components/MyDialog.vue'

@Component({
  components: {
    RightPanel,
    MyDialog,
  },
})
export default class SubscriptionsList extends Vue {
  @Prop({ required: true }) public subsVisible!: boolean

  private showDialog: boolean = false
  private record: SubscriptionModel = {
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
  private subsList: SubscriptionModel[] = [
    { topic: 'testtopic/#', qos: 0 },
    { topic: 'testtopic/#', qos: 0 },
    { topic: 'testtopic/#', qos: 0 },
    { topic: 'testtopic/#', qos: 0 },
  ]

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private closeSubsList() {
    this.$emit('update:subsVisible', false)
  }

  private openDialog(): void {
    this.showDialog = true
  }

  private saveSubs(): void {
    this.vueForm.validate((valid: boolean) => {
      if (!valid) {
        return false
      }
      console.log(this.record)
    })
  }

  private resetSubs(): void {
    this.vueForm.clearValidate()
    this.vueForm.resetFields()
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
