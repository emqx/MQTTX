<template>
  <div class="connections">
    <left-list>
      <h1 class="titlebar">{{ $t('connections.connections') }}</h1>
      <ConnectionsList :data="records" :connectionId="connectionId"/>
    </left-list>

    <div class="connections-view">
      <EmptyPage
        v-if="isEmpty && !oper"
        name="connections"
        :btn-title="$t('connections.newConnections')"
        :click-method="toCreateConnection"/>
      <template v-else>
        <ConnectionForm
          v-if="oper"
          :oper="oper"/>
        <ConnectionsContent
          v-else
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
import LeftList from '@/components/LeftList.vue'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsContent from './ConnectionsContent.vue'
import ConnectionForm from './ConnectionForm.vue'
import { ConnectionModel } from './types'

@Component({
  components: {
    LeftList,
    ConnectionsList,
    ConnectionsContent,
    ConnectionForm,
    EmptyPage,
  },
})
export default class Connections extends Vue {
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (
    payload: Client,
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
    console.log(this.$route.query.oper)
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

  private toCreateConnection(): void {
    this.$router.push({ path: '/recent_connections/0?oper=create' })
  }

  private created(): void {
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
</style>
