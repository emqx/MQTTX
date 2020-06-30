<template>
  <div class="connections">
    <div class="leftList">
      <h1 class="titlebar">{{ $t('connections.connections') }}</h1>
      <ConnectionsList :data="records" :connectionId="connectionId"/>
    </div>

    <div class="connections-view">
      <EmptyPage
        v-if="isEmpty && !oper"
        name="connections"
        :btn-title="$t('connections.newConnections')"
        :click-method="toCreateConnection"/>
      <template v-else>
        <ConnectionForm
          v-if="oper"
          ref="connectionForm"
          :oper="oper"
          @connect="handleConnect"/>
        <ConnectionsDetail
          v-else
          ref="ConnectionsDetail"
          :record="currentConnection"
          @reload="loadData"
          @delete="loadData(true)"/>
      </template>
    </div>

  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Action } from 'vuex-class'
import { loadConnections, loadConnection } from '@/utils/api/connection'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsDetail from './ConnectionsDetail.vue'
import ConnectionForm from './ConnectionForm.vue'
import { ConnectionModel } from './types'

@Component({
  components: {
    ConnectionsList,
    ConnectionsDetail,
    ConnectionForm,
    EmptyPage,
  },
})
export default class Connections extends Vue {
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (
    payload: Client,
  ) => void
  @Action('CHANGE_ALL_CONNECTIONS') private changeAllConnections!: (
    payload: { allConnections: ConnectionModel[] | [] },
  ) => void

  private isEmpty: boolean = false
  private records: ConnectionModel[] | [] = []
  private currentConnection: ConnectionModel = {
    clientId: '',
    name: '',
    clean: false,
    host: '',
    keepalive: 60,
    connectTimeout: 4000,
    reconnect: true,
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    certType: '',
    ssl: false,
    mqttVersion: '3.1.1',
    subscriptions: [],
    messages: [],
    unreadMessageCount: 0,
    client: {
      connected: false,
    },
    ca: '',
    cert: '',
    key: '',
  }

  @Watch('$route.params.id')
  private handleIdChanged(val: string) {
    this.loadData()
  }

  get oper(): string | Array<string | null> {
    return this.$route.query.oper
  }

  get connectionId(): string {
    return this.$route.params.id
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private async loadDetail(id: string): Promise<void> {
    const res: ConnectionModel | null = await loadConnection(id)
    if (res) {
      this.currentConnection = res
    }
  }

  private async loadData(reload: boolean = false): Promise<void> {
    const connections: ConnectionModel[] | [] = await loadConnections()
    this.changeAllConnections({ allConnections: connections })
    this.records = connections
    if (reload && connections.length) {
      this.$router.push({ path: `/recent_connections/${connections[0].id}` })
    }
    if (connections.length && this.connectionId !== 'create') {
      this.loadDetail(this.connectionId)
      this.isEmpty = false
    } else {
      this.isEmpty = true
    }
  }

  private toCreateConnection() {
    this.$router.push({ path: '/recent_connections/0?oper=create' })
  }

  private handleConnect() {
    this.loadData()
    setTimeout(() => {
      const connection: ConnectionsDetail = this.$refs.ConnectionsDetail as ConnectionsDetail
      connection.connect()
    }, 500)
  }

  private created() {
    this.loadData()
  }
}
</script>


<style lang="scss">
.connections {
  .titlebar {
    padding: 16px;
  }
}
.leftList {
  position: fixed;
  width: 260px;
  left: 81px;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1000;
  border-right: 1px solid var(--color-border-default);
  background-color: var(--color-bg-primary);
  .no-data {
    text-align: center;
    position: absolute;
    top: 45%;
    left: 40%;
    color: var(--color-text-light);
  }
}
</style>
