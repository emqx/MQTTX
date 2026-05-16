<template>
  <div class="connections">
    <transition name="slide">
      <div v-show="showConnectionList" class="left-list">
        <h1 class="titlebar">{{ $t('connections.connections') }}</h1>
        <ConnectionsList :data="records" :connectionId="connectionId" @delete="onDelete" />
      </div>
    </transition>

    <el-tooltip
      placement="bottom"
      :effect="theme !== 'light' ? 'light' : 'dark'"
      :open-delay="500"
      :content="showConnectionList ? $t('connections.hideConnections') : $t('connections.showConnections')"
    >
      <a
        href="javascript:;"
        :class="['toggle-list-btn', 'collapse-btn', showConnectionList ? 'top' : 'bottom']"
        @click="
          toggleShowConnectionList({
            showConnectionList: !showConnectionList,
          })
        "
      >
        <i class="el-icon-d-arrow-left"></i>
      </a>
    </el-tooltip>

    <div :class="['connections-view', { 'is-list-hidden': !showConnectionList }]">
      <EmptyPage
        v-if="isEmpty && !oper"
        name="connections"
        :btn-title="$t('connections.newConnections')"
        :click-method="toCreateConnection"
      />
      <template v-else>
        <ConnectionForm v-if="oper" ref="connectionForm" :oper="oper" @connect="onConnect" @refresh="loadData" />
        <ConnectionsDetail
          v-show="!oper"
          ref="ConnectionsDetail"
          :record="currentConnection"
          @reload="loadData"
          @delete="loadData(true)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import { loadConnections, loadConnection } from '@/utils/api/connection'
import EmptyPage from '@/components/EmptyPage.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsDetail from './ConnectionsDetail.vue'
import ConnectionForm from './ConnectionForm.vue'
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
  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('CHANGE_ALL_CONNECTIONS') private changeAllConnections!: (payload: {
    allConnections: ConnectionModel[] | []
  }) => void
  @Action('TOGGLE_SHOW_CONNECTION_LIST') private toggleShowConnectionList!: (payload: {
    showConnectionList: boolean
  }) => void

  @Getter('currentTheme') private theme!: Theme
  @Getter('showConnectionList') private showConnectionList!: boolean

  private isEmpty: boolean = false
  private records: ConnectionModel[] | [] = []
  private currentConnection: ConnectionModel = { ...getDefaultRecord() }

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

  private async loadData(loadLatest: boolean = false, _firstLoad: boolean = false, callback?: () => {}): Promise<void> {
    const connections: ConnectionModel[] | [] = await loadConnections()
    this.changeAllConnections({ allConnections: connections })
    this.records = connections
    if (loadLatest && connections.length) {
      // TODO: load latest connection
      this.$router.push({ path: `/recent_connections/${connections[0].id}` })
    }
    if (connections.length && this.connectionId !== 'create') {
      this.loadDetail(this.connectionId)
      this.isEmpty = false
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

  private onConnect() {
    this.loadData()
    setTimeout(() => {
      const connection: ConnectionsDetail = this.$refs.ConnectionsDetail as ConnectionsDetail
      connection.connect()
    }, 500)
  }

  private onDelete(data: ConnectionModel) {
    const connection: ConnectionsDetail = this.$refs.ConnectionsDetail as ConnectionsDetail
    connection.removeConnection(data)
  }

  private created() {
    this.loadData()
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

$collapse-ease: cubic-bezier(0.4, 0, 0.2, 1);
$collapse-duration: 0.3s;

.connections {
  .titlebar {
    padding: 16px;
  }
  a.toggle-list-btn {
    position: fixed;
    top: 21px;
    left: 369px;
    z-index: 1001;
    font-size: 18px;
    line-height: 1;
    transition: left $collapse-duration $collapse-ease, transform $collapse-duration $collapse-ease;
    @media (min-width: 1920px) {
      left: 489px;
    }
  }
  @include collapse-btn-transform(0deg, 180deg);
  .connections-view {
    .right-topbar {
      transition: left $collapse-duration $collapse-ease;
    }
    .connections-detail-main {
      transition: margin-left $collapse-duration $collapse-ease, padding-top 0.3s;
    }
    .connections-detail-main .connections-body .filter-bar {
      transition: left $collapse-duration $collapse-ease;
    }
    .connections-footer {
      transition: margin-left $collapse-duration $collapse-ease;
    }
    .left-panel > div {
      transition: left $collapse-duration $collapse-ease;
    }
  }
  .connections-view.is-list-hidden {
    .right-topbar,
    .connections-detail-main .connections-body .filter-bar,
    .left-panel > div {
      left: 76px;
    }
    .right-content {
      margin-left: 76px;
    }
    .right-topbar .topbar .connection-head {
      padding-left: 32px;
    }
    @media (min-width: 1920px) {
      .right-topbar,
      .connections-detail-main .connections-body .filter-bar,
      .left-panel > div {
        left: 116px;
      }
      .right-content {
        margin-left: 116px;
      }
    }
  }
}
.connections a.toggle-list-btn.bottom {
  left: 92px;
  @media (min-width: 1920px) {
    left: 132px;
  }
}
.left-list {
  position: fixed;
  box-shadow: 1px 0px 8px 0px var(--color-shadow-leftlist);
  width: 320px;
  left: 76px;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1000;
  border-right: 1px solid var(--color-border-default);
  background-color: var(--color-bg-normal);
  @media (min-width: 1920px) {
    left: 116px;
    width: 400px;
  }
  .no-data {
    text-align: center;
    position: absolute;
    top: 45%;
    left: 40%;
    color: var(--color-text-light);
  }
}
.slide-enter-active,
.slide-leave-active {
  transition: transform $collapse-duration $collapse-ease, opacity $collapse-duration $collapse-ease;
}
.slide-enter,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
