<template>
  <div class="connections">
    <div class="left-list">
      <ConnectionsList :ConnectionModelData="records" @delete="onDelete" />
    </div>
    <div class="connections-view">
      <template v-if="isLoadingData">
        <el-skeleton class="connection-skeleton-page" :row="8" animated />
      </template>
      <template v-else>
        <EmptyPage
          v-if="isEmpty && !oper"
          name="connections.svg"
          :btn-title="$t('connections.newConnections')"
          :click-method="toCreateConnection"
        />
        <template v-else>
          <ConnectionForm v-if="oper" ref="connectionForm" :oper="oper" @connect="onConnect" />
          <ConnectionsDetail
            v-show="!oper"
            ref="connectionsDetail"
            :record="currentConnection"
            @reload="loadData"
            @delete="loadData(true, true)"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Action } from 'vuex-class'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsDetail from './ConnectionsDetail.vue'
import ConnectionForm from './ConnectionForm.vue'
import useServices from '@/database/useServices'

@Component({
  components: {
    ConnectionsList,
    ConnectionsDetail,
    ConnectionForm,
    EmptyPage,
  },
})
export default class Connections extends Vue {
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('CHANGE_ALL_CONNECTIONS') private changeAllConnections!: (payload: {
    allConnections: ConnectionModel[] | []
  }) => void

  private isEmpty: boolean = false
  private isLoadingData: boolean = false
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
    ca: '',
    cert: '',
    key: '',
    isCollection: false,
    parentId: null,
  }

  @Watch('$route.params.id')
  private handleIdChanged(val: string) {
    const connectionsDetailRef: ConnectionsDetail = this.$refs.connectionsDetail as ConnectionsDetail
    if (connectionsDetailRef) {
      connectionsDetailRef.stopTimedSend()
    }
    if (val === '0' || val === undefined) {
      return
    }
    const isFirstLoad = this.isEmpty && val !== '0'
    this.loadData(false, isFirstLoad)
  }

  @Watch('oper')
  private handleOperChange(val: string | undefined) {
    if (val === undefined) {
      setTimeout(() => {
        const connectionsDetailRef: ConnectionsDetail | undefined = this.$refs.connectionsDetail as ConnectionsDetail
        if (connectionsDetailRef !== undefined) {
          connectionsDetailRef.setMessageListHeight()
        }
      }, 500)
    }
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
    const { connectionService } = useServices()
    const res: ConnectionModel | undefined = await connectionService.get(id)
    if (res) {
      this.currentConnection = res
    }
  }

  private async loadData(loadingLeatest: boolean = false, firstLoad: boolean = false): Promise<void> {
    if (firstLoad) {
      this.isLoadingData = true
    }
    const { connectionService } = useServices()
    const connections: ConnectionModel[] | [] = (await connectionService.getAll()) ?? []
    this.changeAllConnections({ allConnections: connections })
    this.records = connections
    this.isLoadingData = false
    if (connections.length && loadingLeatest) {
      const leatestId = await connectionService.getLeatestId()
      this.$router.push({ path: `/recent_connections/${leatestId}` })
    }
    if (connections.length && this.connectionId !== 'create') {
      this.isEmpty = false
      await this.loadDetail(this.connectionId)
    } else {
      this.isEmpty = true
    }
  }

  private toCreateConnection() {
    this.$router.push({ path: '/recent_connections/0?oper=create' })
  }

  private onConnect() {
    this.isEmpty = false
    this.loadData()
    setTimeout(() => {
      const connectionsDetailRef = this.$refs.connectionsDetail as ConnectionsDetail
      connectionsDetailRef.connect()
    }, 500)
  }

  private onDelete(data: ConnectionModel) {
    const connectionsDetailRef = this.$refs.connectionsDetail as ConnectionsDetail
    connectionsDetailRef.removeConnection(data)
  }

  private created() {
    this.loadData(false, true)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/connections.scss';
</style>
