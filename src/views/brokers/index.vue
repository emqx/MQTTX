<template>
  <div>
    <Leftbar>
      <search-topbar @showNewDialog="showNewBrokerDialog"></search-topbar>
      <BrokersList/>
    </Leftbar>

    <div class="brokers-view right-content">
      <div class="titlebar">Brokers</div>
    </div>

    <!-- New broker dialog -->
    <my-dialog
      :title="$t('brokers.newBrokerDialogTitle')"
      :confirmLoading="newBrokerConfirmLoading"
      :visible.sync="newBrokerDialogVisible"
      @confirm="saveBroker"
      @close="resetBroker">
      <el-form ref="form" :model="form">
        <el-form-item label="Broker Name">
          <el-input ></el-input>
        </el-form-item>
        <el-form-item label="Broker Address">
          <el-input ></el-input>
        </el-form-item>
        <el-form-item label="Broker Port">
          <el-input ></el-input>
        </el-form-item>
        <el-form-item label="Certificate Type">
          <el-radio >CA signed</el-radio>
          <el-radio >Self signed</el-radio>
        </el-form-item>
        <el-form-item label="SSL/TLS">
          <el-radio >true</el-radio>
          <el-radio >false</el-radio>
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

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    BrokersList,
    MyDialog,
  },
})
export default class Brokers extends Vue {
  private newBrokerDialogVisible: boolean = false
  private newBrokerConfirmLoading: boolean = false

  private saveBroker(): void {
    console.log('saveBroker')
  }
  private resetBroker(): void {
    console.log('resetBroker')
  }
  private showNewBrokerDialog(): void {
    this.newBrokerDialogVisible = true
  }
}
</script>
