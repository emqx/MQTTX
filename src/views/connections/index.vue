<template>
  <div>
    <leftbar>
      <SearchTopbar @showNewDialog="showNewConnectionDialog"/>
      <ConnectionsList :data="records"/>
    </leftbar>

    <div class="connections-view">
      <EmptyPage
        v-if="!records.length"
        name="connections"
        :btn-title="$t('connections.newConnections')"
        :click-method="showNewConnectionDialog"/>
      <template v-else>
        <ConnectionsContent @click-subs="setSubsVisible"/>
      </template>
    </div>

    <SubscriptionsList
      ref="subscriptionsList"
      :subs-visible.sync="showSubs"/>

    <!-- New connection dialog -->
    <my-dialog
      :title="$t('connections.newConnection')"
      :confirmLoading="newConnectionConfirmLoading"
      :visible.sync="newConnectionDialogVisible"
      @confirm="saveConnection"
      @close="resetConnction">
      <el-form
        ref="form"
        label-position="top"
        :model="record"
        :rules="rules">
        <el-form-item :label="$t('brokers.client')" prop="clientuuid">
          <router-link class="new-broker" to="/brokers">{{ $t('brokers.newBroker') }}</router-link>
          <el-cascader
            clearable
            v-model="record.clientuuid"
            :options="clientOptions">
          </el-cascader>
        </el-form-item>
      </el-form>
    </my-dialog>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { loadConnections, createConnections } from '@/utils/api/connection'
import { loadClientOptions, createClient } from '@/utils/api/broker'
import MyDialog from '@/components/MyDialog.vue'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsContent from './ConnectionsContent.vue'
import SubscriptionsList from './SubscriptionsList.vue'
import { ConnectionModel } from './types'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    ConnectionsList,
    ConnectionsContent,
    SubscriptionsList,
    EmptyPage,
    MyDialog,
  },
})
export default class Connections extends Vue {
  private newConnectionConfirmLoading: boolean = false
  private newConnectionDialogVisible: boolean = false
  private showSubs: boolean = false
  private records: ConnectionModel[] | [] = []
  private record: ConnectionModel = {
    clientuuid: '',
    brokeruuid: '',
    connected: false,
  }

  get clientOptions(): Options[] {
    return loadClientOptions()
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  get rules() {
    return {
      clientuuid: [{ required: true, trigger: 'change', message: this.$t('common.selectRequired') }],
    }
  }

  private setSubsVisible(): void {
    this.showSubs = !this.showSubs
  }

  private async loadData(): Promise<void> {
    const connections: ConnectionModel[] | [] = await loadConnections()
    if (connections.length) {
      this.records = connections
    }
  }

  private showNewConnectionDialog(): void {
    this.newConnectionDialogVisible = true
  }

  private saveConnection(): void {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const [brokeruuid, clientuuid] = this.record.clientuuid
      const { connected } = this.record
      const data: ConnectionModel = {
        brokeruuid,
        clientuuid,
        connected,
      }
      const res: ConnectionModel | null = await createConnections(data)
      const faild = this.$t('common.createfailed') as string
      if (res) {
        this.newConnectionDialogVisible = false
        this.resetConnction()
        this.loadData()
        this.$router.push(`/recent_connections/${res.id}`)
      } else {
        this.$message.error(faild)
      }
    })
  }

  private resetConnction(): void {
    this.record = {
      clientuuid: '',
      brokeruuid: '',
      connected: false,
    }
    this.vueForm.clearValidate()
    this.vueForm.resetFields()
  }

  private created(): void {
    this.loadData()
  }
}
</script>


<style lang="scss">
.new-broker {
  position: absolute;
  top: -50px;
  right: 0;
}
</style>
