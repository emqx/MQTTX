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
          :content="$t('connections.newCollection')"
        >
          <a class="new-collection-btn" href="javascript:;" @click="handleNewCollectionOnTop">
            <i class="el-icon-folder-add"></i>
          </a>
        </el-tooltip>
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
          default-expand-all
          @node-drop="handleDrop"
          @node-drag-end="handleDragEnd"
          :allow-drop="allowDrop"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <div v-if="data.isEdit">
              <el-input
                size="small"
                @blur="handleEditCompeleted(node, data)"
                @keyup.enter.native="handleEditCompeleted(node, data)"
                @keyup.esc.native="handleEditCancel(node, data)"
                :placeholder="$t('connections.collectionPlaceholder')"
                v-model="data.name"
              ></el-input>
            </div>
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
            <!-- collection -->
            <div
              v-else
              class="custom-tree-node-collection"
              @click="handleSelectCollection(data)"
              @contextmenu="handleCollectionContextMenu($event, data)"
            >
              <div class="collection-name">
                <i v-if="!node.expanded" class="el-icon-folder"> </i>
                <i v-else class="el-icon-folder-opened"> </i>
                <span>{{ data.name }}</span>
              </div>
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
import { ConnectionModel, ContextmenuModel, ConnectionModelCollection, ConnectionModelTree } from './types'
import { ipcRenderer } from 'electron'
import { TreeNode, ElTree } from 'element-ui/types/tree'
import getCollectionId from '@/utils/getCollectionId'
import _ from 'lodash'
import { setConnectionCollection, updateConnectionCollectionId } from '@/api/connection'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Prop({ required: true }) public ConnectionModelData!: ConnectionModel[] | []
  @Prop({ required: false }) public CollectionModelData!: ConnectionModelCollection[] | []

  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void

  @Getter('activeConnection') private activeConnection: Client | undefined
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme

  private connectionId: string = this.$route.params.id
  private showContextmenu: boolean = false
  private showCollectionsContextmenu: boolean = false
  private selectedConnection: ConnectionModel | null = null
  private selectedCollection: ConnectionModelCollection | null = null
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
  private handleConnectionModelDataChange() {
    this.loadData()
  }
  @Watch('$route.params.id')
  private handleConnectionIdChanged(id: string) {
    if (id) {
      const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
      treeRef.setCurrentKey(id)
      this.connectionId = id
    }
  }

  private allowDrop(
    draggingNode: TreeNode<ConnectionModelCollection['id'], ConnectionModelCollection>,
    dropNode: TreeNode<ConnectionModelCollection['id'], ConnectionModelCollection>,
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
    // get Collection without connection children
    const travelCollection = (treeElements: ConnectionModelTree[]) => {
      const res = [] as ConnectionModelCollection[]
      if (!treeElements || !treeElements.length) {
        return [] as ConnectionModelCollection[]
      }
      treeElements.forEach((el: ConnectionModelTree) => {
        if (el.isCollection) {
          const curCollection = _.cloneDeep(el) as ConnectionModelCollection
          const curCollectionChildren = _.cloneDeep(travelCollection(el.children))
          curCollection.isEdit = false
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

  private handleDragEnd(
    draggingNode: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>,
    dropNode: TreeNode<ConnectionModelCollection['id'], ConnectionModelCollection>,
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

  private handleDrop(
    draggingNode: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>,
    dropNode: TreeNode<ConnectionModelCollection['id'], ConnectionModelCollection>,
    position: 'before' | 'after' | 'inner',
  ) {
    // handle connection
    if (!draggingNode || !draggingNode.data || !dropNode || !dropNode.data || !draggingNode.data.id) {
      return
    }
    if (!draggingNode.data.isCollection) {
      switch (position) {
        case 'inner':
          draggingNode.data.collectionId = dropNode.data.id
          updateConnectionCollectionId(draggingNode.data.id, dropNode.data.id)
          break
        default:
          if (!dropNode.parent) return
          draggingNode.data.collectionId = Array.isArray(dropNode.parent.data) ? null : dropNode.parent.data.id
          updateConnectionCollectionId(draggingNode.data.id, dropNode.parent.data.id)
          break
      }
    }
    // set to db.json
    this.flushCollectionChange()
  }

  private loadData() {
    const { id } = this.$route.params
    const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
    this.$nextTick(() => {
      if (id) {
        treeRef.setCurrentKey(id)
        this.connectionId = id
      }
    })

    const connections: ConnectionModel[] = _.cloneDeep(this.ConnectionModelData)
    const collections: ConnectionModelCollection[] = _.cloneDeep(this.CollectionModelData)

    if (!collections || !collections.length) {
      this.treeData = connections
      return
    } else {
      this.treeData = collections
      connections.forEach((el: ConnectionModel) => {
        const curConnectionCollectionId = el.collectionId
        if (curConnectionCollectionId) {
          // current connection in a collection
          const findCollection = (treeElements: ConnectionModelTree[], connection: ConnectionModel) => {
            treeElements.forEach((treeNode: ConnectionModelTree) => {
              if (treeNode.isCollection) {
                const children = treeNode.children as ConnectionModelTree[]
                if (treeNode.id === curConnectionCollectionId) {
                  // found cur connection's collection
                  children.push(connection)
                } else {
                  if (!children.length) {
                    return
                  }
                  findCollection(treeNode.children, connection)
                }
              }
            })
          }
          findCollection(this.treeData, el)
        } else {
          // current connection not in any connection
          ;(this.treeData as ConnectionModelTree[]).push(el as ConnectionModel)
        }
      })
    }
    return
  }

  private handleEditCompeleted(node: $TSFixed, data: ConnectionModelCollection) {
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

  private handleEditCancel(node: $TSFixed, data: ConnectionModelCollection) {
    const parent = node.parent
    const children = parent.data.children || parent.data
    const index = children.findIndex((d: ConnectionModelTree) => d.id === data.id)
    children.splice(index, 1)
    this.flushCollectionChange()
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

  private handleCollectionContextMenu(event: MouseEvent, row: ConnectionModelCollection) {
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
      const collectionChildren = this.selectedCollection.children as ConnectionModelCollection[]
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
        : (nodeParent as ConnectionModelCollection).children
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
          treeNode.collectionId = null
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

  private mounted() {
    this.loadData()
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
    padding: 0 4px;
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
      }
    }
  }
  .connections-list {
    height: calc(100% - 59px);
    .el-tree {
      height: 100%;
      background-color: var(--color-bg-primary);
      .el-tree-node__content {
        height: 100%;
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
              margin-right: 28px;
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
              i {
                font-size: 18px;
                color: #c0c4cc;
                padding-right: 6px;
              }
            }
          }
        }
      }

      // arrow icon
      .el-icon-caret-right:before,
      .expanded:before {
        // not expanded
        content: '\e6e0';
        font-size: 14px;
      }
      .expanded {
        // transform rotate
        -webkit-transform: rotate(90deg);
        transform: rotate(90deg);
      }
    }
  }
}
</style>
