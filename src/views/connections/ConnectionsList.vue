<template>
  <div class="connection-container">
    <div class="connection-topbar">
      <h1 class="connection-titlebar">{{ $t('connections.connections') }}</h1>
      <div>
        <el-button @click="loadData">test</el-button>
        <!-- topbar left icon -->
      </div>
      <div class="connection-tailbar">
        <el-tooltip
          placement="bottom"
          :effect="theme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="$t('connections.newFolder')"
        >
          <a class="new-folder-btn" href="javascript:;">
            <i class="el-icon-folder-add"></i>
          </a>
        </el-tooltip>
        <el-tooltip
          placement="bottom"
          :effect="theme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="$t('connections.collapseFolder')"
        >
          <a class="collapse-folder-btn" href="javascript:;" @click="handleCollapseFolder">
            <i class="el-icon-s-fold"></i>
          </a>
        </el-tooltip>
      </div>
    </div>
    <div class="connections-list">
      <template>
        <!-- TOOD: 规定不能移动连接节电含有子节点 -->
        <el-tree
          ref="tree"
          :data="treeData"
          node-key="id"
          draggable
          highlight-current
          :current-node-key="connectionId"
          :allow-drop="allowDrop"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <!-- connection -->
            <div
              class="connection-item"
              v-if="data.host"
              @click="handleSelectConnection(data)"
              @contextmenu="handleContextMenu(data, $event)"
            >
              <div class="item-left">
                <div
                  :class="[
                    'connection-status',
                    {
                      online: activeConnection[data.id] ? activeConnection[data.id].client.connected : false,
                    },
                  ]"
                ></div>
                <div class="client-info">
                  <el-tooltip
                    :effect="theme !== 'light' ? 'light' : 'dark'"
                    :content="`${data.name}@${data.host}:${data.port}`"
                    :open-delay="500"
                    placement="top"
                  >
                    <div class="client-name">{{ data.name }}@{{ data.host }}:{{ data.port }}</div>
                  </el-tooltip>
                </div>
              </div>
              <div v-if="data.ssl" class="ssl-tag">
                <div>SSL</div>
              </div>
              <div v-if="unreadMessageCount[data.id] > 0" class="new-msg-count">
                {{ unreadMessageCount[data.id] }}
              </div>
            </div>
            <!-- folder -->
            <div class="custom-tree-node-folder" v-else>
              <div>{{ data.name }}</div>
            </div>
          </span>
        </el-tree>
      </template>
      <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleNewWindow">
          <i class="el-icon-monitor"></i>{{ $t('common.newWindow') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDelete">
          <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
        </a>
      </contextmenu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import Contextmenu from '@/components/Contextmenu.vue'
import { ConnectionModel, ContextmenuModel, ConnectionModelFolder, ConnectionModelTree } from './types'
import { ipcRenderer } from 'electron'
import { TreeNode } from 'element-ui/types/tree'
import { nextTick } from 'process'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public ConnectionModelData!: ConnectionModel[] | []
  @Prop({ required: true }) public ModelFolderData!: ConnectionModelFolder[] | []
  // @Prop({ required: false }) public treeData!: ConnectionModelTree[] | []
  @Prop({ required: true }) public connectionId!: string

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme
  // @Getter('connectionCollection') private getConnectionCollection!: ConnectionModelFolder[]|[]

  private showContextmenu: boolean = false
  private selectedConnection: ConnectionModel | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private treeData: ConnectionModelTree[] | [] = []

  @Watch('showContextmenu')
  private handleShowContextmenuChange(val: boolean) {
    if (!val) {
      this.selectedConnection = null
    }
  }
  @Watch('treeData')
  private handleTreeDataChange(val: ConnectionModelTree[] | []) {
    console.log('watch')

    if (!val) {
      this.treeData = val
    }
  }

  private allowDrop(
    draggingNode: TreeNode<ConnectionModelFolder['id'], ConnectionModelFolder>,
    dropNode: TreeNode<ConnectionModelFolder['id'], ConnectionModelFolder>,
    type: 'prev' | 'inner' | 'next',
  ) {
    if (!dropNode.data.isFolder) {
      // drag node to connction is not allowed
      return type !== 'inner'
    }
    return true
  }

  get listdata(): ConnectionModelTree[] | [] {
    //TODO: sort
    return []
  }

  private created() {
    this.$nextTick(() => {
      this.loadData()
      this.$forceUpdate()
    })
  }

  private loadData() {
    const connections: ConnectionModel[] = this.ConnectionModelData
    const folders: ConnectionModelFolder[] = this.ModelFolderData
    let treeData: ConnectionModelTree[] = []
    if (!folders || (folders && !folders.length)) {
      treeData = [...connections]
      return
    }
    treeData = [...folders]
    connections.forEach((connection: ConnectionModel) => {
      const curConnectionFolderId = connection.folderId
      if (curConnectionFolderId) {
        // current connection in a collection
        const findCollection = (treeElement: ConnectionModelTree[], connection: ConnectionModel) => {
          treeElement.forEach((e: ConnectionModelTree) => {
            if (e.isFolder) {
              const children = e.children as ConnectionModelTree[]
              if (e.id === curConnectionFolderId) {
                // found cur connection's collection
                children.push(connection)
                return
              } else {
                if (!children.length) {
                  return
                }
                findCollection(e.children, connection)
              }
            }
          })
        }
        findCollection(treeData, connection)
      } else {
        // current connection not in any connection
        treeData.push(connection)
      }
    })
    this.treeData = treeData
    console.log(treeData)
    console.log('loaddata')
  }

  private handleCollapseFolder() {
    const treeRef = this.$refs.tree as $TSFixed
    if (!treeRef) return
    const nodes = treeRef.store.nodesMap
    for (const idx in nodes) {
      nodes[idx].expanded = false
    }
  }

  private handleSelectConnection(row: ConnectionModel) {
    this.initUnreadMessageCount(row.id as string)
    if (this.$route.name === 'newWindow') {
      return
    }
    this.$router.push({ path: `/recent_connections/${row.id}` })
  }

  private initUnreadMessageCount(id: string) {
    this.unreadMessageIncrement({ id, unreadMessageCount: 0 })
  }

  private handleContextMenu(row: ConnectionModel, event: MouseEvent) {
    if (this.$route.name === 'newWindow') {
      return
    }
    if (!this.showContextmenu) {
      const { clientX, clientY } = event
      this.contextmenuConfig.top = clientY
      this.contextmenuConfig.left = clientX
      this.showContextmenu = true
      this.selectedConnection = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleDelete() {
    this.$emit('delete', this.selectedConnection)
  }

  private handleNewWindow() {
    if (this.selectedConnection) {
      ipcRenderer.send('newWindow', this.selectedConnection.id)
      this.showContextmenu = false
    }
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';
.connection-container {
  height: 100%;
  width: 100%;
  .connections-list {
    .el-tree-node__content {
      height: 100%;
      .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .connection-item {
          @include flex-space-between;
          height: 64px;
          width: 100%;
          cursor: pointer;
          position: relative;
          transition: background 0.3s ease;
          user-select: none;
          .client-info {
            display: inline-block;
            margin-left: 8px;
            .client-name {
              display: block;
              font-size: $font-size--body;
              font-weight: 500;
              color: var(--color-text-title);
              max-width: 150px;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
          }
          .ssl-tag {
            position: absolute;
            right: 0;
            top: 0;
            width: 0;
            height: 0;
            border-top: 36px solid var(--color-main-green);
            border-left: 36px solid transparent;
            div {
              position: absolute;
              top: -32px;
              right: -1px;
              font-size: 12px;
              transform: rotate(45deg);
              color: #fff;
            }
          }
          .new-msg-count {
            margin-right: 8px;
            min-width: 18px;
            height: 18px;
            line-height: 18px;
            background: var(--color-main-green);
            border-radius: 9px;
            padding: 0 6px;
            color: #fff;
            font-size: $font-size--tips;
            text-align: center;
          }
          .connection-status {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: var(--color-bg-item_status);
            vertical-align: top;
            margin-top: 8px;
            &.online {
              background: var(--color-main-green);
            }
          }
        }
        .custom-tree-node-folder {
          width: 100%;
          height: 36px;
          @include flex-space-between;
        }
      }
    }
  }
  .connection-topbar {
    @include flex-space-between;
    min-height: 10px;
    padding: 0 4px;
    border-bottom: 1px solid var(--color-border-default);
    i {
      font-size: 18px;
    }
    .connection-titlebar {
      padding: 16px;
    }
    .connection-tailbar {
      .new-folder-btn,
      .collapse-folder-btn {
        margin-right: 12px;
      }
    }
  }
}
</style>
