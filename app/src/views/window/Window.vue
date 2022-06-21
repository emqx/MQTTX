<template>
  <div class="window connections">
    <div class="left-list">
      <ConnectionsList :ConnectionModelData="records" :connectionId="connectionId" />
    </div>
    <div class="connections-view">
      <ConnectionsDetail ref="ConnectionsDetail" :record="currentConnection" @reload="handleReload" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConnectionsDetail from '@/views/connections/ConnectionsDetail.vue'
import ConnectionsList from '@/views/connections/ConnectionsList.vue'
import useServices from '@/database/useServices'
import { getDefaultRecord } from '@/utils/mqttUtils'

@Component({
  components: {
    ConnectionsDetail,
    ConnectionsList,
  },
})
export default class Window extends Vue {
  private records: ConnectionModel[] = []
  private currentConnection: ConnectionModel = { ...getDefaultRecord() }

  get connectionId(): string {
    return this.$route.params.id
  }

  private handleReload(loadLatest: boolean, firstLoad: boolean, callback?: () => {}) {
    this.loadDetail(this.connectionId, true, callback)
  }

  private async loadDetail(id: string, reload?: boolean, callback?: () => {}): Promise<void> {
    const { connectionService } = useServices()
    const res: ConnectionModel | undefined = await connectionService.get(id)

    if (res) {
      this.currentConnection = res
      if (!reload) {
        this.records.push(this.currentConnection)
      }
    }
    callback && callback()
  }

  created() {
    this.loadDetail(this.connectionId)
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/connections.scss';
</style>
