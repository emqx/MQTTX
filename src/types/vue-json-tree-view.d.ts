declare module 'vue-json-tree-view/src/TreeView.vue' {
  import Vue from 'vue'

  export interface TreeViewOptions {
    maxDepth?: number
    rootObjectKey?: string
    modifiable?: boolean
    link?: boolean
    limitRenderDepth?: boolean
  }

  interface TreeViewEvents {
    'change-data': (data: any) => void
  }

  class TreeView extends Vue {
    data: any
    options: TreeViewOptions

    $emit(event: 'change-data', data: any): this
  }

  export default TreeView
}
