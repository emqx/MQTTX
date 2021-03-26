<template>
  <div class="connection-container">
    <div class="connection-topbar">
      <h1 class="connection-titlebar">{{ $t('connections.connections') }}</h1>
      <div>
        <!-- topbar left icon -->
      </div>
      <div class="connection-tailbar">
        <el-tooltip
          placement="bottom"
          :effect="theme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="$t('connections.newFolder')"
        >
          <a class="new-folder-btn" href="javascript:;" @click="handleNewCollectionOnTop">
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
        <el-tree
          draggable
          ref="tree"
          :data="treeData"
          node-key="id"
          highlight-current
          default-expand-all
          :current-node-key="connectionId"
          @node-drop="handleDrop"
          :allow-drop="allowDrop"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <div v-if="data.isEdit">
              <!-- <el-input></el-input> -->
              <el-input
                size="small"
                @blur="handleEditCompeleted(data)"
                @keyup.enter.native="handleEditCompeleted(data)"
                @keyup.esc.native="handleEditCancel(node, data)"
                v-model="data.name"
              ></el-input>
            </div>
            <!-- connection -->
            <div
              v-else-if="!data.isFolder"
              class="connection-item"
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
            <div
              v-else
              class="custom-tree-node-folder"
              @click="handleSelectCollection(data)"
              @contextmenu="handleCollectionContextMenu($event, data)"
            >
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
      <contextmenu :visible.sync="showCollectionsContextmenu" v-bind="collectionsContextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleNewCollection">
          <i class="el-icon-plus"></i>{{ $t('connections.newCollection') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDeleteCollection">
          <i class="iconfont icon-delete"></i>{{ $t('connections.deleteCollection') }}
        </a>
        <a href="javascript:;" class="context-menu__item" @click="handleRenameCollection">
          <i class="iconfont icon-edit"></i>{{ $t('connections.renameCollection') }}
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
import getCollectionId from '@/utils/getCollectionId'
import _ from 'lodash'
import { setConnectionCollection } from '@/api/connection'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public ConnectionModelData!: ConnectionModel[] | []
  @Prop({ required: false }) public ModelFolderData!: ConnectionModelFolder[] | []
  @Prop({ required: true }) public connectionId!: string

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme

  private showContextmenu: boolean = false
  private showCollectionsContextmenu: boolean = false
  private selectedConnection: ConnectionModel | null = null
  private selectedCollection: ConnectionModelFolder | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private collectionsContextmenuConfig: ContextmenuModel = {
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
  @Watch('showCollectionsContextmenu')
  private handleShowCollectionContextMenuChange(val: boolean) {
    if (!val) {
      this.selectedCollection = null
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

  // flush the Collection change to local storage
  private async flushCollectionChange() {
    const tree = _.cloneDeep(this.treeData)
    const travelCollection = (treeElements: ConnectionModelTree[]) => {
      const res = [] as ConnectionModelFolder[]
      if (!treeElements || (treeElements && !treeElements.length)) {
        return [] as ConnectionModelFolder[]
      }
      treeElements.forEach((el: ConnectionModelTree) => {
        if (el.isFolder) {
          const curCollection = _.cloneDeep(el) as ConnectionModelFolder
          const curCollectionChildren = _.cloneDeep(travelCollection(el.children))
          curCollection.children = curCollectionChildren
          res.push(curCollection)
        }
      })
      return res
    }
    const CollectionsData = travelCollection(tree)

    const res = await setConnectionCollection(CollectionsData)
    if (!res) {
      this.$log.error('Async Collection change failed')
    }
  }

  private handleDrop(
    draggingNode: TreeNode<ConnectionModelFolder['id'], ConnectionModelFolder>,
    dropNode: TreeNode<ConnectionModelFolder['id'], ConnectionModelFolder>,
    position: 'before' | 'after' | 'inner',
    event: $TSFixed,
  ) {
    // set to db.json
    this.flushCollectionChange()
  }

  private loadData() {
    const connections: ConnectionModel[] = this.ConnectionModelData
    const folders: ConnectionModelFolder[] = this.ModelFolderData
    // let treeData: ConnectionModelTree[] = []
    if (!folders || (folders && !folders.length)) {
      // this.treeData = [...connections]
      this.treeData = _.cloneDeep(connections)
      return
    }
    this.treeData = _.cloneDeep(folders)
    connections.forEach((connection: ConnectionModel) => {
      const curConnectionFolderId = connection.folderId
      if (curConnectionFolderId) {
        // current connection in a collection
        const findCollection = (treeElements: ConnectionModelTree[], connection: ConnectionModel) => {
          treeElements.forEach((e: ConnectionModelTree) => {
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

        findCollection(this.treeData, connection)
      } else {
        // current connection not in any connection
        ;(this.treeData as ConnectionModelTree[]).push(connection as ConnectionModel)
      }
    })
    return
  }

  private handleEditCompeleted(data: ConnectionModelFolder) {
    data.isEdit = false
  }

  private handleEditCancel(node: $TSFixed, data: ConnectionModelFolder) {
    const parent = node.parent
    const children = parent.data.children || parent.data
    const index = children.findIndex((d: ConnectionModelTree) => d.id === data.id)
    children.splice(index, 1)
    this.treeData = [...this.treeData]
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
    this.handleConnectionTreeClick(row)
    this.initUnreadMessageCount(row.id as string)
    if (this.$route.name === 'newWindow') {
      return
    }
    this.$router.push({ path: `/recent_connections/${row.id}` })
  }

  private handleSelectCollection(row: ConnectionModelTree) {
    this.handleConnectionTreeClick(row)
  }

  private handleConnectionTreeClick(treeNode: ConnectionModelTree) {
    if (treeNode.isFolder) {
      this.selectedCollection = treeNode
      this.selectedConnection = null
    } else {
      this.selectedConnection = treeNode
      this.selectedCollection = null
    }
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

  private handleCollectionContextMenu(event: MouseEvent, row: ConnectionModelFolder) {
    if (!this.showCollectionsContextmenu) {
      const { clientX, clientY } = event
      this.collectionsContextmenuConfig.top = clientY
      this.collectionsContextmenuConfig.left = clientX
      this.showCollectionsContextmenu = true
      this.selectedCollection = row
    } else {
      this.showCollectionsContextmenu = false
    }
  }

  private initUnreadMessageCount(id: string) {
    this.unreadMessageIncrement({ id, unreadMessageCount: 0 })
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

  private handleNewCollection() {
    if (this.selectedCollection) {
      const collectionChildren = this.selectedCollection.children as ConnectionModelFolder[]
      collectionChildren.push({
        id: getCollectionId(),
        name: '',
        isFolder: true,
        children: [],
        isEdit: true,
      })
    } else if (this.selectedConnection) {
      //TODO: find father and add collection
    }
    this.flushCollectionChange()
    this.showCollectionsContextmenu = false
  }
  private handleNewCollectionOnTop() {
    const treeRef = this.treeData as ConnectionModelTree[]
    treeRef.push({
      id: getCollectionId(),
      name: '',
      isFolder: true,
      children: [],
      isEdit: true,
    })
    this.flushCollectionChange()
  }

  private handleDeleteCollection() {
    //TODO:rename feature
  }

  private handleRenameCollection() {
    if (this.selectedCollection) {
      this.selectedCollection.isEdit = true
    }
    this.showCollectionsContextmenu = false
  }

  private mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.loadData()
      })
    })
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
