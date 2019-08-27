<template>
  <div>
    <Leftbar>
      <search-topbar @showNewDialog="showNewBrokerDialog"></search-topbar>
      <BrokersList/>
    </Leftbar>

    <div class="brokers-view right-content">
      <BrokerTopbar/>
      <BrokerContent/>
    </div>
    <!-- <div class="brokers-view right-content">
      <ClientCreate/>
    </div> -->

    <!-- New broker dialog -->
    <my-dialog
      :title="$t('brokers.newBrokerDialogTitle')"
      :confirmLoading="newBrokerConfirmLoading"
      :visible.sync="newBrokerDialogVisible"
      @confirm="saveBroker"
      @close="resetBroker">
      <el-form
        ref="form"
        label-position="right"
        label-width="130px"
        :model="record"
        :rules="rules">
        <el-form-item label="Broker Name" prop="brokerName">
          <el-input v-model="record.brokerName"></el-input>
        </el-form-item>
        <el-form-item label="Broker Address" prop="brokerAddress">
          <el-input v-model="record.brokerAddress"></el-input>
        </el-form-item>
        <el-form-item label="Broker Port" prop="brokerPort">
          <el-input type="number" v-model.number="record.brokerPort"></el-input>
        </el-form-item>
        <el-form-item label="SSL/TLS" prop="tls">
          <el-radio :label="false" v-model="record.tls">false</el-radio>
          <el-radio :label="true" v-model="record.tls">true</el-radio>
        </el-form-item>
        <el-form-item label="Certificate Type" prop="certType" v-if="record.tls">
          <el-radio label="ca" v-model="record.certType">CA signed</el-radio>
          <el-radio label="self" v-model="record.certType">Self signed</el-radio>
        </el-form-item>
      </el-form>
    </my-dialog>

  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import MyDialog from '@/components/MyDialog.vue'
import BrokersList from './BrokersList.vue'
import BrokerTopbar from './BrokerTopbar.vue'
import BrokerContent from './BrokerContent.vue'
import ClientCreate from './clients/ClientCreate.vue'

interface BrokerModel {
  brokerName: string,
  brokerAddress: string,
  brokerPort: string,
  tls: boolean,
  certType?: string,
}

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    BrokersList,
    MyDialog,
    BrokerTopbar,
    BrokerContent,
    ClientCreate,
  },
})

export default class Brokers extends Vue {
  private newBrokerDialogVisible: boolean = false
  private newBrokerConfirmLoading: boolean = false

  // Broker model
  private record: BrokerModel = {
    brokerName: '',
    brokerAddress: '',
    brokerPort: '',
    tls: false,
    certType: undefined,
  }

  private rules = {
    brokerName: [{ required: true, trigger: 'change', message: 'required' }],
    brokerAddress: [{ required: true, trigger: 'change', message: 'required' }],
    brokerPort: [{ type: 'number', required: true, trigger: 'change', message: 'required' }],
    tls: [{ type: 'boolean', required: true, trigger: 'change', message: 'required' }],
    certType: [{ required: true, trigger: 'change', message: 'required' }],
  }

  private saveBroker(): boolean | void {
    (this.$refs.form as any).validate((valid: boolean) => {
      if (!valid) {
        return false
      }
      console.log(this.record)
    })
  }

  private resetBroker(): void {
    console.log('resetBroker')
  }

  private showNewBrokerDialog(): void {
    this.newBrokerDialogVisible = true
  }
}
</script>


<style lang="scss" scoped>
.brokers-view {
  padding: 90px 16px;
}
</style>
