<template>
  <div class="connections">
    <transition name="slide">
      <div v-show="showConnectionList" class="left-list">
        <ConnectionsList ref="connectionList" @delete="onDelete" @reload="loadData(true, false)" />
      </div>
    </transition>
    <div class="connections-view">
      <template v-if="isLoadingData">
        <el-skeleton
          class="connection-skeleton-page"
          :row="8"
          animated
          :style="{
            marginLeft: showConnectionList ? '370px' : '96px',
          }"
        />
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
import { Action, Getter } from 'vuex-class'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsDetail from './ConnectionsDetail.vue'
import ConnectionForm from './ConnectionForm.vue'
import useServices from '@/database/useServices'
import { getDefaultRecord } from '@/utils/mqttUtils'

@Component({
  components: {
    ConnectionsList,
    ConnectionsDetail,
    ConnectionForm,
    EmptyPage,
  },
})
export default class Connections extends Vue {
  @Getter('showConnectionList') private showConnectionList!: boolean

  @Action('SET_CURRENT_CONNECTION_ID') private setCurrentConnectionId!: (id: string) => void

  private isEmpty: boolean = false
  private isLoadingData: boolean = false
  private currentConnection: ConnectionModel = { ...getDefaultRecord() }

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

  private async loadDetail(id: string): Promise<void> {
    // Connection ID only needs to be set for non-new connections.
    if (id !== '0') {
      this.setCurrentConnectionId(id)
    }
    const { connectionService } = useServices()
    const res = await connectionService.get(id)
    if (res) {
      this.currentConnection = res
    }
  }

  private async loadData(loadLatest: boolean = false, firstLoad: boolean = false, callback?: () => {}): Promise<void> {
    if (firstLoad) {
      this.isLoadingData = true
    }
    const { connectionService } = useServices()
    const connections: ConnectionModel[] | [] = (await connectionService.getAll()) ?? []
    this.refreshConnectionList()
    this.isLoadingData = false
    if (connections.length && loadLatest) {
      const leatestId = await connectionService.getLeatestId()
      this.$router.push({ path: `/recent_connections/${leatestId}` })
    }
    if (connections.length && this.connectionId !== 'create') {
      this.isEmpty = false
      await this.loadDetail(this.connectionId)
    } else {
      if (this.oper === 'edit') {
        this.$router.push({ path: '/recent_connections' })
      }
      this.isEmpty = true
    }
    callback && callback()
  }

  private toCreateConnection() {
    this.$router.push({ path: '/recent_connections/0?oper=create' })
  }

  private async onConnect() {
    this.isEmpty = false
    await this.loadData()
    setTimeout(() => {
      const connectionsDetailRef = this.$refs.connectionsDetail as ConnectionsDetail
      connectionsDetailRef.connect()
    }, 500)
  }

  private onDelete(data: ConnectionModel) {
    const connectionsDetailRef = this.$refs.connectionsDetail as ConnectionsDetail
    connectionsDetailRef.removeConnection(data)
  }

  private refreshConnectionList(firstLoad = false) {
    const connectionListRef = this.$refs.connectionList as ConnectionsList
    connectionListRef.loadData(firstLoad)
  }

  private created() {
    this.loadData(false, true)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/connections.scss';
</style>
