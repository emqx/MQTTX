<template>
  <div>
    <right-panel>
      <el-card class="subscriptions-list-view" v-if="subsVisible">
        <div slot="header" class="clearfix">
          <a href="javascript:;" class="message-close" @click="openDialog">
            <i class="el-icon-plus"></i>
            {{ $t('connections.newSubscription') }}
          </a>
        </div>
        <div class="topics-item" v-for="(sub, index) in subsList" :key="index">
          <span class="topic">{{ sub.topic }}</span>
          <span class="qos">QoS {{ sub.qos }}</span>
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
  ]

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
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
  }
  .el-card__body {
    padding: 0px;
    .topics-item {
      padding: 20px;
      color: var(--color-text-title);
      border-bottom: 1px solid var(--color-border-default);
      .qos {
        color: var(--color-text-light);
        float: right;
      }
    }
  }
}
</style>
