<template>
  <div class="connection-container">
    <div class="connection-topbar">
      <h1 class="connection-titlebar">{{ $t('connections.connections') }}</h1>
      <div class="connection-tailbar">
        <el-button class="btn new-collection-btn" plain type="outline" size="mini" @click="handleNewCollectionOnTop">
          {{ $t('connections.newCollection') }}
        </el-button>
      </div>
    </div>
    <div class="connections-list">
      <template>
        <el-tree
          :indent="4"
          draggable
          ref="tree"
          :data="treeData"
          node-key="id"
          highlight-current
          @node-drop="handleDrop"
          @node-drag-end="handleDragEnd"
          @node-click="handleNodeExpand"
          :allow-drop="allowDrop"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <el-input
              v-if="data.isEdit"
              ref="newCollectionInput"
              size="small"
              @blur="handleEditCompeleted(node, data)"
              @keyup.enter.native="handleEditCompeleted(node, data)"
              @keyup.esc.native="handleEditCancel(node, data)"
              :placeholder="$t('connections.collectionPlaceholder')"
              v-model="data.name"
            ></el-input>
            <!-- connection -->
            <div
              v-else-if="!data.isCollection"
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
                    <div
                      :class="[
                        'client-name',
                        {
                          online: activeConnection[data.id] ? activeConnection[data.id].client.connected : false,
                        },
                      ]"
                    >
                      {{ data.name }}@{{ data.host }}:{{ data.port }}
                    </div>
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
            <!-- collection -->
            <div
              v-else
              class="custom-tree-node-collection"
              @click="handleSelectCollection(data)"
              @contextmenu="handleCollectionContextMenu($event, data)"
            >
              <div class="collection-name">
                <svg class="icon" aria-hidden="true">
                  <use :xlink:href="!node.expanded ? '#icon-fold' : '#icon-unfold'"></use>
                </svg>
                <span>{{ data.name }}</span>
              </div>
            </div>
          </span>
        </el-tree>
      </template>
      <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleNewWindow">
          <i class="iconfont icon-a-newwindow"></i>{{ $t('common.newWindow') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDelete">
          <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
        </a>
      </contextmenu>
      <contextmenu :visible.sync="showCollectionsContextmenu" v-bind="collectionsContextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleNewCollection">
          <i class="iconfont icon-new"></i>{{ $t('connections.newCollection') }}
        </a>
        <a href="javascript:;" class="context-menu__item" @click="handleRenameCollection">
          <i class="iconfont icon-edit"></i>{{ $t('connections.renameCollection') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDeleteCollection">
          <i class="iconfont icon-delete"></i>{{ $t('connections.deleteCollection') }}
        </a>
      </contextmenu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import Contextmenu from '@/components/Contextmenu.vue'
import { ipcRenderer } from 'electron'
import { TreeNode, ElTree } from 'element-ui/types/tree'
import getCollectionId from '@/utils/getCollectionId'
import _ from 'lodash'
import { updateConnectionCollectionId } from '@/api/connection'
import { sortConnectionTree } from '@/utils/connections'
import '@/assets/font/iconfont'
import useServices from '@/database/useServices'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public ConnectionModelData!: ConnectionModel[] | []

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void
  @Action('SET_CONNECTIONS_TREE') private setConnectionsTree!: (payload: ConnectionTreeState) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme
  @Getter('connectionTreeState') private treeState!: ConnectionTreeStateMap

  private connectionId: string = this.$route.params.id
  private showContextmenu: boolean = false
  private showCollectionsContextmenu: boolean = false
  private selectedConnection: ConnectionModel | null = null
  private selectedCollection: CollectionModel | null = null
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
  @Watch('ConnectionModelData')
  private async handleConnectionModelDataChange() {
    await this.loadData()
  }
  @Watch('$route.params.id')
  private handleConnectionIdChanged(id: string) {
    if (id) {
      const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
      treeRef.setCurrentKey(id)
      this.connectionId = id
    }
  }

  private handleNodeExpand(data: ConnectionModelTree, node: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>) {
    if (data && node && data.isCollection) {
      if (!data.id) return
      this.setConnectionsTree({
        id: data.id,
        expanded: node.expanded,
      } as ConnectionTreeState)
    }
  }

  private loadConnectionState() {
    const treeRef = this.$refs.tree as $TSFixed // nodesMap is not an export function
    const treeState = this.treeState as ConnectionTreeStateMap
    if (!treeRef || !treeState) return

    const nodes = treeRef.store.nodesMap
    for (const id in nodes) {
      if (treeState[id] && treeState[id].expanded) {
        nodes[id].expanded = treeState[id].expanded || false
      }
    }
  }

  private allowDrop(
    draggingNode: TreeNode<CollectionModel['id'], CollectionModel>,
    dropNode: TreeNode<CollectionModel['id'], CollectionModel>,
    type: 'prev' | 'inner' | 'next',
  ) {
    if (!dropNode.data.isCollection) {
      // drag node to connction is not allowed
      return type !== 'inner'
    }
    return true
  }

  // flush the Collection change to local storage
  private async flushCollectionChange() {
    const tree = _.cloneDeep(this.treeData)
    const { collectionService } = useServices()
    const res = await collectionService.setAll(tree)
    if (!res) {
      this.$log.error('Async Collection change failed')
    }
  }

  private handleDragEnd(
    draggingNode: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>,
    dropNode: TreeNode<CollectionModel['id'], CollectionModel>,
    position: 'before' | 'after' | 'inner',
    event: MouseEvent,
  ) {
    const { clientX, clientY } = event
    ipcRenderer.send('getWindowSize')
    const ipcHandler = (event: Electron.Event, ...args: any[]) => {
      const { height, width } = args[0]
      if (clientX > width || clientX < 0 || clientY > height || clientY < 0) {
        ipcRenderer.send('newWindow', draggingNode.data.id)
        ipcRenderer.removeListener('getWindowSize', ipcHandler)
      }
    }
    const id = ipcRenderer.on('getWindowSize', ipcHandler)
    this.showContextmenu = false
  }

  private async handleDrop(
    draggingNode: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>,
    dropNode: TreeNode<CollectionModel['id'], CollectionModel>,
    position: 'before' | 'after' | 'inner',
  ) {
    // handle connection
    if (!draggingNode || !draggingNode.data || !dropNode || !dropNode.data || !draggingNode.data.id) {
      return
    }
    if (!draggingNode.data.isCollection) {
      const { connectionService } = useServices()
      switch (position) {
        case 'inner':
          draggingNode.data.parentId = dropNode.data.id
          updateConnectionCollectionId(draggingNode.data.id, dropNode.data.id)
          await connectionService.updateCollectionId(draggingNode.data.id, dropNode.data.id)
          break
        default:
          if (!dropNode.parent) return
          draggingNode.data.parentId = Array.isArray(dropNode.parent.data) ? null : dropNode.parent.data.id
          updateConnectionCollectionId(draggingNode.data.id, dropNode.parent.data.id)
          await connectionService.updateCollectionId(draggingNode.data.id, dropNode.parent.data.id)
          break
      }
    }
    // set to db.json
    this.flushCollectionChange()
  }

  private async loadData() {
    //load collection expanded state
    this.$nextTick(() => {
      this.loadConnectionState()
    })

    //load selected connection active state
    const { id } = this.$route.params
    const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
    this.$nextTick(() => {
      if (id) {
        treeRef.setCurrentKey(id)
        this.connectionId = id
      }
    })
    const { collectionService } = useServices()
    const treeData: ConnectionModelTree[] | undefined = await collectionService.getAll()
    treeData && (this.treeData = treeData)
    // sort collection trees
    this.treeData.forEach((el: ConnectionModelTree) => {
      if (el.isCollection) {
        sortConnectionTree(el.children)
      }
    })
    sortConnectionTree(this.treeData)
    return
  }

  private handleEditCompeleted(node: TreeNode<'id', CollectionModel>, data: CollectionModel) {
    if (!this.handleCollectionNameValidate(data.name)) {
      this.handleEditCancel(node, data)
    } else if (data) {
      data.isEdit = false
      this.flushCollectionChange()
    }
  }

  private handleCollectionNameValidate(name: string): boolean {
    return name && !name.match(/(^\s+$)/g) ? true : false
  }

  private handleEditCancel(node: TreeNode<'id', CollectionModel>, data: CollectionModel) {
    const parent = node.parent
    if (parent) {
      const children = parent.data.children || parent.data
      const index = children.findIndex((d: ConnectionModelTree) => d.id === data.id)
      children.splice(index, 1)
      this.flushCollectionChange()
    }
  }

  private handleSelectConnection(row: ConnectionModel) {
    this.handleConnectionTreeClick(row)
    if (row.id) {
      this.initUnreadMessageCount(row.id.toString() as string)
    }
    if (this.$route.name === 'newWindow') {
      return
    }
    this.$router.push({ path: `/recent_connections/${row.id}` })
  }

  private handleSelectCollection(row: ConnectionModelTree) {
    this.handleConnectionTreeClick(row)
  }

  private handleConnectionTreeClick(treeNode: ConnectionModelTree) {
    if (treeNode.isCollection) {
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

  private handleCollectionContextMenu(event: MouseEvent, row: CollectionModel) {
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
      const collectionChildren = this.selectedCollection.children as CollectionModel[]
      collectionChildren.push({
        id: getCollectionId(),
        name: '',
        isCollection: true,
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
      isCollection: true,
      children: [],
      isEdit: true,
    })
    this.$nextTick(() => {
      const newCollectionInputDom = this.$refs.newCollectionInput as Vue
      if (newCollectionInputDom) {
        const input = newCollectionInputDom.$el.children[0] as HTMLElement
        input.focus()
      }
    })
    this.flushCollectionChange()
  }

  private getTreeNodeParent(node: ConnectionModelTree): ConnectionModelTree | ConnectionModelTree[] | null {
    let findRes = false
    let res: ConnectionModelTree | ConnectionModelTree[] | null = null
    const treeData = this.treeData
    treeData.forEach((treeNode: ConnectionModelTree) => {
      if (treeNode.id === node.id) {
        findRes = true
        res = treeData
        return
      }
    })
    if (!findRes) {
      const treeTravel = (rootNode: ConnectionModelTree, parentNode: ConnectionModelTree | null) => {
        if (rootNode.id === node.id) {
          findRes = true
          res = parentNode
        }
        if (rootNode.isCollection) {
          rootNode.children.forEach((element) => {
            treeTravel(element, rootNode)
          })
        }
      }
      //travel tree to get parent
      treeData.forEach((treeNode: ConnectionModelTree) => {
        treeTravel(treeNode, null)
      })
    }
    if (!findRes) {
      return this.treeData
    }
    return res
  }

  private handleDeleteCollection() {
    const selectedCollection = this.selectedCollection
    if (selectedCollection && selectedCollection.isCollection) {
      const nodeParent: ConnectionModelTree[] | ConnectionModelTree = this.getTreeNodeParent(selectedCollection) as
        | ConnectionModelTree[]
        | ConnectionModelTree
      const childrenNode: ConnectionModelTree[] = Array.isArray(nodeParent)
        ? nodeParent
        : (nodeParent as CollectionModel).children
      // delete collection
      const index = childrenNode.findIndex((d: ConnectionModelTree) => d.id === selectedCollection.id)
      const deletedNode = childrenNode.splice(index, 1)
      // delete the chilren
      const treeTravel = (treeNode: ConnectionModelTree) => {
        if (treeNode.isCollection) {
          treeNode.children.forEach((treeNode: ConnectionModelTree) => {
            treeTravel(treeNode)
          })
        } else {
          treeNode.parentId = null
          this.$emit('delete', treeNode)
        }
      }
      treeTravel(deletedNode[0])
      this.flushCollectionChange()
    }

    this.showCollectionsContextmenu = false
  }

  private handleRenameCollection() {
    if (this.selectedCollection) {
      this.selectedCollection.isEdit = true
    }
    this.showCollectionsContextmenu = false
  }

  private async mounted() {
    await this.loadData()
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';
.connection-container {
  height: 100%;
  width: 100%;
  .connection-topbar {
    @include flex-space-between;
    min-height: 10px;
    height: 59px;
    -webkit-app-region: drag;
    i {
      font-size: 18px;
    }
    .connection-titlebar {
      padding: 16px;
    }
    .connection-tailbar {
      .new-collection-btn,
      .collapse-collection-btn {
        margin-right: 12px;
        padding: 6px;
        border-width: 1px;
        background: transparent;
      }
    }
  }
  .connections-list {
    height: calc(100% - 59px);
    .el-tree {
      height: 100%;
      background-color: var(--color-bg-normal);
      .is-current > .el-tree-node__content {
        background-color: var(--color-bg-item);
      }
      .el-tree-node__content {
        height: 100%;
        margin: 0 8px;
        border-radius: 8px;
        &:hover {
          background-color: var(--color-bg-item);
        }
        .custom-tree-node {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          .connection-item {
            @include flex-space-between;
            height: 48px;
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
                &.online {
                  color: var(--color-main-green);
                }
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
                color: var(--color-text-active);
              }
            }
            .new-msg-count {
              margin-right: 28px;
              min-width: 18px;
              height: 18px;
              line-height: 18px;
              background: var(--color-bg-unreadmsg);
              border-radius: 9px;
              padding: 0 3px;
              color: var(--color-text-active);
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
          .custom-tree-node-collection {
            width: 100%;
            height: 48px;
            @include flex-space-between;
            .collection-name {
              display: flex;
              align-items: center;
              font-size: $font-size--body;
              font-weight: 500;
              color: var(--color-text-title);
              max-width: 150px;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              svg {
                width: 24px;
                height: 24px;
                padding-right: 6px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
