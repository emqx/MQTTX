<template>
  <div class="window connections">
    <div class="left-list">
      <ConnectionsList :ConnectionModelData="records" :connectionId="connectionId" />
    </div>
    <div class="connections-view">
      <ConnectionsDetail ref="ConnectionsDetail" :record="currentConnection" @reload="loadDetail(connectionId, true)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { loadConnection } from '@/api/connection'
import { ConnectionModel } from '../connections/types'
import ConnectionsDetail from '../connections/ConnectionsDetail.vue'
import ConnectionsList from '../connections/ConnectionsList.vue'

@Component({
  components: {
    ConnectionsDetail,
    ConnectionsList,
  },
})
export default class Window extends Vue {
  private records: ConnectionModel[] = []
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
    isCollection: false,
    collectionId: null,
  }

  get connectionId(): string {
    return this.$route.params.id
  }

  private async loadDetail(id: string, reload?: boolean): Promise<void> {
    const res: ConnectionModel | null = await loadConnection(id)
    if (res) {
      this.currentConnection = res
      if (!reload) {
        this.records.push(this.currentConnection)
      }
    }
  }

  created() {
    this.loadDetail(this.connectionId)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/connections.scss';
</style>
