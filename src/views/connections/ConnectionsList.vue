<template>
  <div class="connection-container">
    <div class="connection-topbar">
      <h1 class="connection-titlebar">{{ $t('connections.connections') }}</h1>
      <div class="connection-tailbar">
        <el-dropdown
          class="new-dropdown"
          :class="{ 'is-new-window': isNewWindow }"
          trigger="click"
          @command="handleCommand"
        >
          <a href="javascript:;" class="new-button">
            <i class="iconfont icon-a-createnew"></i>
          </a>
          <el-dropdown-menu class="connection-oper-item" slot="dropdown">
            <el-dropdown-item command="newConnection">
              {{ $t('connections.newConnections') }}
            </el-dropdown-item>
            <el-dropdown-item command="newGroup">
              {{ $t('connections.newCollection') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
    <div class="connections-list">
      <template v-if="!isLoadingData">
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
              @contextmenu.prevent="handleContextMenu(data, $event)"
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
              @contextmenu.prevent="handleCollectionContextMenu($event, data)"
            >
              <el-tooltip
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :content="`${data.name}`"
                :open-delay="500"
                placement="top"
              >
                <div class="collection-name">
                  <svg class="icon" aria-hidden="true">
                    <use :xlink:href="!node.expanded ? '#icon-fold' : '#icon-unfold'"></use>
                  </svg>
                  <span>{{ data.name }}</span>
                </div>
              </el-tooltip>
            </div>
          </span>
        </el-tree>
      </template>
      <template v-else>
        <el-skeleton class="connections-list-skeleton" :row="8" animated />
      </template>
      <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
        <a href="javascript:;" class="context-menu__item" @click="handleNewWindow">
          <i class="iconfont icon-a-newwindow"></i>{{ $t('common.newWindow') }}
        </a>
        <a href="javascript:;" class="context-menu__item" @click="handleDuplicate">
          <i class="el-icon-document-copy"></i>{{ $t('common.duplicate') }}
        </a>
        <a href="javascript:;" :class="['context-menu__item', { disabled: getDisabledStatus() }]" @click="handleEdit">
          <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
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
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import Contextmenu from '@/components/Contextmenu.vue'
import { ipcRenderer } from 'electron'
import { TreeNode, ElTree } from 'element-ui/types/tree'
import { getClientId, getCollectionId } from '@/utils/idGenerator'
import { flushCurSequenceId } from '@/utils/connections'
import { sortConnectionTree } from '@/utils/connections'
import '@/assets/font/iconfont'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import getContextmenuPosition from '@/utils/getContextmenuPosition'

@Component({
  components: {
    Contextmenu,
  },
})
export default class ConnectionsList extends Vue {
  @Action('UNREAD_MESSAGE_COUNT_INCREMENT') private unreadMessageIncrement!: (payload: UnreadMessage) => void
  @Action('SET_CONNECTIONS_TREE') private setConnectionsTree!: (payload: ConnectionTreeState) => void

  @Getter('activeConnection') private activeConnection!: ActiveConnection
  @Getter('unreadMessageCount') private unreadMessageCount: UnreadMessage | undefined
  @Getter('currentTheme') private theme!: Theme
  @Getter('connectionTreeState') private treeState!: ConnectionTreeStateMap

  private isLoadingData: boolean = false
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
  private treeData: ConnectionModelTree[] = []

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
  @Watch('$route.params.id')
  private handleConnectionIdChanged(id: string) {
    this.$nextTick(() => {
      if (id) {
        const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
        treeRef?.setCurrentKey(id)
        this.connectionId = id
        this.expandTreeNodeAncestor(id)
      }
    })
  }

  get isNewWindow() {
    return this.$route.name === 'newWindow'
  }

  private handleNodeExpand(data: ConnectionModelTree, node: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>) {
    this.showContextmenu = false
    this.showCollectionsContextmenu = false
    if (data && node && data.isCollection) {
      if (!data.id) return
      this.setConnectionsTree({
        id: data.id,
        expanded: node.expanded,
      } as ConnectionTreeState)
    }
  }

  private expandTreeNodeAncestor(id: string) {
    const tree = this.treeData
    const expandNodeIDs: string[] = []
    const travelTree = (root: ConnectionModelTree): boolean => {
      if (root.isCollection) {
        for (let i = 0; i < root.children.length; i++) {
          const child = root.children[i]
          if (child.id === id) {
            expandNodeIDs.push(root.id)
            return true
          }
          if (child.isCollection) {
            if (travelTree(child)) {
              expandNodeIDs.push(root.id)
              return true
            }
          }
        }
      }
      return false
    }
    for (let i = 0; i < tree.length; i++) {
      travelTree(tree[i])
    }

    expandNodeIDs.map((id) => {
      this.setConnectionsTree({
        id,
        expanded: true,
      } as ConnectionTreeState)
    })
  }

  private async loadConnectionState() {
    const treeRef = this.$refs.tree as $TSFixed // nodesMap is not an export function
    const treeState = this.treeState as ConnectionTreeStateMap
    if (!treeRef || !treeState) return
    const nodes = treeRef.store.nodesMap
    Object.keys(nodes).map((id: string) => {
      if (treeState[id]) {
        nodes[id].expanded = treeState[id]?.expanded ?? false
      }
    })
  }

  private allowDrop(
    draggingNode: TreeNode<CollectionModel['id'], CollectionModel>,
    dropNode: TreeNode<CollectionModel['id'], CollectionModel>,
    type: 'prev' | 'inner' | 'next',
  ) {
    let isAllow = true
    const sublings = draggingNode.parent?.childNodes
    const currentIdx = sublings?.findIndex((e) => e.data.id === draggingNode.data.id) ?? 0

    const orderSequence = function (
      data: TreeNode<CollectionModel['id'], CollectionModel>[],
      currentIdx: number,
    ): boolean {
      return data.every(
        (e, idx) =>
          (e.data.isCollection && idx < currentIdx) || (!e.data.isCollection && idx > currentIdx) || idx === currentIdx,
      )
    }
    switch (type) {
      case 'inner':
        // not allow drop into collection
        if (!dropNode.data.isCollection) {
          isAllow = false
        }
        break
      default:
        // not allow collection next connection or connection prev collection
        if (draggingNode.data.isCollection && !dropNode.data.isCollection && sublings) {
          isAllow = type === 'prev' ? orderSequence(sublings, currentIdx) : false
        } else if (!draggingNode.data.isCollection && dropNode.data.isCollection && sublings) {
          isAllow = type === 'next' ? orderSequence(sublings, currentIdx) : false
        }
        break
    }
    return isAllow
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
    ipcRenderer.on('getWindowSize', ipcHandler)
  }

  private async handleDrop(
    draggingNode: TreeNode<ConnectionModelTree['id'], ConnectionModelTree>,
    dropNode: TreeNode<CollectionModel['id'], CollectionModel>,
    position: 'before' | 'after' | 'inner',
  ) {
    this.showContextmenu = false
    this.showCollectionsContextmenu = false
    // handle connection
    if (!draggingNode || !draggingNode.data || !dropNode || !dropNode.data || !draggingNode.data.id) {
      return
    }
    const { connectionService, collectionService } = useServices()
    switch (position) {
      case 'inner':
        if (draggingNode.data.isCollection) {
          await collectionService.updateCollectionId((draggingNode.data as CollectionModel).id, dropNode.data.id)
        } else {
          await connectionService.updateCollectionId(draggingNode.data.id, dropNode.data.id)
        }
        break
      default:
        const parentId = dropNode.parent?.data.id ?? null
        if (draggingNode.data.isCollection) {
          await collectionService.updateCollectionId((draggingNode.data as CollectionModel).id, parentId)
        } else {
          await connectionService.updateCollectionId(draggingNode.data.id, parentId)
        }
        break
    }
    await flushCurSequenceId(this.treeData)
  }

  public async loadData(firstLoad: boolean = false) {
    firstLoad && (this.isLoadingData = true)
    const { collectionService } = useServices()
    const treeData: ConnectionModelTree[] = (await collectionService.getAll()) ?? []
    this.treeData = treeData
    // Only display the single connection.
    if (this.isNewWindow) {
      const id = this.$route.params.id
      const findConnection = (id: string, data: ConnectionModelTree[]): ConnectionModelTree => {
        let res!: ConnectionModelTree
        data.some(($) => ($.id === id && (res = $)) || ($.isCollection && (res = findConnection(id, $.children))))
        return res
      }
      const res = findConnection(id, this.treeData)
      this.treeData = [res]
    }
    // sort collection trees
    const sortTree = () => {
      this.treeData.forEach((el: ConnectionModelTree) => {
        if (el.isCollection) {
          sortConnectionTree(el.children)
        }
      })
      sortConnectionTree(this.treeData)
    }
    sortTree()
    firstLoad && (this.isLoadingData = false)

    // load selected connection active state
    const { id } = this.$route.params
    this.$nextTick(() => {
      const treeRef = this.$refs.tree as ElTree<ConnectionModelTree['id'], ConnectionModelTree>
      if (id) {
        treeRef?.setCurrentKey(id)
        this.connectionId = id
      }
    })

    //load collection expanded state
    this.$nextTick(() => {
      this.expandTreeNodeAncestor(id)
      this.loadConnectionState()
    })

    return
  }

  private async handleEditCompeleted(node: TreeNode<'id', CollectionModel>, data: CollectionModel) {
    if (!data) return
    const { collectionService } = useServices()
    if (!this.handleCollectionNameValidate(data.name)) {
      await this.handleEditCancel(node, data)
    } else {
      await collectionService.update(data, node.parent?.data.id)
      await this.loadData(false)
    }
    data.isEdit = false
    data.isNewing = false
  }

  private handleCollectionNameValidate(name: string): boolean {
    return (name ? true : false) && !/(^\s+$)/g.test(name)
  }

  private async handleEditCancel(node: TreeNode<'id', CollectionModel>, data: CollectionModel) {
    const { collectionService } = useServices()
    if (data.isNewing) {
      //remove because it's new
      const parent = node.parent
      if (parent) {
        const children = parent.data.children || parent.data
        const index = children.findIndex((d: ConnectionModelTree) => d.id === data.id)
        children.splice(index, 1)
        await collectionService.delete(data.id)
      }
    } else {
      await collectionService.update(data)
    }
    data.isEdit = false
    data.isNewing = false
    await this.loadData(false)
  }

  private handleSelectConnection(row: ConnectionModel) {
    this.handleConnectionTreeClick(row)
    if (row.id) {
      this.initUnreadMessageCount(row.id.toString() as string)
    }
    if (this.isNewWindow) {
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
    if (this.isNewWindow) {
      return
    }
    if (!this.showContextmenu) {
      const { x, y } = getContextmenuPosition(event as MouseEvent, 140, 160)
      this.contextmenuConfig.left = x
      this.contextmenuConfig.top = y
      this.showContextmenu = true
      this.showCollectionsContextmenu = false
      this.selectedConnection = row
    } else {
      this.showContextmenu = false
    }
  }

  private handleCollectionContextMenu(event: MouseEvent, row: CollectionModel) {
    if (!this.showCollectionsContextmenu) {
      const { x, y } = getContextmenuPosition(event as MouseEvent, 150, 130)
      this.collectionsContextmenuConfig.left = x
      this.collectionsContextmenuConfig.top = y
      this.showCollectionsContextmenu = true
      this.showContextmenu = false
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

  private getDisabledStatus() {
    const id = this.selectedConnection?.id
    let disabled = false
    if (id) {
      const currConnect = this.activeConnection[id]
      if (currConnect && currConnect.client.connected) {
        disabled = true
      }
    }
    return disabled
  }

  private handleEdit() {
    const disabled = this.getDisabledStatus()
    if (disabled) {
      return
    }
    const id = this.selectedConnection?.id
    this.showContextmenu = false
    this.$router.push({
      path: `/recent_connections/${id}`,
      query: { oper: 'edit' },
    })
  }

  private async handleDuplicate() {
    const id = this.selectedConnection?.id
    if (!id) {
      return
    }
    const copyName = (name: string) => {
      if (name.includes('copy')) {
        const num = parseInt(name.match(/\d+/g)?.[0] || '0', 10)
        return `${name.replace(/\d+/g, '')}${num + 1}`
      }
      return `${name}_copy`
    }
    const { connectionService } = useServices()
    const res: ConnectionModel | undefined = await connectionService.get(id)
    if (res) {
      const { id, createAt, updateAt, ...restConnection } = res
      if (restConnection.will?.id) {
        delete restConnection.will.id
      }
      restConnection.messages = []
      restConnection.clientId = getClientId()
      restConnection.subscriptions = []
      restConnection.name = copyName(res.name)
      try {
        const newConnection = await connectionService.create({
          ...restConnection,
          createAt: time.getNowDate(),
          updateAt: time.getNowDate(),
        })
        this.$log.info(`${res.name} has been duplicated as ${newConnection?.name}`)
        this.$message.success(
          this.$t('connections.duplicated', {
            name: newConnection?.name,
            oldName: res.name,
          }) as string,
        )
        this.loadData(false)
        this.$router.push({
          path: `/recent_connections/${newConnection?.id}`,
        })
      } catch (error) {
        const err = error as Error
        // @ts-ignore
        this.$message.error(err.toString())
      } finally {
        this.showContextmenu = false
      }
    }
  }

  private async handleNewCollection() {
    const newCollection: CollectionModel = {
      id: getCollectionId(),
      name: '',
      isCollection: true,
      children: [],
      isEdit: true,
    }
    const { collectionService } = useServices()
    await collectionService.add(newCollection, this.selectedCollection?.id)
    if (this.selectedCollection) {
      const collectionChildren = this.selectedCollection.children as CollectionModel[]
      newCollection.isNewing = true
      collectionChildren.push(newCollection)
    }
    this.showCollectionsContextmenu = false
  }

  private async handleNewCollectionOnTop() {
    const treeRef = this.treeData as ConnectionModelTree[]
    const newCollection = {
      id: getCollectionId(),
      name: '',
      isCollection: true,
      children: [],
      isEdit: true,
    } as CollectionModel
    const { collectionService } = useServices()
    await collectionService.add(newCollection)
    treeRef.push(newCollection)
    newCollection.isNewing = true
    this.$nextTick(() => {
      const newCollectionInputDom = this.$refs.newCollectionInput as Vue
      if (newCollectionInputDom) {
        const input = newCollectionInputDom.$el.children[0] as HTMLElement
        input.focus()
      }
    })
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

  private async handleDeleteCollection() {
    const selectedCollection = this.selectedCollection
    if (selectedCollection && selectedCollection.isCollection) {
      const { name } = selectedCollection
      const confirmDelete: string = this.$t('common.confirmDelete', { name }) as string
      this.$confirm(confirmDelete, this.$tc('common.warning'), {
        type: 'warning',
      })
        .then(async () => {
          const nodeParent: ConnectionModelTree[] | ConnectionModelTree = this.getTreeNodeParent(selectedCollection) as
            | ConnectionModelTree[]
            | ConnectionModelTree
          const childrenNode: ConnectionModelTree[] = Array.isArray(nodeParent)
            ? nodeParent
            : (nodeParent as CollectionModel).children
          // delete collection
          const index = childrenNode.findIndex((d: ConnectionModelTree) => d.id === selectedCollection.id)
          childrenNode.splice(index, 1)
          // delete the chilren
          const { collectionService } = useServices()
          await collectionService.delete(selectedCollection.id)
          this.$message.success(this.$tc('common.deleteSuccess'))
          this.$log.info(`${name} collection was successfully deleted`)
          this.$emit('reload')
        })
        .catch((error) => {
          this.$log.error(error.toString())
        })
    }
    this.showCollectionsContextmenu = false
  }

  private handleRenameCollection() {
    if (this.selectedCollection) {
      this.selectedCollection.isEdit = true
    }
    this.showCollectionsContextmenu = false
  }

  private handleCommand(command: 'newConnection' | 'newGroup') {
    switch (command) {
      case 'newConnection':
        this.$router.push('/recent_connections/0?oper=create')
        break
      case 'newGroup':
        this.handleNewCollectionOnTop()
        break
      default:
        break
    }
  }

  private mounted() {
    this.loadData(true)
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
    .new-dropdown {
      margin-right: 16px;
      &.is-new-window {
        display: none;
      }
      .new-button {
        .icon-a-createnew {
          font-size: 20px;
          color: var(--color-text-title);
        }
      }
    }
    .connection-titlebar {
      padding: 16px;
    }
  }
  .connections-list {
    height: calc(100% - 59px);
    overflow-y: hidden;
    &:hover {
      overflow-y: overlay;
    }
    .connections-list-skeleton {
      margin: 0 16px;
    }
    .el-icon-document-copy {
      font-size: 16px;
    }
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
              svg {
                width: 24px;
                height: 24px;
                padding-right: 6px;
                flex-shrink: 0;
              }
              span {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
            }
          }
        }
      }
    }
  }
}
</style>
