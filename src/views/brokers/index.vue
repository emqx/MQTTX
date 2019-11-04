<template>
  <div>
    <Leftbar>
      <search-topbar @showNewDialog="showNewBrokerDialog"></search-topbar>
      <BrokersList
        :brokerID="brokerID"
        :data="records"
        @delete="loadData(true)"/>
    </Leftbar>

    <EmptyPage
      v-if="!records.length && !isClientPage"
      name="brokers"
      :btn-title="$t('brokers.newBroker')"
      :click-method="showNewBrokerDialog"/>
    <div v-else class="brokers-view right-content">
      <ClientCreate v-if="isClientPage" :broker="currentBroker"/>
      <BrokerContent
        v-else
        :record="currentBroker"
        :clients="currentClients"
        @edit="showNewBrokerDialog(true)"
        @delete="loadClients"/>
    </div>

    <!-- New broker dialog -->
    <my-dialog
      :title="!isEdit ? $t('brokers.newBroker') : $t('brokers.editBroker')"
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
        <el-form-item :label="$t('brokers.brokerName')" prop="brokerName">
          <el-input v-model="record.brokerName"></el-input>
        </el-form-item>
        <el-form-item :label="$t('brokers.brokerAddress')" prop="brokerAddress">
          <el-input v-model="record.brokerAddress"></el-input>
        </el-form-item>
        <el-form-item :label="$t('brokers.brokerPort')" prop="brokerPort">
          <el-input type="number" v-model.number="record.brokerPort"></el-input>
        </el-form-item>
        <el-form-item label="SSL/TLS" prop="tls">
          <el-radio :label="false" v-model="record.tls">false</el-radio>
          <el-radio :label="true" v-model="record.tls">true</el-radio>
        </el-form-item>
        <el-form-item :label="$t('brokers.certType')" prop="certType" v-if="record.tls">
          <el-radio label="ca" v-model="record.certType">CA signed</el-radio>
          <el-radio label="self" v-model="record.certType">Self signed</el-radio>
        </el-form-item>
      </el-form>
    </my-dialog>

  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import MyDialog from '@/components/MyDialog.vue'
import BrokersList from './BrokersList.vue'
import BrokerContent from './BrokerContent.vue'
import ClientCreate from './clients/ClientCreate.vue'
import EmptyPage from '@/components/EmptyPage.vue'
import { loadBrokers, loadBroker, createBroker, updateBroker, loadClients } from '@/utils/api/broker'
import { BrokerModel, ClientModel } from './types'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    BrokersList,
    MyDialog,
    BrokerContent,
    ClientCreate,
    EmptyPage,
  },
})

export default class Brokers extends Vue {
  private newBrokerDialogVisible: boolean = false
  private newBrokerConfirmLoading: boolean = false
  private isEdit: boolean = false

  private records: BrokerModel[] = []

  private record: BrokerModel = {
    brokerName: '',
    brokerAddress: '',
    brokerPort: 8083,
    tls: false,
    certType: undefined,
  }

  private currentClients: ClientModel[] = []

  private currentBroker: BrokerModel = {
    id: '',
    brokerName: '',
    brokerAddress: '',
    brokerPort: 8083,
    tls: false,
    certType: undefined,
  }

  @Watch('$route.params.id')
  private handleIdChanged() {
    this.loadDetail()
    this.loadClients()
  }

  @Watch('isClientPage')
  private handlePageChange() {
    this.loadClients()
  }

  get rules(): any {
    return {
      brokerName: [{ required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      brokerAddress: [{ required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      brokerPort: [{ type: 'number', required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      tls: [{ type: 'boolean', required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      certType: [{ required: true, trigger: 'change', message: this.$t('common.selectRequired') }],
    }
  }

  get isClientPage(): boolean {
    return this.$route.name === 'Clients'
  }

  get brokerID(): string | undefined {
    return this.$route.params.id
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private async loadDetail(): Promise<void> {
    const res: BrokerModel = await loadBroker(this.brokerID as string)
    if (res) {
      this.currentBroker = res
    }
  }

  private async loadClients(): Promise<void> {
    const res = await loadClients(this.brokerID as string)
    if (res) {
      this.currentClients = res
    }
  }

  private async loadData(reload: boolean = false): Promise<void> {
    const res: BrokerModel[] | [] = await loadBrokers()
    this.records = res
    if (reload && this.records.length) {
      this.$router.push({ path: `/brokers/${this.records[0].id}` })
    }
    if (this.records.length) {
      this.loadDetail()
    }
    this.loadClients()
  }

  private saveBroker(): boolean | void {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const data = { ...this.record }
      let res: BrokerModel | null = null
      let faild: string = ''
      if (!this.isEdit) {
        res = await createBroker(data)
        faild = this.$t('common.createfailed') as string
      } else {
        res = await updateBroker(this.brokerID as string, data)
        faild = this.$t('common.editfailed') as string
      }
      if (res) {
        this.newBrokerDialogVisible = false
        this.resetBroker()
        this.loadData()
        this.$router.push(`/brokers/${res.id}`)
      } else {
        this.$message.error(faild)
      }
    })
  }

  private resetBroker(): void {
    this.record = {
      brokerName: '',
      brokerAddress: '',
      brokerPort: 8083,
      tls: false,
      certType: undefined,
    }
    this.vueForm.clearValidate()
    this.vueForm.resetFields()
  }

  private showNewBrokerDialog(isEdit: boolean = false): void {
    this.isEdit = isEdit
    this.newBrokerDialogVisible = true
    if (isEdit) {
      this.record = { ...this.currentBroker }
    }
  }

  private created(): void {
    this.loadData()
  }
}
</script>


<style lang="scss" scoped>
.brokers-view {
  padding: 90px 16px;
}
</style>
