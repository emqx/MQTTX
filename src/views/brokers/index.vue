<template>
  <div>
    <Leftbar>
      <SearchTopbar
        :loading="searchLoading"
        @reload="loadData"
        @search="searchBroker"
        @showNewDialog="showNewBrokerDialog"/>
      <BrokersList
        :brokerID="brokerID"
        :data="records"
        @delete="removeBroker"/>
    </Leftbar>

    <EmptyPage
      v-if="isEmpty && !isClientPage"
      name="brokers"
      :btn-title="$t('brokers.newBroker')"
      :click-method="showNewBrokerDialog"/>
    <div v-else class="brokers-view right-content" :style="{
      paddingTop: brokerViewTop,
    }">
      <ClientDetail v-if="isClientPage" :broker="currentBroker"/>
      <BrokerContent
        v-else
        :record="currentBroker"
        :clients="currentClients"
        @edit="showNewBrokerDialog(true)"
        @deleteBroker="removeBroker"
        @deleteClient="loadClients"/>
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
        <!-- <el-form-item label="Path" prop="path">
          <el-input v-model="record.path"></el-input>
        </el-form-item> -->
        <el-form-item label="SSL/TLS" prop="tls">
          <el-radio-group v-model="record.tls" @change="handleSSL">
            <el-radio :label="false">false</el-radio>
            <el-radio :label="true">true</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('brokers.certType')" prop="certType" v-if="record.tls">
          <el-radio-group v-model="record.certType">
            <el-radio label="ca">CA signed</el-radio>
            <el-radio label="self">Self signed</el-radio>
          </el-radio-group>
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
import ClientDetail from './clients/ClientDetail.vue'
import EmptyPage from '@/components/EmptyPage.vue'
import matchSearch from '@/utils/matchSearch'
import {
  loadBrokers, loadBroker, createBroker, updateBroker, loadClients, deleteBroker,
} from '@/utils/api/broker'
import { BrokerModel, ClientModel } from './types'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    BrokersList,
    MyDialog,
    BrokerContent,
    ClientDetail,
    EmptyPage,
  },
})
export default class Brokers extends Vue {
  private searchLoading: boolean = false
  private isEmpty: boolean = false
  private newBrokerDialogVisible: boolean = false
  private newBrokerConfirmLoading: boolean = false
  private isEdit: boolean = false

  private records: BrokerModel[] = []

  private record: BrokerModel = {
    brokerName: '',
    brokerAddress: 'broker.emqx.io',
    brokerPort: 1883,
    path: '/mqtt',
    tls: false,
    certType: undefined,
  }

  private currentClients: ClientModel[] = []

  private currentBroker: BrokerModel = {
    id: '',
    brokerName: '',
    brokerAddress: '',
    brokerPort: 1883,
    path: '/mqtt',
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

  get brokerViewTop(): string {
    if (this.$store.state.app.MacOSTop === '24px') {
      return '114px'
    }
    return '90px'
  }

  get rules(): any {
    return {
      brokerName: [{ required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      brokerAddress: [{ required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      brokerPort: [{ type: 'number', required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
      // path: [{ required: true, trigger: 'change', message: this.$t('common.inputRequired') }],
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
    const brokers: BrokerModel[] | [] = await loadBrokers()
    this.records = brokers
    if (reload && this.records.length) {
      this.$router.push({ path: `/brokers/${this.records[0].id}` })
    }
    if (this.records.length) {
      this.loadDetail()
      this.isEmpty = false
      this.loadClients()
    } else {
      this.isEmpty = true
    }
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
      brokerPort: 1883,
      path: '/mqtt',
      tls: false,
      certType: undefined,
    }
    this.vueForm.clearValidate()
    this.vueForm.resetFields()
  }

  private removeBroker(row: BrokerModel) {
    const confirmDelete: string = this.$t('common.confirmDelete', { name: row.brokerName }) as string
    this.$confirm(confirmDelete, this.$t('common.warning') as string, {
      type: 'warning',
    }).then(async () => {
      const res: BrokerModel | null = await deleteBroker(row.id as string)
      if (res) {
        this.$message({
          type: 'success',
          message: this.$t('common.deleteSuccess') as string,
        })
        this.loadData(true)
      }
    }).catch((error) => {
      // ignore(error)
    })
  }

  private showNewBrokerDialog(isEdit: boolean = false): void {
    this.isEdit = isEdit
    this.newBrokerDialogVisible = true
    if (isEdit) {
      this.record = { ...this.currentBroker }
    }
  }

  private async searchBroker(val: string): Promise<void> {
    this.searchLoading = true
    const data: BrokerModel[] = await loadBrokers()
    if (data) {
      setTimeout(async () => {
        const res: BrokerModel[] | null = await matchSearch(data, 'brokerName', val)
        if (res) {
          this.records = res
          this.searchLoading = false
        }
      }, 500)
    } else {
      this.searchLoading = false
    }
  }

  private handleSSL(val: boolean): void {
    if (val) {
      this.record.brokerPort = 8883
    } else {
      this.record.brokerPort = 1883
    }
  }

  private created(): void {
    this.loadData()
  }
}
</script>


<style lang="scss" scoped>
.brokers-view {
  padding: 0px 16px 16px 16px;
}
</style>
