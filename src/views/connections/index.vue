<template>
  <div>
    <leftbar>
      <SearchTopbar @showNewDialog="showNewConnectionDialog"/>
      <ConnectionsList :data="records" :connectionId="connectionId"/>
    </leftbar>

    <div class="connections-view">
      <EmptyPage
        v-if="!records.length"
        name="connections"
        :btn-title="$t('connections.newConnections')"
        :click-method="showNewConnectionDialog"/>
      <template v-else>
        <ConnectionsContent
          :record="currentConnection"
          @reload="loadData"
          @click-subs="setSubsVisible"
          @delete="loadData(true)"/>
      </template>
    </div>

    <SubscriptionsList
      ref="subscriptionsList"
      :subs-visible.sync="showSubs"
      :connectionId="connectionId"
      :record="currentConnection"/>

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
        <el-form-item :label="$t('brokers.client')" prop="selector">
          <router-link class="new-broker" to="/brokers">{{ $t('brokers.newBroker') }}</router-link>
          <el-cascader
            clearable
            v-model="record.selector"
            :options="clientOptions">
          </el-cascader>
        </el-form-item>
      </el-form>
    </my-dialog>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { loadConnections, createConnections, loadConnection } from '@/utils/api/connection'
import { loadClientOptions, createClient, loadBroker, loadClient } from '@/utils/api/broker'
import MyDialog from '@/components/MyDialog.vue'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsContent from './ConnectionsContent.vue'
import SubscriptionsList from './SubscriptionsList.vue'
import { ConnectionModel } from './types'
import { BrokerModel, ClientModel } from '../brokers/types'

interface RecordModel {
  selector: [string, string] | []
}

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
  private currentConnection: ConnectionModel = {
    clientuuid: '',
    brokeruuid: '',
    clientId: '',
    name: '',
    clean: false,
    host: '',
    keepalive: 60,
    connectTimeout: 4000,
    messages: [],
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    ssl: false,
    subscriptions: [],
    unreadMessageCount: 0,
    client: {
      connected: false,
    },
  }
  private record: RecordModel = {
    selector: [],
  }
  private data: ConnectionModel = {
    clientuuid: '',
    brokeruuid: '',
    clientId: '',
    name: '',
    clean: false,
    host: '',
    keepalive: 60,
    connectTimeout: 4000,
    messages: [],
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    ssl: false,
    subscriptions: [],
    unreadMessageCount: 0,
    client: {
      connected: false,
    },
  }

  @Watch('$route.params.id')
  private handleIdChanged(val: string) {
    this.loadDetail(val)
  }

  get connectionId(): string {
    return this.$route.params.id
  }

  get clientOptions(): Options[] {
    return loadClientOptions()
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  get rules() {
    return {
      selector: [{ required: true, trigger: 'change', message: this.$t('common.selectRequired') }],
    }
  }

  private setSubsVisible(): void {
    this.showSubs = !this.showSubs
  }

  private async loadDetail(id: string): Promise<void> {
    const res: ConnectionModel | null = await loadConnection(id)
    if (res) {
      this.currentConnection = res
    }
  }

  private async loadData(reload: boolean = false): Promise<void> {
    const connections: ConnectionModel[] | [] = await loadConnections()
    this.records = connections
    if (reload && connections.length) {
      this.$router.push({ path: `/recent_connections/${connections[0].id}` })
    }
    if (connections.length) {
      this.loadDetail(this.connectionId)
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
      const [brokeruuid, clientuuid] = this.record.selector
      if (brokeruuid && clientuuid) {
        let brokerData = {}
        let clientData = {}
        const broker: BrokerModel | null = await loadBroker(brokeruuid)
        if (broker) {
          brokerData = {
            brokeruuid: broker.id,
            host: broker.brokerAddress,
            port: broker.brokerPort,
            ssl: broker.tls,
          }
        }
        const client: ClientModel | null = await loadClient(clientuuid)
        if (client) {
          clientData = {
            clientuuid: client.id,
            name: client.clientName,
            clientId: client.clientId,
            username: client.username || '',
            password: client.password || '',
            keepalive: client.keepAlive || 60,
            connectTimeout: client.connectionTimeout || 4000,
            clean: client.cleanSession,
          }
        }
        const data = {
          ...brokerData,
          ...clientData,
        }
        Object.assign(this.data, data)
        const res: ConnectionModel | null = await createConnections(this.data)
        const faild = this.$t('common.createfailed') as string
        if (res) {
          this.newConnectionDialogVisible = false
          this.resetConnction()
          this.loadData()
          this.$router.push(`/recent_connections/${res.id}`)
        } else {
          this.$message.error(faild)
        }
      }
    })
  }

  private resetConnction(): void {
    this.data = {
      clientuuid: '',
      brokeruuid: '',
      clientId: '',
      name: '',
      clean: false,
      host: '',
      connectTimeout: 4000,
      keepalive: 60,
      messages: [],
      username: '',
      password: '',
      path: '/mqtt',
      port: 1883,
      ssl: false,
      subscriptions: [],
      unreadMessageCount: 0,
      client: {
        connected: false,
      },
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
